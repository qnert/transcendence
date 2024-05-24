all: up

re: down up

up:
	docker-compose -f src/docker-compose.yml up --build

down:
	docker-compose -f src/docker-compose.yml down

migrate:
	cd src/; docker-compose exec backend /bin/bash