<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Validation\ValidationException;

final class WorkspaceLocation
{
    public function __construct(private readonly HostFolders $folders) {}

    public function envFileWritable(): bool
    {
        $file = $this->envFile();

        return is_file($file) ? is_writable($file) : is_dir(dirname($file)) && is_writable(dirname($file));
    }

    public function createInside(string $parentHostPath, string $name): string
    {
        $parent = $this->folders->toContainer($parentHostPath)
            ?? throw ValidationException::withMessages(['parent' => 'Diesen Ordner gibt es nicht oder er liegt außerhalb deines Benutzerordners.']);

        $target = $parent.'/'.$name;
        if (file_exists($target) && ! $this->isUsable($target)) {
            throw ValidationException::withMessages(['name' => "Im Ordner „{$name}“ liegen schon andere Dateien. Wähle einen neuen Namen oder einen leeren Ordner."]);
        }

        $hostPath = rtrim($parentHostPath, '/').'/'.$name;
        $this->store($hostPath);

        return $hostPath;
    }

    public function store(string $hostPath): void
    {
        $container = $this->folders->toContainer($hostPath);
        if ($container !== null && ! $this->isUsable($container)) {
            throw ValidationException::withMessages(['path' => 'In diesem Ordner liegen schon andere Dateien. Stacklab braucht einen eigenen, leeren Ordner.']);
        }

        $file = $this->envFile();
        $contents = is_file($file) ? (string) file_get_contents($file) : '';
        $line = 'STACKLAB_WORKSPACE="'.$hostPath.'"';

        $contents = preg_match('/^STACKLAB_WORKSPACE=.*$/m', $contents) === 1
            ? (string) preg_replace('/^STACKLAB_WORKSPACE=.*$/m', $line, $contents)
            : rtrim($contents).PHP_EOL.$line.PHP_EOL;

        file_put_contents($file, ltrim($contents));
    }

    private function isUsable(string $containerPath): bool
    {
        if (! is_dir($containerPath)) {
            return false;
        }
        if (is_file($containerPath.'/'.config('stacklab.workspace.marker'))) {
            return true;
        }

        return array_diff((array) scandir($containerPath), ['.', '..', '.DS_Store']) === [];
    }

    private function envFile(): string
    {
        return (string) config('stacklab.workspace.env_file');
    }
}
