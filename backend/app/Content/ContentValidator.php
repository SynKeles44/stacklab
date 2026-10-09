<?php

declare(strict_types=1);

namespace App\Content;

final class ContentValidator
{
    private const array CATEGORIES = ['grundlagen', 'web', 'frontend', 'backend', 'infrastruktur', 'abschluss'];

    private const array LEVELS = ['einsteiger', 'fortgeschritten', 'profi'];

    private const array QUESTION_TYPES = ['single', 'multiple', 'cloze', 'match', 'find-bug'];

    private const array TASK_TYPES = ['terminal', 'simulated', 'code', 'dragdrop', 'order', 'diagram', 'request', 'steps'];

    private const array CODE_LANGUAGES = ['js', 'ts', 'jsx', 'tsx', 'php'];

    private const array CHECK_TYPES = ['file_exists', 'dir_exists', 'file_absent', 'file_contains', 'command'];

    private const string SLUG = '/^[a-z0-9]+(?:-[a-z0-9]+)*$/';

    /** @var list<string> */
    private array $errors = [];

    /** @var list<string> */
    private array $warnings = [];

    /**
     * @param  array{courses: list<array<string, mixed>>, terms: list<array<string, mixed>>}  $content
     */
    public function validate(array $content, ?string $assetRoot = null): void
    {
        $termSlugs = [];
        foreach ($content['terms'] as $term) {
            $this->validateTerm($term, $termSlugs);
        }

        $courseSlugs = array_map(fn (array $course): string => (string) $course['slug'], $content['courses']);
        $lessonRefs = [];

        $seenCourses = [];
        foreach ($content['courses'] as $course) {
            $slug = (string) $course['slug'];
            if (isset($seenCourses[$slug])) {
                $this->error($course['file'], "duplicate course slug '{$slug}'");
            }
            $seenCourses[$slug] = true;
            $this->validateCourse($course, $courseSlugs, $termSlugs, $lessonRefs, $assetRoot);
        }

        foreach ($content['terms'] as $term) {
            $lesson = $term['lesson'] ?? null;
            if (is_string($lesson) && ! isset($lessonRefs[$lesson])) {
                $this->error($term['file'], "term '".($term['slug'] ?? '?')."' references unknown lesson '{$lesson}'");
            }
            foreach ((array) ($term['related'] ?? []) as $related) {
                if (! isset($termSlugs[$related])) {
                    $this->warning($term['file'], "term '".($term['slug'] ?? '?')."' references unknown related term '{$related}'");
                }
            }
        }
    }

    /** @return list<string> */
    public function errors(): array
    {
        return $this->errors;
    }

    /** @return list<string> */
    public function warnings(): array
    {
        return $this->warnings;
    }

    /**
     * @param  array<string, mixed>  $term
     * @param  array<string, true>  $termSlugs
     */
    private function validateTerm(array $term, array &$termSlugs): void
    {
        $file = (string) $term['file'];
        $slug = $term['slug'] ?? null;
        if (! is_string($slug) || preg_match(self::SLUG, $slug) !== 1) {
            $this->error($file, 'term has invalid slug '.json_encode($slug));

            return;
        }
        if (isset($termSlugs[$slug])) {
            $this->error($file, "duplicate term slug '{$slug}'");
        }
        $termSlugs[$slug] = true;
        foreach (['term', 'short', 'explanation', 'category'] as $field) {
            $this->requireString($term, $field, $file, "term '{$slug}'");
        }
    }

    /**
     * @param  array<string, mixed>  $course
     * @param  list<string>  $courseSlugs
     * @param  array<string, true>  $termSlugs
     * @param  array<string, true>  $lessonRefs
     */
    private function validateCourse(array $course, array $courseSlugs, array $termSlugs, array &$lessonRefs, ?string $assetRoot): void
    {
        $file = (string) $course['file'];
        foreach (['title', 'description', 'workspace_dir'] as $field) {
            $this->requireString($course, $field, $file, 'course');
        }
        if (! in_array($course['category'] ?? null, self::CATEGORIES, true)) {
            $this->error($file, 'category must be one of '.implode(', ', self::CATEGORIES));
        }
        if (! in_array($course['level'] ?? null, self::LEVELS, true)) {
            $this->error($file, 'level must be one of '.implode(', ', self::LEVELS));
        }
        foreach ((array) ($course['prerequisites'] ?? []) as $prerequisite) {
            if (! in_array($prerequisite, $courseSlugs, true)) {
                $this->error($file, "unknown prerequisite course '{$prerequisite}'");
            }
        }

        $modules = (array) $course['modules'];
        if ($modules === []) {
            $this->error($file, 'course has no modules');
        }

        $moduleSlugs = [];
        foreach ($modules as $module) {
            $moduleSlugs[] = (string) $module['slug'];
            $moduleFile = (string) $module['file'];
            $this->requireString($module, 'title', $moduleFile, 'module');
            if (isset($module['exercise'])) {
                $this->validateTask((array) $module['exercise'], $moduleFile, 'exercise', $assetRoot);
            } else {
                $this->warning($moduleFile, 'module has no exercise');
            }
            if ($module['lessons'] === []) {
                $this->error($moduleFile, 'module has no lessons');
            }
            foreach ($module['lessons'] as $lesson) {
                $ref = $course['slug'].'/'.$lesson['slug'];
                if (isset($lessonRefs[$ref])) {
                    $this->error($lesson['file'], "duplicate lesson slug '{$lesson['slug']}' in course");
                }
                $lessonRefs[$ref] = true;
                $this->validateLesson($lesson, $termSlugs, $assetRoot);
            }
        }

        if (! is_array($course['project'] ?? null)) {
            $this->warning($file, 'course has no project.yaml');
        } else {
            $this->validateProject($course['project'], dirname($file).'/project.yaml');
        }

        if (! is_array($course['exam'] ?? null)) {
            $this->warning($file, 'course has no exam.yaml');
        } else {
            $this->validateExam($course['exam'], dirname($file).'/exam.yaml', $moduleSlugs, $assetRoot);
        }
    }

    /**
     * @param  array<string, mixed>  $lesson
     * @param  array<string, true>  $termSlugs
     */
    private function validateLesson(array $lesson, array $termSlugs, ?string $assetRoot): void
    {
        $file = (string) $lesson['file'];
        $this->requireString($lesson, 'title', $file, 'lesson');
        $body = (string) ($lesson['body'] ?? '');
        if (mb_strlen($body) < 400) {
            $this->warning($file, 'lesson body is very short');
        }

        foreach (TermLinks::extract($body) as $slug) {
            if (! isset($termSlugs[$slug])) {
                $this->error($file, "unknown term [[{$slug}]]");
            }
        }

        if ($assetRoot !== null && preg_match_all('#\]\((/(?:assets|screenshots)/[^)\s]+)\)#', $body, $matches) > 0) {
            foreach ($matches[1] as $asset) {
                if (! is_file($assetRoot.$asset)) {
                    $this->error($file, "missing asset {$asset}");
                }
            }
        }

        $quiz = $lesson['quiz'] ?? [];
        if (! is_array($quiz) || count($quiz) < 3) {
            $this->warning($file, 'lesson should have at least 3 quiz questions');
        }
        foreach ((array) $quiz as $index => $question) {
            $this->validateQuestion((array) $question, $file, "quiz[{$index}]");
        }

        $tasks = $lesson['tasks'] ?? [];
        if (! is_array($tasks) || $tasks === []) {
            $this->error($file, 'lesson needs at least one interactive task');
        }
        $ids = [];
        foreach ((array) $tasks as $index => $task) {
            $task = (array) $task;
            $id = (string) ($task['id'] ?? '');
            if (isset($ids[$id])) {
                $this->error($file, "duplicate task id '{$id}'");
            }
            $ids[$id] = true;
            $this->validateTask($task, $file, "tasks[{$index}]", $assetRoot);
        }
    }

    /** @param array<string, mixed> $question */
    private function validateQuestion(array $question, string $file, string $where): void
    {
        $type = $question['type'] ?? null;
        if (! in_array($type, self::QUESTION_TYPES, true)) {
            $this->error($file, "{$where}: unknown question type ".json_encode($type));

            return;
        }
        $this->requireString($question, 'explanation', $file, $where);

        switch ($type) {
            case 'single':
                $this->requireString($question, 'question', $file, $where);
                $options = $this->requireList($question, 'options', $file, $where, 2);
                if (! is_int($question['answer'] ?? null) || ! isset($options[$question['answer']])) {
                    $this->error($file, "{$where}: answer must be a valid option index");
                }
                break;
            case 'multiple':
                $this->requireString($question, 'question', $file, $where);
                $options = $this->requireList($question, 'options', $file, $where, 2);
                $answers = $this->requireList($question, 'answers', $file, $where, 1);
                foreach ($answers as $answer) {
                    if (! is_int($answer) || ! isset($options[$answer])) {
                        $this->error($file, "{$where}: answers must be valid option indexes");
                    }
                }
                break;
            case 'cloze':
                $this->requireString($question, 'text', $file, $where);
                $blanks = $this->requireList($question, 'blanks', $file, $where, 1);
                $gaps = substr_count((string) ($question['text'] ?? ''), '___');
                if ($gaps !== count($blanks)) {
                    $this->error($file, "{$where}: text has {$gaps} gaps (___) but ".count($blanks).' blanks');
                }
                foreach ($blanks as $blank) {
                    if (! is_array($blank) || $blank === []) {
                        $this->error($file, "{$where}: every blank must be a non-empty list of accepted answers");
                    }
                }
                break;
            case 'match':
                $this->requireString($question, 'question', $file, $where);
                foreach ($this->requireList($question, 'pairs', $file, $where, 2) as $pair) {
                    if (! is_array($pair) || ! isset($pair['left'], $pair['right'])) {
                        $this->error($file, "{$where}: every pair needs left and right");
                    }
                }
                break;
            case 'find-bug':
                $this->requireString($question, 'question', $file, $where);
                $this->requireString($question, 'code', $file, $where);
                $lines = count(preg_split('/\R/', rtrim((string) ($question['code'] ?? ''))) ?: []);
                $bug = $question['bug_line'] ?? null;
                if (! is_int($bug) || $bug < 1 || $bug > $lines) {
                    $this->error($file, "{$where}: bug_line must be between 1 and {$lines}");
                }
                break;
        }
    }

    /** @param array<string, mixed> $task */
    private function validateTask(array $task, string $file, string $where, ?string $assetRoot): void
    {
        $type = $task['type'] ?? null;
        if (! in_array($type, self::TASK_TYPES, true)) {
            $this->error($file, "{$where}: unknown task type ".json_encode($type));

            return;
        }
        if (! is_string($task['id'] ?? null) || preg_match(self::SLUG, $task['id']) !== 1) {
            $this->error($file, "{$where}: task id must be a slug");
        }
        $this->requireString($task, 'title', $file, $where);
        $this->requireString($task, 'description', $file, $where);

        switch ($type) {
            case 'terminal':
                $this->requireString($task, 'workdir', $file, $where);
                if (str_contains((string) ($task['workdir'] ?? ''), '..')) {
                    $this->error($file, "{$where}: workdir must not contain ..");
                }
                $this->validateChecks($this->requireList($task, 'checks', $file, $where, 1), $file, $where);
                break;
            case 'simulated':
                foreach ($this->requireList($task, 'steps', $file, $where, 1) as $index => $step) {
                    $step = (array) $step;
                    $this->requireRegex($step, 'expect', $file, "{$where}.steps[{$index}]");
                }
                foreach ((array) ($task['responses'] ?? []) as $index => $response) {
                    $this->requireRegex((array) $response, 'match', $file, "{$where}.responses[{$index}]");
                }
                break;
            case 'code':
                if (! in_array($task['language'] ?? null, self::CODE_LANGUAGES, true)) {
                    $this->error($file, "{$where}: language must be one of ".implode(', ', self::CODE_LANGUAGES));
                }
                foreach ($this->requireList($task, 'tests', $file, $where, 1) as $index => $test) {
                    $test = (array) $test;
                    $this->requireString($test, 'name', $file, "{$where}.tests[{$index}]");
                    $this->requireString($test, 'code', $file, "{$where}.tests[{$index}]");
                }
                break;
            case 'dragdrop':
                $targets = array_map(fn ($target): mixed => ((array) $target)['id'] ?? null, $this->requireList($task, 'targets', $file, $where, 2));
                foreach ($this->requireList($task, 'items', $file, $where, 2) as $item) {
                    $item = (array) $item;
                    if (! isset($item['label']) || ! in_array($item['target'] ?? null, $targets, true)) {
                        $this->error($file, "{$where}: every item needs a label and a valid target");
                    }
                }
                break;
            case 'order':
                $this->requireList($task, 'items', $file, $where, 3);
                break;
            case 'diagram':
                $this->requireString($task, 'image', $file, $where);
                if ($assetRoot !== null && is_string($task['image'] ?? null) && ! is_file($assetRoot.$task['image'])) {
                    $this->error($file, "{$where}: missing image {$task['image']}");
                }
                foreach ($this->requireList($task, 'slots', $file, $where, 2) as $slot) {
                    $slot = (array) $slot;
                    if (! isset($slot['x'], $slot['y'], $slot['answer'])) {
                        $this->error($file, "{$where}: every slot needs x, y and answer");
                    }
                }
                break;
            case 'request':
                $expected = $task['expected'] ?? null;
                if (! is_array($expected) || ! isset($expected['method'], $expected['path'])) {
                    $this->error($file, "{$where}: expected needs method and path");
                } else {
                    $this->requireRegex($expected, 'path', $file, "{$where}.expected");
                }
                break;
            case 'steps':
                foreach ($this->requireList($task, 'steps', $file, $where, 1) as $index => $step) {
                    $step = (array) $step;
                    $stepWhere = "{$where}.steps[{$index}]";
                    $this->requireString($step, 'situation', $file, $stepWhere);
                    $this->requireString($step, 'question', $file, $stepWhere);
                    $options = $this->requireList($step, 'options', $file, $stepWhere, 2);
                    if (! is_int($step['answer'] ?? null) || ! isset($options[$step['answer']])) {
                        $this->error($file, "{$stepWhere}: answer must be a valid option index");
                    }
                }
                break;
        }
    }

    /** @param list<mixed> $checks */
    private function validateChecks(array $checks, string $file, string $where): void
    {
        foreach ($checks as $index => $check) {
            $check = (array) $check;
            $checkWhere = "{$where}.checks[{$index}]";
            $type = $check['type'] ?? null;
            if (! in_array($type, self::CHECK_TYPES, true)) {
                $this->error($file, "{$checkWhere}: unknown check type ".json_encode($type));

                continue;
            }
            if ($type === 'command') {
                $this->requireString($check, 'run', $file, $checkWhere);
                if (isset($check['stdout_matches'])) {
                    $this->requireRegex($check, 'stdout_matches', $file, $checkWhere);
                }
            } else {
                $this->requireString($check, 'path', $file, $checkWhere);
            }
            if ($type === 'file_contains') {
                $this->requireRegex($check, 'pattern', $file, $checkWhere);
            }
        }
    }

    /** @param array<string, mixed> $project */
    private function validateProject(array $project, string $file): void
    {
        $this->requireString($project, 'title', $file, 'project');
        $this->requireString($project, 'description', $file, 'project');
        $ids = [];
        foreach ($this->requireList($project, 'steps', $file, 'project', 2) as $index => $step) {
            $step = (array) $step;
            $where = "steps[{$index}]";
            $id = (string) ($step['id'] ?? '');
            if (preg_match(self::SLUG, $id) !== 1 || isset($ids[$id])) {
                $this->error($file, "{$where}: id must be a unique slug");
            }
            $ids[$id] = true;
            $this->requireString($step, 'title', $file, $where);
            $this->requireString($step, 'description', $file, $where);
            if (isset($step['checks'])) {
                $this->validateChecks((array) $step['checks'], $file, $where);
            }
            if (array_key_exists('solve', $step) && (! is_string($step['solve']) || trim($step['solve']) === '')) {
                $this->error($file, "{$where}: solve must be a non-empty shell script");
            } elseif (! isset($step['solve'])) {
                $this->warning($file, "{$where}: no solve script – learners cannot let Stacklab do this step");
            }
        }
    }

    /**
     * @param  array<string, mixed>  $exam
     * @param  list<string>  $moduleSlugs
     */
    private function validateExam(array $exam, string $file, array $moduleSlugs, ?string $assetRoot): void
    {
        $this->requireString($exam, 'title', $file, 'exam');
        $questions = $this->requireList($exam, 'questions', $file, 'exam', 5);
        foreach ($questions as $index => $question) {
            $question = (array) $question;
            if (! in_array($question['module'] ?? null, $moduleSlugs, true)) {
                $this->error($file, "questions[{$index}]: module must be one of the course module slugs");
            }
            $this->validateQuestion($question, $file, "questions[{$index}]");
        }
        foreach ((array) ($exam['tasks'] ?? []) as $index => $task) {
            $task = (array) $task;
            if (! in_array($task['module'] ?? null, $moduleSlugs, true)) {
                $this->error($file, "tasks[{$index}]: module must be one of the course module slugs");
            }
            if (! in_array($task['type'] ?? null, ['code', 'terminal'], true)) {
                $this->error($file, "tasks[{$index}]: exam tasks must be code or terminal");
            }
            $this->validateTask($task, $file, "tasks[{$index}]", $assetRoot);
        }
    }

    /** @param array<string, mixed> $data */
    private function requireString(array $data, string $field, string $file, string $where): void
    {
        if (! is_string($data[$field] ?? null) || trim($data[$field]) === '') {
            $this->error($file, "{$where}: '{$field}' is required");
        }
    }

    /**
     * @param  array<string, mixed>  $data
     * @return list<mixed>
     */
    private function requireList(array $data, string $field, string $file, string $where, int $min): array
    {
        $value = $data[$field] ?? null;
        if (! is_array($value) || ! array_is_list($value) || count($value) < $min) {
            $this->error($file, "{$where}: '{$field}' must be a list with at least {$min} entries");

            return is_array($value) ? array_values($value) : [];
        }

        return $value;
    }

    /** @param array<string, mixed> $data */
    private function requireRegex(array $data, string $field, string $file, string $where): void
    {
        $value = $data[$field] ?? null;
        if (! is_string($value) || @preg_match('/'.str_replace('/', '\/', $value).'/u', '') === false) {
            $this->error($file, "{$where}: '{$field}' must be a valid regular expression");
        }
    }

    private function error(string $file, string $message): void
    {
        $this->errors[] = "{$file}: {$message}";
    }

    private function warning(string $file, string $message): void
    {
        $this->warnings[] = "{$file}: {$message}";
    }
}
