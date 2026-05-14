.PHONY: test test-pact test-e2e clean-stack install-deps install-pact-ffi

# Version pinned to match backend/go.mod's pact-go dependency.
PACT_GO_VERSION := v2.4.2

PACT_ENV := CGO_ENABLED=1 PORT=8082 POSTGRES_HOST=localhost POSTGRES_PORT=5433 POSTGRES_USER=chatbot_test POSTGRES_PASSWORD=chatbot_test POSTGRES_DB=chatbot_test ADMIN_EMAIL=user@gmail.com ADMIN_PASSWORD=password JWT_SECRET=test-secret

test: test-pact test-e2e

# Tear down anything left over from a previous (possibly aborted) run.
# `-` prefix tells make to ignore non-zero exit if there's nothing to tear down.
clean-stack:
	@echo "==> Removing any leftover test stack..."
	-@docker compose -f docker-compose.test.yml down -v --remove-orphans 2>/dev/null

# Install Node deps + Playwright Chromium if either is missing. Both commands
# are idempotent, so the cost when already installed is just the existence check.
install-deps:
	@if [ ! -d node_modules/@playwright/test ]; then \
	  echo "==> Installing Node dependencies..."; \
	  npm install; \
	fi
	@echo "==> Ensuring Playwright Chromium is installed..."
	@npx playwright install chromium

# libpact_ffi is a native shared library that pact-go links against via CGO.
# The linker searches /tmp and /usr/local/lib (see the link line in any failed
# `go test` output), so we check both. Install via the pact-go CLI, pinned to
# the same version as backend/go.mod to avoid ABI mismatches. The install step
# writes to /usr/local/lib and will prompt for sudo on macOS.
install-pact-ffi:
	@if ls /usr/local/lib/libpact_ffi.* /tmp/libpact_ffi.* > /dev/null 2>&1; then \
	  echo "==> libpact_ffi already installed; skipping."; \
	else \
	  echo "==> libpact_ffi not found; installing..."; \
	  if ! command -v pact-go > /dev/null && [ ! -x "$$(go env GOPATH)/bin/pact-go" ]; then \
	    echo "==> Installing pact-go CLI ($(PACT_GO_VERSION))..."; \
	    go install github.com/pact-foundation/pact-go/v2@$(PACT_GO_VERSION); \
	  fi; \
	  echo "==> Running pact-go install with sudo (writes libpact_ffi to /usr/local/lib)..."; \
	  sudo "$$(go env GOPATH)/bin/pact-go" -l DEBUG install; \
	fi

test-pact: clean-stack install-pact-ffi
	npm run test:pact:consumer
	docker compose -f docker-compose.test.yml up -d postgres-test
	@echo "Waiting for postgres-test..."
	@until docker compose -f docker-compose.test.yml exec -T postgres-test pg_isready -U chatbot_test > /dev/null 2>&1; do sleep 1; done
	(cd ../backend && $(PACT_ENV) go test ./tests/pact/... -v); \
	  EXIT=$$?; \
	  echo "==> Tearing down test stack..."; \
	  docker compose -f docker-compose.test.yml down -v --remove-orphans; \
	  exit $$EXIT

test-e2e: clean-stack install-deps
	@echo "==> Starting test stack..."
	docker compose -f docker-compose.test.yml up -d
	@echo "Waiting for frontend-test..."
	@until curl -sf http://localhost:3001 > /dev/null 2>&1; do sleep 2; done
	@until curl -sf -o /dev/null -w "%{http_code}" http://localhost:8081/api/projects | grep -qE '^(200|401|403)$$'; do sleep 2; done
	@echo "==> Running Playwright tests..."
	npx playwright test e2e/; \
	  EXIT=$$?; \
	  echo "==> Tearing down test stack..."; \
	  docker compose -f docker-compose.test.yml down -v --remove-orphans; \
	  exit $$EXIT
