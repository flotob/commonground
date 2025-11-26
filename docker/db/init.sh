#!/bin/bash
until pg_isready; do
	echo "DB not ready..."
	sleep 1
done
cryptogram_exists=$(psql -A -t -c "SELECT COUNT(*) FROM pg_database WHERE datname='cryptogram';")
if [ "$cryptogram_exists" = "1" ]
then
	echo "Database exists, exiting..."
else
	echo "Database doesn't exist, creating database..."
	cat <<-EOF | psql -f -
	CREATE DATABASE cryptogram ENCODING 'utf8';
	\c cryptogram;

	CREATE ROLE writer LOGIN PASSWORD '$PG_WRITER_PASSWORD';

	CREATE ROLE reader LOGIN PASSWORD '$PG_READER_PASSWORD';

	EOF
fi
exit 0