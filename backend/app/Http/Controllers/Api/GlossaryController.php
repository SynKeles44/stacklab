<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\TermUnlockRequest;
use App\Models\Term;
use App\Models\TermUnlock;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

final class GlossaryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user('sanctum');
        $unlocked = $user !== null
            ? TermUnlock::query()->where('user_id', $user->id)->pluck('unlocked_at', 'term_id')->all()
            : [];

        $terms = Term::query()
            ->with('lesson:id,slug,title,course_id', 'lesson.course:id,slug')
            ->orderBy('term')
            ->get()
            ->map(fn (Term $term): array => [
                ...$this->payload($term),
                'unlocked_at' => isset($unlocked[$term->id]) ? Carbon::parse($unlocked[$term->id])->toIso8601String() : null,
            ]);

        return response()->json(['terms' => $terms, 'unlocked_count' => count($unlocked), 'total' => $terms->count()]);
    }

    public function show(Request $request, string $slug): JsonResponse
    {
        $term = Term::query()->where('slug', $slug)->with('lesson:id,slug,title,course_id', 'lesson.course:id,slug,title')->firstOrFail();
        $related = Term::query()->whereIn('slug', $term->related)->get(['slug', 'term', 'short']);
        $user = $request->user('sanctum');

        return response()->json([
            'term' => [
                ...$this->payload($term),
                'related' => $related,
                'unlocked_at' => $user !== null
                    ? TermUnlock::query()->where('user_id', $user->id)->where('term_id', $term->id)->value('unlocked_at')
                    : null,
            ],
        ]);
    }

    public function unlock(TermUnlockRequest $request): JsonResponse
    {
        $terms = Term::query()->whereIn('slug', $request->input('slugs'))->get(['id', 'slug', 'term', 'short']);
        $already = TermUnlock::query()
            ->where('user_id', $request->user()->id)
            ->whereIn('term_id', $terms->pluck('id'))
            ->pluck('term_id')
            ->all();

        $new = $terms->whereNotIn('id', $already)->values();
        $now = Carbon::now();
        TermUnlock::query()->insertOrIgnore($new->map(fn (Term $term): array => [
            'user_id' => $request->user()->id,
            'term_id' => $term->id,
            'unlocked_at' => $now,
        ])->all());

        return response()->json([
            'unlocked' => $new->map(fn (Term $term): array => $term->only(['slug', 'term', 'short']))->all(),
            'unlocked_count' => TermUnlock::query()->where('user_id', $request->user()->id)->count(),
            'total' => Term::query()->count(),
        ]);
    }

    /** @return array<string, mixed> */
    private function payload(Term $term): array
    {
        return [
            'slug' => $term->slug,
            'term' => $term->term,
            'short' => $term->short,
            'explanation' => $term->explanation,
            'example' => $term->example,
            'category' => $term->category,
            'aliases' => $term->aliases,
            'lesson' => $term->lesson !== null ? [
                'slug' => $term->lesson->slug,
                'title' => $term->lesson->title,
                'course_slug' => $term->lesson->course->slug,
            ] : null,
        ];
    }
}
