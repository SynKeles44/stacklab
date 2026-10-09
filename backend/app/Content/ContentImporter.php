<?php

declare(strict_types=1);

namespace App\Content;

use App\Models\Course;
use App\Models\CourseModule;
use App\Models\Exam;
use App\Models\Lesson;
use App\Models\Project;
use App\Models\Term;
use Illuminate\Support\Facades\DB;

final class ContentImporter
{
    /**
     * @param  array{courses: list<array<string, mixed>>, terms: list<array<string, mixed>>}  $content
     * @return array{courses: int, modules: int, lessons: int, terms: int}
     */
    public function import(array $content): array
    {
        return DB::transaction(function () use ($content): array {
            $stats = ['courses' => 0, 'modules' => 0, 'lessons' => 0, 'terms' => 0];
            $lessonIds = [];
            $courseIds = [];

            foreach ($content['courses'] as $courseData) {
                $course = Course::query()->updateOrCreate(['slug' => $courseData['slug']], [
                    'title' => $courseData['title'],
                    'subtitle' => $courseData['subtitle'] ?? null,
                    'description' => $courseData['description'],
                    'category' => $courseData['category'],
                    'level' => $courseData['level'],
                    'position' => $courseData['position'],
                    'icon' => $courseData['icon'] ?? null,
                    'color' => $courseData['color'] ?? null,
                    'estimated_hours' => (int) ($courseData['estimated_hours'] ?? 0),
                    'prerequisites' => array_values((array) ($courseData['prerequisites'] ?? [])),
                    'learning_goals' => array_values((array) ($courseData['learning_goals'] ?? [])),
                    'references' => array_values((array) ($courseData['references'] ?? [])),
                    'workspace_dir' => $courseData['workspace_dir'] ?? $courseData['slug'],
                ]);
                $courseIds[] = $course->id;
                $stats['courses']++;

                $moduleIds = [];
                foreach ($courseData['modules'] as $moduleData) {
                    $module = CourseModule::query()->updateOrCreate(
                        ['course_id' => $course->id, 'slug' => $moduleData['slug']],
                        [
                            'title' => $moduleData['title'],
                            'description' => $moduleData['description'] ?? null,
                            'position' => $moduleData['position'],
                            'exercise' => $moduleData['exercise'] ?? null,
                        ],
                    );
                    $moduleIds[] = $module->id;
                    $stats['modules']++;

                    foreach ($moduleData['lessons'] as $lessonData) {
                        $body = (string) $lessonData['body'];
                        $lesson = Lesson::query()->updateOrCreate(
                            ['course_id' => $course->id, 'slug' => $lessonData['slug']],
                            [
                                'course_module_id' => $module->id,
                                'title' => $lessonData['title'],
                                'summary' => $lessonData['summary'] ?? null,
                                'position' => $lessonData['position'],
                                'duration_minutes' => (int) ($lessonData['duration'] ?? 10),
                                'body' => $body,
                                'quiz' => array_values((array) ($lessonData['quiz'] ?? [])),
                                'tasks' => array_values((array) ($lessonData['tasks'] ?? [])),
                                'term_slugs' => TermLinks::extract($body),
                                'sources' => array_values((array) ($lessonData['sources'] ?? [])),
                                'search_text' => TermLinks::toPlainText($body),
                            ],
                        );
                        $lessonIds[$course->slug.'/'.$lesson->slug] = $lesson->id;
                        $stats['lessons']++;
                    }
                }

                CourseModule::query()->where('course_id', $course->id)->whereNotIn('id', $moduleIds)->delete();
                Lesson::query()->where('course_id', $course->id)
                    ->whereNotIn('id', array_values(array_filter(
                        $lessonIds,
                        fn (string $ref): bool => str_starts_with($ref, $course->slug.'/'),
                        ARRAY_FILTER_USE_KEY,
                    )))
                    ->delete();

                $this->syncProject($course, $courseData['project'] ?? null);
                $this->syncExam($course, $courseData['exam'] ?? null);
            }

            Course::query()->whereNotIn('id', $courseIds)->delete();

            $termSlugs = [];
            foreach ($content['terms'] as $termData) {
                $lessonRef = $termData['lesson'] ?? null;
                if (in_array($termData['slug'], $termSlugs, true)) {
                    continue;
                }
                Term::query()->updateOrCreate(['slug' => $termData['slug']], [
                    'term' => $termData['term'],
                    'short' => $termData['short'],
                    'explanation' => $termData['explanation'],
                    'example' => $termData['example'] ?? null,
                    'category' => $termData['category'],
                    'aliases' => array_values((array) ($termData['aliases'] ?? [])),
                    'related' => array_values((array) ($termData['related'] ?? [])),
                    'lesson_id' => is_string($lessonRef) ? ($lessonIds[$lessonRef] ?? null) : null,
                ]);
                $termSlugs[] = $termData['slug'];
                $stats['terms']++;
            }
            Term::query()->whereNotIn('slug', $termSlugs)->delete();

            return $stats;
        });
    }

    /** @param array<string, mixed>|null $data */
    private function syncProject(Course $course, ?array $data): void
    {
        if ($data === null) {
            Project::query()->where('course_id', $course->id)->delete();

            return;
        }

        Project::query()->updateOrCreate(['course_id' => $course->id], [
            'slug' => $course->slug.'-projekt',
            'title' => $data['title'],
            'description' => $data['description'],
            'goal' => $data['goal'] ?? null,
            'steps' => array_map(
                fn (array $step): array => [...$step, 'workdir' => $step['workdir'] ?? ($data['workdir'] ?? 'projekt')],
                array_values((array) $data['steps']),
            ),
        ]);
    }

    /** @param array<string, mixed>|null $data */
    private function syncExam(Course $course, ?array $data): void
    {
        if ($data === null) {
            Exam::query()->where('course_id', $course->id)->delete();

            return;
        }

        Exam::query()->updateOrCreate(['course_id' => $course->id], [
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'time_limit_minutes' => isset($data['time_limit_minutes']) ? (int) $data['time_limit_minutes'] : null,
            'pass_percent' => (int) ($data['pass_percent'] ?? 70),
            'questions' => array_values((array) $data['questions']),
            'tasks' => array_values((array) ($data['tasks'] ?? [])),
        ]);
    }
}
