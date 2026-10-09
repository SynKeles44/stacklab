<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('courses', function (Blueprint $table): void {
            $table->id();
            $table->string('slug')->unique();
            $table->string('title');
            $table->string('subtitle')->nullable();
            $table->text('description');
            $table->string('category');
            $table->string('level');
            $table->unsignedInteger('position');
            $table->string('icon')->nullable();
            $table->string('color')->nullable();
            $table->unsignedInteger('estimated_hours')->default(0);
            $table->json('prerequisites');
            $table->json('learning_goals');
            $table->json('references');
            $table->string('workspace_dir')->nullable();
            $table->timestamps();
        });

        Schema::create('course_modules', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->string('slug');
            $table->string('title');
            $table->text('description')->nullable();
            $table->unsignedInteger('position');
            $table->json('exercise')->nullable();
            $table->timestamps();
            $table->unique(['course_id', 'slug']);
        });

        Schema::create('lessons', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_module_id')->constrained()->cascadeOnDelete();
            $table->string('slug');
            $table->string('title');
            $table->text('summary')->nullable();
            $table->unsignedInteger('position');
            $table->unsignedInteger('duration_minutes')->default(10);
            $table->longText('body');
            $table->json('quiz');
            $table->json('tasks');
            $table->json('term_slugs');
            $table->json('sources');
            $table->longText('search_text');
            $table->timestamps();
            $table->unique(['course_id', 'slug']);
        });

        Schema::create('terms', function (Blueprint $table): void {
            $table->id();
            $table->string('slug')->unique();
            $table->string('term');
            $table->string('short');
            $table->text('explanation');
            $table->text('example')->nullable();
            $table->string('category');
            $table->json('aliases');
            $table->json('related');
            $table->foreignId('lesson_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('projects', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('course_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('slug');
            $table->string('title');
            $table->text('description');
            $table->text('goal')->nullable();
            $table->json('steps');
            $table->timestamps();
        });

        Schema::create('exams', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('course_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->unsignedInteger('time_limit_minutes')->nullable();
            $table->unsignedInteger('pass_percent')->default(70);
            $table->json('questions');
            $table->json('tasks');
            $table->timestamps();
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement(<<<'SQL'
                ALTER TABLE lessons ADD COLUMN search_vector tsvector
                GENERATED ALWAYS AS (
                    setweight(to_tsvector('german', coalesce(title, '')), 'A') ||
                    setweight(to_tsvector('german', coalesce(summary, '')), 'B') ||
                    setweight(to_tsvector('german', coalesce(search_text, '')), 'C')
                ) STORED
                SQL);
            DB::statement('CREATE INDEX lessons_search_idx ON lessons USING GIN (search_vector)');
            DB::statement(<<<'SQL'
                ALTER TABLE terms ADD COLUMN search_vector tsvector
                GENERATED ALWAYS AS (
                    setweight(to_tsvector('german', coalesce(term, '')), 'A') ||
                    setweight(to_tsvector('german', coalesce(short, '') || ' ' || coalesce(explanation, '')), 'B')
                ) STORED
                SQL);
            DB::statement('CREATE INDEX terms_search_idx ON terms USING GIN (search_vector)');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('exams');
        Schema::dropIfExists('projects');
        Schema::dropIfExists('terms');
        Schema::dropIfExists('lessons');
        Schema::dropIfExists('course_modules');
        Schema::dropIfExists('courses');
    }
};
