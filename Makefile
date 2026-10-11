.DEFAULT_GOAL := help
COMPOSE := docker compose

help: ## Show all commands
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

start: ## Start Stacklab and wait until it is ready (first start builds everything)
	@./bin/start.sh

stop: ## Stop Stacklab (progress and workspace stay)
	$(COMPOSE) down

restart: ## Restart Stacklab (e.g. after changing the workspace folder)
	$(COMPOSE) down
	@./bin/start.sh

setup: start ## Alias for start

up: start ## Alias for start

down: stop ## Alias for stop

workspace: ## Choose the workspace folder with the Finder / folder dialog
	@./bin/choose-workspace.sh

logs: ## Follow logs
	$(COMPOSE) logs -f --tail=100

dev: ## Vite dev server with hot reload on http://localhost:5173
	$(COMPOSE) --profile dev up vite

build-frontend: ## Rebuild the frontend bundle
	$(COMPOSE) run --rm frontend

import: ## Re-import all content after editing files in content/
	$(COMPOSE) exec php php artisan stacklab:import

validate: ## Validate content (also prints warnings)
	$(COMPOSE) exec php php artisan stacklab:validate --warnings

test: ## Run backend, sandbox and frontend tests
	$(COMPOSE) exec php ./vendor/bin/pest
	$(COMPOSE) run --rm --no-deps frontend sh -c "bun install --frozen-lockfile && bun run test"
	$(COMPOSE) exec sandbox stacklab-node --test /opt/stacklab/gateway/src/sandbox.test.ts

shell: ## Open a shell in the practice sandbox
	$(COMPOSE) exec sandbox bash --login

artisan: ## Run artisan, e.g. make artisan cmd="route:list"
	$(COMPOSE) exec php php artisan $(cmd)

reset-db: ## Delete all progress and re-import (asks for confirmation)
	@read -p "Wirklich ALLE Fortschritte löschen? [j/N] " ok && [ "$$ok" = "j" ]
	$(COMPOSE) exec php php artisan migrate:fresh --force
	$(COMPOSE) exec php php artisan stacklab:import

.PHONY: help start stop restart setup up down workspace logs dev build-frontend import validate test shell artisan reset-db
