<?php

declare(strict_types=1);

return [
    'content_path' => env('STACKLAB_CONTENT_PATH', base_path('../content')),

    'sandbox' => [
        'url' => env('STACKLAB_SANDBOX_URL', 'http://sandbox:7681'),
        'secret_file' => env('STACKLAB_SANDBOX_SECRET_FILE', '/run/stacklab/sandbox.secret'),
        'secret' => env('STACKLAB_SANDBOX_SECRET'),
        'timeout' => (int) env('STACKLAB_SANDBOX_TIMEOUT', 60),
    ],

    'workspace' => [
        'host_path' => env('STACKLAB_WORKSPACE_HOST', './workspace'),
        'env_file' => env('STACKLAB_ROOT_ENV_FILE', '/stacklab-root/.env'),
    ],
];
