#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "$PROJECT_DIR"

if ! command -v docker &> /dev/null; then
    echo "Docker is not installed."
    exit 1
fi

if docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    echo "Docker Compose is not installed."
    exit 1
fi

if [ ! -f "be/.env" ] && [ -f "be/.env.example" ]; then
    cp be/.env.example be/.env
fi

if [ ! -f "fe/.env" ] && [ -f "fe/.env.example" ]; then
    cp fe/.env.example fe/.env
fi

# Refuse an ambiguous database target before building or recreating containers.
$DOCKER_COMPOSE_CMD --env-file be/.env -p nexus-portal -f docker-compose.prod.yml config --quiet

# Remove containers created by the former hard-coded container_name setup.
# Their ports/volumes can otherwise block the project-scoped containers below.
for legacy_container in nexus_mysql_db nexus_backend_api nexus_frontend_app; do
    if docker container inspect "$legacy_container" >/dev/null 2>&1; then
        echo "Removing legacy container: $legacy_container"
        docker rm -f "$legacy_container"
    fi
done

TARGET_SERVICE="${1:-all}"
if [ "$TARGET_SERVICE" = "backend" ]; then
    $DOCKER_COMPOSE_CMD --env-file be/.env -p nexus-portal -f docker-compose.prod.yml build --no-cache backend_api
    $DOCKER_COMPOSE_CMD --env-file be/.env -p nexus-portal -f docker-compose.prod.yml up -d --remove-orphans
elif [ "$TARGET_SERVICE" = "frontend" ]; then
    $DOCKER_COMPOSE_CMD --env-file be/.env -p nexus-portal -f docker-compose.prod.yml build --no-cache frontend_app
    $DOCKER_COMPOSE_CMD --env-file be/.env -p nexus-portal -f docker-compose.prod.yml up -d --remove-orphans
else
    $DOCKER_COMPOSE_CMD --env-file be/.env -p nexus-portal -f docker-compose.prod.yml build --no-cache
    $DOCKER_COMPOSE_CMD --env-file be/.env -p nexus-portal -f docker-compose.prod.yml up -d --remove-orphans
fi

# Apply pending SQL migrations to ensure schema and seed consistency
if [ "$TARGET_SERVICE" != "frontend" ]; then
    echo "Applying migrations to mysql_db..."
    sleep 3
    if [ -d "be/src/main/resources/migrations" ]; then
        for sql_file in $(ls be/src/main/resources/migrations/*.sql 2>/dev/null | sort); do
            echo "Executing: $sql_file"
            $DOCKER_COMPOSE_CMD --env-file be/.env -p nexus-portal -f docker-compose.prod.yml exec -T mysql_db sh -c 'mysql --default-character-set=utf8mb4 -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"' < "$sql_file" || true
        done
    fi
fi

docker image prune -f
$DOCKER_COMPOSE_CMD --env-file be/.env -p nexus-portal -f docker-compose.prod.yml ps
