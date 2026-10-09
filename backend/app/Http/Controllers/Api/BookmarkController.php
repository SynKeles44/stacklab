<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\BookmarkRequest;
use App\Models\Bookmark;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class BookmarkController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'bookmarks' => Bookmark::query()->where('user_id', $request->user()->id)->latest()->get(['id', 'type', 'ref', 'label', 'url', 'created_at']),
        ]);
    }

    public function toggle(BookmarkRequest $request): JsonResponse
    {
        $attributes = ['user_id' => $request->user()->id, 'type' => $request->string('type')->value(), 'ref' => $request->string('ref')->value()];
        $existing = Bookmark::query()->where($attributes)->first();

        if ($existing !== null) {
            $existing->delete();

            return response()->json(['bookmarked' => false]);
        }

        Bookmark::query()->create([...$attributes, 'label' => $request->string('label')->value(), 'url' => $request->string('url')->value()]);

        return response()->json(['bookmarked' => true]);
    }

    public function destroy(Request $request, Bookmark $bookmark): JsonResponse
    {
        abort_if($bookmark->user_id !== $request->user()->id, 404);
        $bookmark->delete();

        return response()->json(['ok' => true]);
    }
}
