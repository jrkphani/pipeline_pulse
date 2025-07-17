# Pipeline Pulse - Quick Troubleshooting Reference

## 🚨 **Emergency Commands**

### Check Application Health
```bash
# Test health endpoint
curl -s "http://pipeline-pulse-direct-access-alb-1164616394.ap-southeast-1.elb.amazonaws.com/health"

# Check ECS service status
aws ecs describe-services --cluster pipeline-pulse-direct-access --services pipeline-pulse-direct-access-service --query 'services[0].{Status:status,RunningCount:runningCount,DesiredCount:desiredCount}' --output table --region ap-southeast-1
```

### View Application Logs
```bash
# List recent tasks
aws ecs list-tasks --cluster pipeline-pulse-direct-access --service-name pipeline-pulse-direct-access-service --region ap-southeast-1

# Get logs for specific task (replace TASK_ID)
aws logs get-log-events --log-group-name /ecs/pipeline-pulse-direct-access --log-stream-name ecs/pipeline-pulse-direct-access-backend/TASK_ID --limit 20 --region ap-southeast-1
```

### Check Database Connectivity
```bash
# Test database connection from application logs
aws logs filter-log-events --log-group-name /ecs/pipeline-pulse-direct-access --filter-pattern "database" --region ap-southeast-1

# Check database status
aws rds describe-db-instances --db-instance-identifier pipeline-pulse-db-dev --query 'DBInstances[0].{Status:DBInstanceStatus,Endpoint:Endpoint.Address}' --output table --region ap-southeast-1
```

---

## 🔧 **Common Issues & Quick Fixes**

### Issue: ECS Tasks Keep Stopping
**Symptoms**: RunningCount = 0, tasks in STOPPED state
**Quick Check**:
```bash
# Get stopped task details
aws ecs describe-tasks --cluster pipeline-pulse-direct-access --tasks $(aws ecs list-tasks --cluster pipeline-pulse-direct-access --desired-status STOPPED --query 'taskArns[0]' --output text) --query 'tasks[0].{StoppedReason:stoppedReason,StopCode:stopCode}' --output table --region ap-southeast-1
```
**Common Causes**:
- Platform architecture mismatch → Rebuild with `--platform linux/amd64`
- Secrets permission error → Check IAM roles
- Database connection timeout → Check VPC/security groups

### Issue: Database Connection Failed
**Symptoms**: "connection timeout" or "authentication failed"
**Quick Check**:
```bash
# Check security group rules
aws ec2 describe-security-groups --group-ids sg-0eca52a0e07bf8500 --query 'SecurityGroups[0].IpPermissions[*].{Protocol:IpProtocol,Port:FromPort,Source:UserIdGroupPairs[0].GroupId||CidrIp}' --output table --region ap-southeast-1

# Verify database password in secret
aws secretsmanager get-secret-value --secret-id pipeline-pulse/app-secrets --query 'SecretString' --output text --region ap-southeast-1
```

### Issue: ALB Health Check Failing
**Symptoms**: Target group shows "unhealthy"
**Quick Check**:
```bash
# Check target health
aws elbv2 describe-target-health --target-group-arn arn:aws:elasticloadbalancing:ap-southeast-1:272858488437:targetgroup/pipeline-pulse-direct-access-tg/f0e52940c3d524b7 --region ap-southeast-1

# Test health endpoint directly
curl -v "http://pipeline-pulse-direct-access-alb-1164616394.ap-southeast-1.elb.amazonaws.com/health"
```

---

## 🔄 **Deployment Commands**

### Force New Deployment
```bash
aws ecs update-service --cluster pipeline-pulse-direct-access --service pipeline-pulse-direct-access-service --force-new-deployment --region ap-southeast-1
```

### Update Task Definition
```bash
# Register new task definition
aws ecs register-task-definition --cli-input-json file://ecs-task-definition.json --region ap-southeast-1

# Update service with new revision
aws ecs update-service --cluster pipeline-pulse-direct-access --service pipeline-pulse-direct-access-service --task-definition pipeline-pulse-direct-access:NEW_REVISION --region ap-southeast-1
```

### Rebuild and Push Docker Image
```bash
cd backend
docker build --platform linux/amd64 -t pipeline-pulse-direct-access:latest .
docker tag pipeline-pulse-direct-access:latest 272858488437.dkr.ecr.ap-southeast-1.amazonaws.com/pipeline-pulse:direct-access-latest
aws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin 272858488437.dkr.ecr.ap-southeast-1.amazonaws.com
docker push 272858488437.dkr.ecr.ap-southeast-1.amazonaws.com/pipeline-pulse:direct-access-latest
```

---

## 📊 **Key AWS Resources**

### Infrastructure
- **ECS Cluster**: `pipeline-pulse-direct-access`
- **ECS Service**: `pipeline-pulse-direct-access-service`
- **ALB**: `pipeline-pulse-direct-access-alb-1164616394.ap-southeast-1.elb.amazonaws.com`
- **Target Group**: `pipeline-pulse-direct-access-tg`

### Security & Networking
- **VPC**: `vpc-0ce689a64c180be51` (Database VPC)
- **Security Group**: `sg-002e6735930a3d8e1`
- **Subnets**: `subnet-0a06ec9f913823080`, `subnet-007e5b5c2a006cc50`

### Database & Secrets
- **RDS Instance**: `pipeline-pulse-db-dev`
- **Database Endpoint**: `pipeline-pulse-db-dev.c39du3coqgj0.ap-southeast-1.rds.amazonaws.com`
- **Secret**: `pipeline-pulse/app-secrets`

### Logging
- **Log Group**: `/ecs/pipeline-pulse-direct-access`
- **Log Stream Pattern**: `ecs/pipeline-pulse-direct-access-backend/TASK_ID`

---

## 🚨 **Rollback Procedure**

### Emergency Rollback (if needed)
1. **Revert DNS**:
```bash
aws route53 change-resource-record-sets --hosted-zone-id Z06882003RVZ48NS7EIIU --change-batch '{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "api.1chsalesreports.com",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [
          {
            "Value": "pipeline-pulse-alb-1144051995.ap-southeast-1.elb.amazonaws.com"
          }
        ]
      }
    }
  ]
}'
```

2. **Scale Down New Service**:
```bash
aws ecs update-service --cluster pipeline-pulse-direct-access --service pipeline-pulse-direct-access-service --desired-count 0 --region ap-southeast-1
```

---

## 📞 **Escalation Contacts**

### AWS Support
- **Support Case**: Create via AWS Console
- **Service**: ECS, RDS, Route 53
- **Severity**: Based on business impact

### Internal Team
- **DevOps Lead**: [Contact Information]
- **Database Admin**: [Contact Information]
- **Security Team**: [Contact Information]

---

*Quick Reference Version: 1.0*  
*Last Updated: June 3, 2025*
