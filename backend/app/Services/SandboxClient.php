<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use RuntimeException;

final class SandboxClient
{
    public function secret(): string
    {
        $secret = config('stacklab.sandbox.secret');
        if (is_string($secret) && $secret !== '') {
            return $secret;
        }

        $file = (string) config('stacklab.sandbox.secret_file');
        if (is_file($file)) {
            return trim((string) file_get_contents($file));
        }

        throw new RuntimeException('Sandbox secret is not configured.');
    }

    public function terminalToken(int $userId, string $workspaceDir, int $ttlSeconds = 120): string
    {
        $payload = rtrim(strtr(base64_encode((string) json_encode([
            'u' => $userId,
            'w' => $workspaceDir,
            'exp' => time() + $ttlSeconds,
        ])), '+/', '-_'), '=');

        $signature = rtrim(strtr(base64_encode(hash_hmac('sha256', $payload, $this->secret(), true)), '+/', '-_'), '=');

        return $payload.'.'.$signature;
    }

    /**
     * @param  list<array<string, mixed>>  $checks
     * @return array{passed: bool, results: list<array{passed: bool, message: string, output?: string}>}
     */
    public function check(string $workspaceDir, string $workdir, array $checks): array
    {
        return $this->post('/api/check', ['workspace_dir' => $workspaceDir, 'workdir' => $workdir, 'checks' => $checks]);
    }

    /** @return array{ok: bool, output: string} */
    public function reset(string $workspaceDir, string $workdir, ?string $setup): array
    {
        return $this->post('/api/reset', ['workspace_dir' => $workspaceDir, 'workdir' => $workdir, 'setup' => $setup]);
    }

    /**
     * @param  list<array<string, mixed>>  $tests
     * @return array{passed: bool, output: string, results: list<array{name: string, passed: bool, message: string}>}
     */
    public function runPhp(string $workspaceDir, string $code, array $tests): array
    {
        return $this->post('/api/run-php', ['workspace_dir' => $workspaceDir, 'code' => $code, 'tests' => $tests]);
    }

    /** @return array<string, mixed> */
    public function health(): array
    {
        try {
            $response = $this->request()->timeout(3)->get('/api/health');

            return $response->successful() ? (array) $response->json() : ['ok' => false];
        } catch (ConnectionException|RuntimeException) {
            return ['ok' => false];
        }
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function post(string $path, array $payload): array
    {
        try {
            $response = $this->request()->post($path, $payload);
        } catch (ConnectionException) {
            throw new SandboxUnavailable;
        }

        if (! $response->successful()) {
            throw new SandboxUnavailable((string) ($response->json('error') ?? 'Sandbox request failed'));
        }

        return (array) $response->json();
    }

    private function request(): PendingRequest
    {
        return Http::baseUrl((string) config('stacklab.sandbox.url'))
            ->timeout((int) config('stacklab.sandbox.timeout'))
            ->acceptJson()
            ->withHeaders(['X-Stacklab-Token' => $this->secret()]);
    }
}
