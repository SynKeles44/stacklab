<?php

declare(strict_types=1);

namespace App\Services;

final class QuizGrader
{
    /**
     * Removes solution fields so a question can be shown during an exam.
     *
     * @param  array<string, mixed>  $question
     * @return array<string, mixed>
     */
    public function publicQuestion(array $question, int $seed): array
    {
        $public = $question;
        unset($public['answer'], $public['answers'], $public['blanks'], $public['bug_line'], $public['explanation']);

        if (($question['type'] ?? null) === 'cloze') {
            $public['blank_count'] = count((array) ($question['blanks'] ?? []));
        }

        if (($question['type'] ?? null) === 'match') {
            $pairs = (array) ($question['pairs'] ?? []);
            $rights = array_map(fn (array $pair): string => (string) $pair['right'], $pairs);
            mt_srand($seed);
            shuffle($rights);
            mt_srand();
            $public['pairs'] = null;
            $public['lefts'] = array_map(fn (array $pair): string => (string) $pair['left'], $pairs);
            $public['rights'] = $rights;
        }

        return $public;
    }

    /** @param array<string, mixed> $question */
    public function isCorrect(array $question, mixed $answer): bool
    {
        return match ($question['type'] ?? null) {
            'single' => is_int($answer) && $answer === ($question['answer'] ?? null),
            'multiple' => is_array($answer) && $this->sameSet($answer, (array) ($question['answers'] ?? [])),
            'cloze' => is_array($answer) && $this->clozeCorrect((array) ($question['blanks'] ?? []), $answer),
            'match' => is_array($answer) && $this->matchCorrect((array) ($question['pairs'] ?? []), $answer),
            'find-bug' => is_int($answer) && $answer === ($question['bug_line'] ?? null),
            default => false,
        };
    }

    /**
     * @param  array<mixed>  $given
     * @param  array<mixed>  $expected
     */
    private function sameSet(array $given, array $expected): bool
    {
        $given = array_map('intval', $given);
        $expected = array_map('intval', $expected);
        sort($given);
        sort($expected);

        return $given === $expected;
    }

    /**
     * @param  array<mixed>  $blanks
     * @param  array<mixed>  $answer
     */
    private function clozeCorrect(array $blanks, array $answer): bool
    {
        foreach ($blanks as $index => $accepted) {
            $given = mb_strtolower(trim((string) ($answer[$index] ?? '')));
            $options = array_map(fn (mixed $option): string => mb_strtolower(trim((string) $option)), (array) $accepted);
            if (! in_array($given, $options, true)) {
                return false;
            }
        }

        return true;
    }

    /**
     * @param  array<mixed>  $pairs
     * @param  array<mixed>  $answer
     */
    private function matchCorrect(array $pairs, array $answer): bool
    {
        foreach ($pairs as $index => $pair) {
            if ((string) ($answer[$index] ?? '') !== (string) ((array) $pair)['right']) {
                return false;
            }
        }

        return true;
    }
}
