.PHONY: all
all: up

.PHONY: re
re: down up

.PHONY: up
up:
	docker-compose -f src/docker-compose.yml up --build

.PHONY: down
down:
	docker-compose -f src/docker-compose.yml down

.PHONY: migrate
migrate:
	docker-compose -f src/docker-compose.yml exec backend /usr/local/bin/python backend/manage.py migrate

.PHONY: collect
collect:
	docker-compose -f src/docker-compose.yml exec backend /usr/local/bin/python backend/manage.py collectstatic

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

.PHONY: showmigrations
showmigrations:
	docker-compose -f src/docker-compose.yml exec backend /usr/local/bin/python backend/manage.py showmigrations

.PHONY: superuser
superuser:
	docker-compose -f src/docker-compose.yml exec backend /usr/local/bin/python backend/manage.py createsuperuser

.PHONY: logs
logs:
	@echo "Services:"
	@docker-compose -f src/docker-compose.yml config --services | column
	@echo
	@echo 'Enter service name to follow logs:'
	@read service; \
	docker-compose -f src/docker-compose.yml logs -f $$service

.PHONY: d
d:
	docker-compose -f src/docker-compose.yml up -d
