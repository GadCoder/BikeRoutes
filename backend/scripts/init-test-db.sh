#!/bin/bash
set -e

# Create test database for pytest
# This runs once when the postgres container initializes

TEST_DB="${POSTGRES_TEST_DB:-bikeroutes_test}"

echo "Creating test database: $TEST_DB"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE $TEST_DB;
    GRANT ALL PRIVILEGES ON DATABASE $TEST_DB TO $POSTGRES_USER;
EOSQL

# Enable PostGIS extension in test database
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$TEST_DB" <<-'
    CREATE EXTENSION IF NOT EXISTS postgis;
    CREATE EXTENSION IF NOT EXISTS postgis_topology;
'

echo "Test database $TEST_DB created with PostGIS"
