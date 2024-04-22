all: up

re: down up

up:
	docker-compose -f src/docker-compose.yml up --build

down:
	docker-compose -f src/docker-compose.yml down