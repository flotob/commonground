#!/bin/bash
cd ${0%/*}

# trap + cleanup are fixes for a current docker-compose logs bug
# see https://github.com/docker/compose/issues/8880

trap cleanup EXIT

function cleanup() {
    if [ -n "$pid" ]; then
        pkill -P $pid --signal 9
        kill -9 $pid
    fi
}

COMPOSE_EXISTS=$(type -P docker-compose | wc -l)
if [ $COMPOSE_EXISTS -gt 0 ]
then
  COMPOSE_CMD="docker-compose"
else
  COMPOSE_CMD="docker compose"
fi

eval "$COMPOSE_CMD logs -f 2>&1 &"
pid=$!
wait $pid