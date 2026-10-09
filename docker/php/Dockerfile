# syntax=docker/dockerfile:1.7
FROM php:8.5-fpm-alpine

COPY --from=mlocati/php-extension-installer:2.12.0 /usr/bin/install-php-extensions /usr/local/bin/
RUN install-php-extensions pdo_pgsql intl bcmath opcache pcntl zip \
    && apk add --no-cache bash postgresql-client

COPY --from=composer:2.10.3 /usr/bin/composer /usr/local/bin/composer
COPY php.ini /usr/local/etc/php/conf.d/zz-stacklab.ini
COPY entrypoint.sh /usr/local/bin/stacklab-entrypoint
RUN chmod 0755 /usr/local/bin/stacklab-entrypoint

WORKDIR /var/www/backend
ENTRYPOINT ["/usr/local/bin/stacklab-entrypoint"]
CMD ["php-fpm"]
