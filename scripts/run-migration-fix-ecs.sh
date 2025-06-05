#!/bin/bash

# Run migration fix as a one-time ECS task
# This runs in the same environment as the application with proper VPC access

echo "🔧 Running migration fix as ECS task..."

# Get the current task definition
TASK_DEF_ARN=$(aws ecs describe-services --cluster pipeline-pulse-prod --services pipeline-pulse-prod-service-v2 --region ap-southeast-1 --query 'services[0].taskDefinition' --output text)

echo "Using task definition: $TASK_DEF_ARN"

# Run a one-time task with the migration fix command
TASK_ARN=$(aws ecs run-task \
  --cluster pipeline-pulse-prod \
  --task-definition $TASK_DEF_ARN \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-0123456789abcdef0,subnet-0987654321fedcba0],securityGroups=[sg-0123456789abcdef0],assignPublicIp=ENABLED}" \
  --overrides '{
    "containerOverrides": [
      {
        "name": "pipeline-pulse-backend",
        "command": [
          "python", "-c", 
          "import boto3, psycopg2; rds=boto3.client(\"rds\", region_name=\"ap-southeast-1\"); token=rds.generate_db_auth_token(DBHostname=\"pipeline-pulse-db-dev.c39du3coqgj0.ap-southeast-1.rds.amazonaws.com\", Port=5432, DBUsername=\"postgres\", Region=\"ap-southeast-1\"); conn=psycopg2.connect(host=\"pipeline-pulse-db-dev.c39du3coqgj0.ap-southeast-1.rds.amazonaws.com\", database=\"pipeline_pulse\", user=\"postgres\", password=token, port=5432, sslmode=\"require\"); cursor=conn.cursor(); cursor.execute(\"SELECT version_num FROM alembic_version\"); version=cursor.fetchone(); print(f\"Current version: {version[0] if version else None}\"); cursor.execute(\"SELECT column_name FROM information_schema.columns WHERE table_name = \\\"analyses\\\" AND column_name = \\\"export_date\\\"\"); exists=cursor.fetchone() is not None; print(f\"export_date exists: {exists}\"); cursor.execute(\"UPDATE alembic_version SET version_num = \\\"007\\\" WHERE version_num != \\\"007\\\"\") if exists else None; conn.commit() if exists else None; print(\"Migration 007 marked as applied\" if exists else \"No update needed\"); cursor.close(); conn.close()"
        ]
      }
    ]
  }' \
  --region ap-southeast-1 \
  --query 'tasks[0].taskArn' \
  --output text)

echo "Started migration fix task: $TASK_ARN"

# Wait for task to complete
echo "Waiting for task to complete..."
aws ecs wait tasks-stopped --cluster pipeline-pulse-prod --tasks $TASK_ARN --region ap-southeast-1

# Get task exit code
EXIT_CODE=$(aws ecs describe-tasks --cluster pipeline-pulse-prod --tasks $TASK_ARN --region ap-southeast-1 --query 'tasks[0].containers[0].exitCode' --output text)

echo "Task completed with exit code: $EXIT_CODE"

if [ "$EXIT_CODE" = "0" ]; then
    echo "✅ Migration fix completed successfully"
else
    echo "❌ Migration fix failed"
    # Get logs
    echo "Task logs:"
    aws logs get-log-events --log-group-name /ecs/pipeline-pulse-prod --log-stream-name "ecs/pipeline-pulse-backend/$(echo $TASK_ARN | cut -d'/' -f3)" --region ap-southeast-1 --query 'events[].message' --output text
fi
