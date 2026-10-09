<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\Term;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

final class SearchController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $query = trim((string) $request->query('q', ''));
        if (mb_strlen($query) < 2) {
            return response()->json(['lessons' => [], 'terms' => [], 'courses' => []]);
        }

        $like = '%'.str_replace(['%', '_'], ['\%', '\_'], $query).'%';
        $courses = Course::query()
            ->where(fn ($builder) => $builder->whereLike('title', $like, caseSensitive: false)->orWhereLike('description', $like, caseSensitive: false))
            ->orderBy('position')
            ->limit(5)
            ->get(['slug', 'title', 'subtitle', 'icon', 'color']);

        if (DB::getDriverName() === 'pgsql') {
            $lessons = Lesson::query()
                ->join('courses', 'courses.id', '=', 'lessons.course_id')
                ->whereRaw("lessons.search_vector @@ websearch_to_tsquery('german', ?)", [$query])
                ->orWhereLike('lessons.title', $like, caseSensitive: false)
                ->selectRaw("lessons.slug, lessons.title, lessons.summary, courses.slug as course_slug, courses.title as course_title,
                    ts_rank(lessons.search_vector, websearch_to_tsquery('german', ?)) as rank,
                    ts_headline('german', lessons.search_text, websearch_to_tsquery('german', ?), 'MaxWords=30, MinWords=15, StartSel=⟦, StopSel=⟧') as excerpt", [$query, $query])
                ->orderByDesc('rank')
                ->limit(25)
                ->get();

            $terms = Term::query()
                ->whereRaw("search_vector @@ websearch_to_tsquery('german', ?)", [$query])
                ->orWhereLike('term', $like, caseSensitive: false)
                ->orderByRaw("ts_rank(search_vector, websearch_to_tsquery('german', ?)) desc", [$query])
                ->limit(15)
                ->get(['slug', 'term', 'short']);
        } else {
            $lessons = Lesson::query()
                ->join('courses', 'courses.id', '=', 'lessons.course_id')
                ->where(fn ($builder) => $builder->whereLike('lessons.title', $like)->orWhereLike('lessons.search_text', $like))
                ->limit(25)
                ->get(['lessons.slug', 'lessons.title', 'lessons.summary', 'courses.slug as course_slug', 'courses.title as course_title']);
            $terms = Term::query()->whereLike('term', $like)->orWhereLike('short', $like)->limit(15)->get(['slug', 'term', 'short']);
        }

        return response()->json(['lessons' => $lessons, 'terms' => $terms, 'courses' => $courses]);
    }
}
