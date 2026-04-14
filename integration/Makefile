.PHONY: test test-pact test-e2e

PACT_ENV := CGO_ENABLED=1 POSTGRES_HOST=localhost POSTGRES_PORT=5433 POSTGRES_USER=chatbot_test POSTGRES_PASSWORD=chatbot_test POSTGRES_DB=chatbot_test ADMIN_EMAIL=user@gmail.com ADMIN_PASSWORD=password JWT_SECRET=test-secret

test: test-pact test-e2e

test-pact:
	npm run test:pact:consumer
	docker compose -f docker-compose.test.yml up -d postgres-test
	@echo "Waiting for postgres-test..."
	@until docker compose -f docker-compose.test.yml exec -T postgres-test pg_isready -U chatbot_test > /dev/null 2>&1; do sleep 1; done
	cd ../backend && $(PACT_ENV) go test ./tests/pact/... -v
	docker compose -f docker-compose.test.yml stop postgres-test

test-e2e:
	docker compose -f docker-compose.test.yml up -d
	@echo "Waiting for frontend-test..."
	@until curl -sf http://localhost:3001 > /dev/null 2>&1; do sleep 2; done
	npx playwright test e2e/
	docker compose -f docker-compose.test.yml down
