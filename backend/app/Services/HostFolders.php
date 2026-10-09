<?php

declare(strict_types=1);

namespace App\Services;

final class HostFolders
{
    private const int LIMIT = 500;

    public function enabled(): bool
    {
        return str_starts_with($this->hostRoot(), '/') && is_dir($this->containerRoot());
    }

    public function hostRoot(): string
    {
        return rtrim((string) config('stacklab.browse.host_root'), '/');
    }

    /**
     * @return array{path: string, label: string, parent: ?string, entries: list<array{name: string, path: string, workspace: bool}>}
     */
    public function list(?string $hostPath): array
    {
        $container = $this->toContainer($hostPath) ?? $this->containerRoot();
        $host = $this->toHost($container);

        $entries = [];
        foreach ($this->directories($container) as $name) {
            $entries[] = [
                'name' => $name,
                'path' => $host.'/'.$name,
                'workspace' => is_file($container.'/'.$name.'/'.config('stacklab.workspace.marker')),
            ];
        }
        usort($entries, fn (array $a, array $b): int => strnatcasecmp($a['name'], $b['name']));

        return [
            'path' => $host,
            'label' => $this->label($host),
            'parent' => $container === $this->containerRoot() ? null : $this->toHost(dirname($container)),
            'entries' => array_slice($entries, 0, self::LIMIT),
        ];
    }

    public function toContainer(?string $hostPath): ?string
    {
        $root = $this->hostRoot();
        if ($hostPath === null || $root === '' || ! $this->enabled()) {
            return null;
        }

        $hostPath = rtrim(trim($hostPath), '/');
        if ($hostPath !== $root && ! str_starts_with($hostPath, $root.'/')) {
            return null;
        }

        $real = realpath($this->containerRoot().substr($hostPath, strlen($root)));
        if ($real === false || ! is_dir($real)) {
            return null;
        }

        return $this->inside($real) ? $real : null;
    }

    private function inside(string $containerPath): bool
    {
        $root = $this->containerRoot();

        return $root !== '' && ($containerPath === $root || str_starts_with($containerPath, $root.'/'));
    }

    public function label(string $hostPath): string
    {
        $root = $this->hostRoot();

        return $hostPath === $root ? '~' : '~'.substr($hostPath, strlen($root));
    }

    private function toHost(string $containerPath): string
    {
        return $this->hostRoot().substr($containerPath, strlen($this->containerRoot()));
    }

    private function containerRoot(): string
    {
        $real = realpath((string) config('stacklab.browse.container_root'));

        return $real === false ? '' : $real;
    }

    /** @return list<string> */
    private function directories(string $path): array
    {
        $handle = @opendir($path);
        if ($handle === false) {
            return [];
        }

        $names = [];
        while (($name = readdir($handle)) !== false) {
            $full = $path.'/'.$name;
            if (! str_starts_with($name, '.') && is_dir($full) && (! is_link($full) || $this->inside((string) realpath($full)))) {
                $names[] = $name;
            }
        }
        closedir($handle);

        return $names;
    }
}
