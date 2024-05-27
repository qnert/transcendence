all: up

re: down up

up:
	docker-compose -f src/docker-compose.yml up --build

down:
	docker-compose -f src/docker-compose.yml down

migrate:
	docker-compose -f src/docker-compose.yml exec backend /usr/local/bin/python backend/manage.py migrate

bash:
	@echo "Services:"
	@docker-compose -f src/docker-compose.yml config --services | column
	@echo
	@echo 'Enter service name to start bash:'
	@read service; \
	docker-compose -f src/docker-compose.yml exec $$service /bin/bash
