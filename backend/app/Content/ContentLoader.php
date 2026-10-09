<?php

declare(strict_types=1);

namespace App\Content;

use RuntimeException;
use Symfony\Component\Yaml\Exception\ParseException;
use Symfony\Component\Yaml\Yaml;

final class ContentLoader
{
    /** @var list<string> */
    private array $errors = [];

    public function __construct(private readonly string $root)
    {
    }

    /** @return list<string> */
    public function errors(): array
    {
        return $this->errors;
    }

    /**
     * @return array{courses: list<array<string, mixed>>, terms: list<array<string, mixed>>}
     */
    public function load(): array
    {
        if (! is_dir($this->root)) {
            throw new RuntimeException("Content directory not found: {$this->root}");
        }

        return [
            'courses' => $this->loadCourses(),
            'terms' => $this->loadTerms(),
        ];
    }

    /** @return list<array<string, mixed>> */
    private function loadCourses(): array
    {
        $courses = [];

        foreach ($this->orderedDirectories($this->root.'/courses') as [$position, $slug, $path]) {
            $data = $this->yaml($path.'/course.yaml');
            if ($data === null) {
                continue;
            }

            $modules = [];
            foreach ($this->orderedDirectories($path.'/modules') as [$modulePosition, $moduleSlug, $modulePath]) {
                $module = $this->yaml($modulePath.'/module.yaml') ?? [];
                $lessons = [];
                foreach ($this->orderedFiles($modulePath, 'md') as [$lessonPosition, $lessonSlug, $lessonPath]) {
                    $lesson = $this->markdown($lessonPath);
                    if ($lesson === null) {
                        continue;
                    }
                    $lessons[] = [...$lesson, 'slug' => $lessonSlug, 'position' => $lessonPosition, 'file' => $this->relative($lessonPath)];
                }
                $modules[] = [...$module, 'slug' => $moduleSlug, 'position' => $modulePosition, 'lessons' => $lessons, 'file' => $this->relative($modulePath.'/module.yaml')];
            }

            $courses[] = [
                ...$data,
                'slug' => $slug,
                'position' => $position,
                'modules' => $modules,
                'project' => is_file($path.'/project.yaml') ? $this->yaml($path.'/project.yaml') : null,
                'exam' => is_file($path.'/exam.yaml') ? $this->yaml($path.'/exam.yaml') : null,
                'file' => $this->relative($path.'/course.yaml'),
            ];
        }

        return $courses;
    }

    /** @return list<array<string, mixed>> */
    private function loadTerms(): array
    {
        $terms = [];
        $files = glob($this->root.'/glossary/*.yaml') ?: [];
        sort($files);
        foreach ($files as $file) {
            $entries = $this->yaml($file);
            if ($entries === null) {
                continue;
            }
            if (! array_is_list($entries)) {
                $this->errors[] = $this->relative($file).': glossary file must contain a list of terms';

                continue;
            }
            foreach ($entries as $index => $entry) {
                if (! is_array($entry)) {
                    $this->errors[] = $this->relative($file)."#{$index}: entry must be a mapping";

                    continue;
                }
                $terms[] = [...$entry, 'file' => $this->relative($file)];
            }
        }

        return $terms;
    }

    /** @return list<array{int, string, string}> */
    private function orderedDirectories(string $directory): array
    {
        if (! is_dir($directory)) {
            return [];
        }

        $result = [];
        foreach (scandir($directory) ?: [] as $entry) {
            $path = $directory.'/'.$entry;
            if ($entry[0] === '.' || ! is_dir($path)) {
                continue;
            }
            $parsed = $this->parseOrderedName($entry, $path);
            if ($parsed !== null) {
                $result[] = [...$parsed, $path];
            }
        }
        usort($result, fn (array $a, array $b): int => $a[0] <=> $b[0]);

        return $result;
    }

    /** @return list<array{int, string, string}> */
    private function orderedFiles(string $directory, string $extension): array
    {
        $result = [];
        foreach (glob($directory.'/*.'.$extension) ?: [] as $path) {
            $parsed = $this->parseOrderedName(basename($path, '.'.$extension), $path);
            if ($parsed !== null) {
                $result[] = [...$parsed, $path];
            }
        }
        usort($result, fn (array $a, array $b): int => $a[0] <=> $b[0]);

        return $result;
    }

    /** @return array{int, string}|null */
    private function parseOrderedName(string $name, string $path): ?array
    {
        if (preg_match('/^(\d+)-([a-z0-9]+(?:-[a-z0-9]+)*)$/', $name, $matches) !== 1) {
            $this->errors[] = $this->relative($path).': name must follow the pattern NN-slug';

            return null;
        }

        return [(int) $matches[1], $matches[2]];
    }

    /** @return array<string, mixed>|null */
    private function yaml(string $path): ?array
    {
        if (! is_file($path)) {
            $this->errors[] = $this->relative($path).': file is missing';

            return null;
        }

        try {
            $data = Yaml::parseFile($path);
        } catch (ParseException $exception) {
            $this->errors[] = $this->relative($path).': '.$exception->getMessage();

            return null;
        }

        if (! is_array($data)) {
            $this->errors[] = $this->relative($path).': YAML must contain a mapping or list';

            return null;
        }

        return $data;
    }

    /** @return array<string, mixed>|null */
    private function markdown(string $path): ?array
    {
        $raw = (string) file_get_contents($path);
        if (preg_match('/^---\R(.*?)\R---\R?(.*)$/s', $raw, $matches) !== 1) {
            $this->errors[] = $this->relative($path).': missing YAML frontmatter';

            return null;
        }

        try {
            $frontmatter = Yaml::parse($matches[1]);
        } catch (ParseException $exception) {
            $this->errors[] = $this->relative($path).': frontmatter: '.$exception->getMessage();

            return null;
        }

        if (! is_array($frontmatter)) {
            $this->errors[] = $this->relative($path).': frontmatter must be a mapping';

            return null;
        }

        return [...$frontmatter, 'body' => trim($matches[2])];
    }

    private function relative(string $path): string
    {
        return ltrim(str_replace($this->root, '', $path), '/');
    }
}
