# Laravel 13 needs PHP >= 8.4 (property-hook syntax in the framework), so we
# pin the runtime instead of relying on a builder's default.
FROM php:8.5-cli-alpine

RUN apk add --no-cache git unzip
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --prefer-dist --no-scripts

COPY . .
RUN composer dump-autoload --optimize --no-scripts

EXPOSE 8080

# /data is a Railway volume: the SQLite db and the run-once seed marker
# survive restarts and redeploys.
CMD ["sh", "-c", "mkdir -p /data && touch /data/database.sqlite && php artisan package:discover --ansi && php artisan migrate --force && ([ -f /data/.seeded ] || (php artisan db:seed --force && touch /data/.seeded)) && php artisan serve --host 0.0.0.0 --port ${PORT:-8080}"]
