<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Support\Facades\File;
use Laravel\Sanctum\Sanctum;

beforeEach(function (): void {
    $this->root = sys_get_temp_dir().'/stacklab-browse-'.bin2hex(random_bytes(4));
    $this->outside = $this->root.'-outside';
    $this->env = $this->root.'-env/.env';
    File::makeDirectory($this->root.'/Projekte/kunde-a', 0755, true);
    File::put($this->root.'/Projekte/kunde-a/README.md', 'fremd');
    File::makeDirectory($this->root.'/Projekte/leer', 0755, true);
    File::makeDirectory($this->root.'/Lernen/alt', 0755, true);
    File::put($this->root.'/Lernen/alt/.stacklab-workspace', 'x');
    File::makeDirectory($this->root.'/.versteckt', 0755, true);
    File::makeDirectory($this->outside, 0755, true);
    symlink($this->outside, $this->root.'/raus');
    File::makeDirectory(dirname($this->env), 0755, true);
    File::put($this->env, "STACKLAB_PORT=8080\nSTACKLAB_WORKSPACE=./workspace\n");

    config([
        'stacklab.browse.host_root' => '/Users/ada',
        'stacklab.browse.container_root' => $this->root,
        'stacklab.workspace.env_file' => $this->env,
    ]);
    Sanctum::actingAs(User::factory()->create());
});

afterEach(function (): void {
    File::deleteDirectory($this->root);
    File::deleteDirectory($this->outside);
    File::deleteDirectory(dirname($this->env));
});

it('lists only visible folders in host paths and marks stacklab workspaces', function (): void {
    $this->getJson('/api/settings/folders')
        ->assertOk()
        ->assertJsonPath('path', '/Users/ada')
        ->assertJsonPath('label', '~')
        ->assertJsonPath('parent', null)
        ->assertJsonPath('entries.*.name', ['Lernen', 'Projekte']);

    $this->getJson('/api/settings/folders?path=/Users/ada/Lernen')
        ->assertJsonPath('parent', '/Users/ada')
        ->assertJsonPath('entries.0.path', '/Users/ada/Lernen/alt')
        ->assertJsonPath('entries.0.workspace', true);
});

it('falls back to the home folder for paths outside of it', function (string $path): void {
    $this->getJson('/api/settings/folders?path='.urlencode($path))->assertOk()->assertJsonPath('path', '/Users/ada');
})->with(['/etc', '/Users/ada/../..', '/Users/ada/raus', '/Users/adam']);

it('creates a new workspace folder and stores it in the env file', function (): void {
    $this->postJson('/api/settings/workspace', ['parent' => '/Users/ada/Projekte', 'name' => 'stacklab-workspace'])
        ->assertOk()
        ->assertJsonPath('path', '/Users/ada/Projekte/stacklab-workspace')
        ->assertJsonPath('restart_required', true);

    expect(File::get($this->env))->toContain('STACKLAB_WORKSPACE="/Users/ada/Projekte/stacklab-workspace"')->toContain('STACKLAB_PORT=8080');
});

it('accepts empty folders and existing stacklab workspaces', function (string $parent, string $name): void {
    $this->postJson('/api/settings/workspace', ['parent' => $parent, 'name' => $name])->assertOk();
})->with([['/Users/ada/Projekte', 'leer'], ['/Users/ada/Lernen', 'alt']]);

it('refuses folders that already hold other files', function (): void {
    $this->postJson('/api/settings/workspace', ['parent' => '/Users/ada/Projekte', 'name' => 'kunde-a'])->assertUnprocessable()->assertJsonValidationErrors('name');
    $this->putJson('/api/settings/workspace', ['path' => '/Users/ada/Projekte'])->assertUnprocessable()->assertJsonValidationErrors('path');

    expect(File::get($this->env))->toContain('STACKLAB_WORKSPACE=./workspace');
});

it('refuses parents outside the home folder and unsafe names', function (array $body): void {
    $this->postJson('/api/settings/workspace', $body)->assertUnprocessable();

    expect(File::get($this->env))->toContain('STACKLAB_WORKSPACE=./workspace');
})->with([
    [['parent' => '/etc', 'name' => 'neu']],
    [['parent' => '/Users/ada/raus', 'name' => 'neu']],
    [['parent' => '/Users/ada', 'name' => '../neu']],
    [['parent' => '/Users/ada', 'name' => 'a/b']],
    [['parent' => '/Users/ada', 'name' => '.versteckt']],
]);

it('requires login', function (): void {
    $this->app['auth']->forgetGuards();

    $this->getJson('/api/settings/folders')->assertUnauthorized();
    $this->postJson('/api/settings/workspace', ['parent' => '/Users/ada', 'name' => 'neu'])->assertUnauthorized();
});
