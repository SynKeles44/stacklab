<?php

declare(strict_types=1);

namespace App\Content;

final class TermLinks
{
    private const string PATTERN = '/\[\[([a-z0-9]+(?:-[a-z0-9]+)*)(?:\|([^\]]+))?\]\]/';

    /** @return list<string> */
    public static function extract(string $markdown): array
    {
        preg_match_all(self::PATTERN, $markdown, $matches);

        return array_values(array_unique($matches[1]));
    }

    public static function toPlainText(string $markdown): string
    {
        $text = (string) preg_replace_callback(
            self::PATTERN,
            fn (array $match): string => $match[2] ?? $match[1],
            $markdown,
        );
        $text = (string) preg_replace('/^>\s*\[![A-Z]+\]\s*$/m', '', $text);
        $text = (string) preg_replace('/!\[[^\]]*\]\([^)]*\)/', '', $text);
        $text = (string) preg_replace('/\[([^\]]+)\]\([^)]*\)/', '$1', $text);
        $text = str_replace(['```', '`', '#', '*', '>', '|'], ' ', $text);

        return trim((string) preg_replace('/\s+/', ' ', $text));
    }
}
