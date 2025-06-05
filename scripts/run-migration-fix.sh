#!/bin/bash

# Run the migration fix script using the same Docker image as the backend
# This ensures we have the same environment and dependencies

echo "🔧 Running migration conflict fix..."

# Get the current backend image
BACKEND_IMAGE="272858488437.dkr.ecr.ap-southeast-1.amazonaws.com/pipeline-pulse:latest"

# Run the migration fix script in a container with the same environment as ECS
docker run --rm \
  -e AWS_DEFAULT_REGION=ap-southeast-1 \
  -e DB_ENDPOINT=pipeline-pulse-db-dev.c39du3coqgj0.ap-southeast-1.rds.amazonaws.com \
  -e DB_NAME=pipeline_pulse \
  -e DB_USER=postgres \
  -v ~/.aws:/root/.aws:ro \
  -v $(pwd)/scripts/fix-migration-conflict.py:/app/fix-migration-conflict.py \
  $BACKEND_IMAGE \
  python /app/fix-migration-conflict.py

echo "✅ Migration fix completed"
