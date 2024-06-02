.PHONY: all
all: up

.PHONY: re
re: down up

.PHONY: up
up:
	docker-compose -f src/docker-compose.yml up -d --build

.PHONY: down
down:
	docker-compose -f src/docker-compose.yml down

.PHONY: migrate
migrate:
	docker-compose -f src/docker-compose.yml exec backend /usr/local/bin/python backend/manage.py migrate

.PHONY: migrations
migrations:
	docker-compose -f src/docker-compose.yml exec backend /usr/local/bin/python backend/manage.py makemigrations

.PHONY: test
test:
	docker-compose -f src/docker-compose.yml exec backend /usr/local/bin/python backend/manage.py test backend/

.PHONY: venv
venv:
	source env/bin/activate

.PHONY: bash
bash:
	@echo "Services:"
	@docker-compose -f src/docker-compose.yml config --services | column
	@echo
	@echo 'Enter service name to start bash:'
	@read service; \
	docker-compose -f src/docker-compose.yml exec $$service /bin/bash
