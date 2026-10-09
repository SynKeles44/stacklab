# syntax=docker/dockerfile:1.7

# Stage 1: build the gateway (node-pty needs a compiler)
FROM node:24-trixie AS gateway
WORKDIR /app
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY server/src ./src

# Stage 2: the practice sandbox
FROM php:8.5-cli-trixie

ARG LEARNER_UID=1000
ARG LEARNER_GID=1000
ARG NVM_VERSION=v0.40.8
ARG NODE_DEFAULT=24
ARG BUN_VERSION=bun-v1.4.2

ENV DEBIAN_FRONTEND=noninteractive \
    NVM_DIR=/opt/nvm \
    BUN_INSTALL=/opt/bun \
    COMPOSER_HOME=/opt/composer \
    WORKSPACE_ROOT=/workspace \
    PATH=/opt/bun/bin:/opt/composer/vendor/bin:$PATH

RUN apt-get update && apt-get install -y --no-install-recommends \
        bash-completion ca-certificates curl dnsutils file git htop iputils-ping jq less make \
        nano netcat-openbsd openssh-client procps sqlite3 tree unzip vim wget xz-utils zip \
    && rm -rf /var/lib/apt/lists/*

COPY --from=mlocati/php-extension-installer:2.12.0 /usr/bin/install-php-extensions /usr/local/bin/
RUN install-php-extensions bcmath intl pcntl pdo_pgsql pdo_sqlite zip xdebug \
    && printf "xdebug.mode=off\nmemory_limit=512M\n" > /usr/local/etc/php/conf.d/zz-stacklab.ini \
    && git config --system init.defaultBranch main \
    && git config --system advice.detachedHead false

COPY --from=composer:2.10.3 /usr/bin/composer /usr/local/bin/composer

RUN groupadd --gid ${LEARNER_GID} learner \
    && useradd --uid ${LEARNER_UID} --gid ${LEARNER_GID} --home-dir /workspace/.home --no-create-home --shell /bin/bash learner \
    && mkdir -p /opt/nvm /opt/bun /opt/composer /workspace /opt/stacklab \
    && chown -R learner:learner /opt/nvm /opt/bun /opt/composer /workspace

USER learner
RUN curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/${NVM_VERSION}/install.sh | PROFILE=/dev/null bash \
    && . /opt/nvm/nvm.sh \
    && nvm install ${NODE_DEFAULT} \
    && nvm alias default ${NODE_DEFAULT} \
    && nvm cache clear \
    && curl -fsSL https://bun.sh/install | bash -s "${BUN_VERSION}" \
    && composer global require --no-interaction --no-progress laravel/pint phpstan/phpstan laravel/installer \
    && composer clear-cache

USER root
COPY --from=gateway /usr/local/bin/node /usr/local/bin/stacklab-node
COPY --from=gateway /app /opt/stacklab/gateway
COPY rootfs/ /
RUN chmod 0644 /etc/profile.d/stacklab.sh && chmod 0755 /usr/local/bin/stacklab-entrypoint

USER learner
WORKDIR /workspace
EXPOSE 7681
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s CMD curl -fsS http://localhost:7681/api/health > /dev/null || exit 1
ENTRYPOINT ["/usr/local/bin/stacklab-entrypoint"]
