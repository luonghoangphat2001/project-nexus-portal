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

if [ -d "../.git" ] || [ -d ".git" ]; then
    git fetch origin main || true
    git reset --hard origin/main || true
fi

TARGET_SERVICE="${1:-all}"
if [ "$TARGET_SERVICE" = "backend" ]; then
    $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml build --no-cache backend_api
    $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml up -d backend_api
elif [ "$TARGET_SERVICE" = "frontend" ]; then
    $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml build --no-cache frontend_app
    $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml up -d frontend_app
else
    $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml build --no-cache
    $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml up -d --remove-orphans
fi

docker image prune -f
$DOCKER_COMPOSE_CMD -f docker-compose.prod.yml ps
