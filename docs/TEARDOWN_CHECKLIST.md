# 🗑️ Pipeline Pulse Complete Infrastructure Teardown Checklist

## ⚠️ **CRITICAL WARNING**
**This teardown is IRREVERSIBLE and will result in complete data loss!**
- All databases and stored data will be permanently deleted
- All application configurations will be lost
- All uploaded files will be permanently removed
- Domain routing will be broken

## 📋 **Pre-Teardown Checklist**

### 1. **Data Backup (if needed)**
- [ ] Export any critical data from Aurora PostgreSQL database
- [ ] Download any important files from S3 buckets
- [ ] Save any configuration settings you might need later
- [ ] Document any custom configurations

### 2. **Domain and DNS Considerations**
- [ ] Update DNS records to point away from Pipeline Pulse infrastructure
- [ ] Consider domain ownership and future use plans
- [ ] Backup any SSL certificates if needed elsewhere

### 3. **Access and Permissions**
- [ ] Ensure you have admin access to AWS account
- [ ] Verify AWS CLI is configured with appropriate permissions
- [ ] Confirm you're in the correct AWS region (ap-southeast-1)

## 🚀 **Automated Teardown Process**

### **Option 1: Run the Automated Script (Recommended)**
```bash
cd /Users/jrkphani/Projects/pipeline-pulse
./scripts/teardown-pipeline-pulse.sh
```

**What the script does:**
1. ✅ Stops and deletes ECS services and clusters
2. ✅ Deletes Application Load Balancers and target groups
3. ✅ Deletes Aurora PostgreSQL database (with all data)
4. ✅ Disables and deletes CloudFront distribution
5. ✅ Empties and deletes all S3 buckets
6. ✅ Deletes all Secrets Manager secrets
7. ✅ Deletes ECR repository
8. ✅ Deletes IAM roles and policies
9. ✅ Deletes security groups

## 📊 **Resources to be Deleted**

### **Compute & Containers**
- **ECS Clusters**: `pipeline-pulse-direct-access`, `pipeline-pulse-prod`
- **ECS Services**: `pipeline-pulse-direct-access-service`, `pipeline-pulse-prod-service-v2`
- **ECR Repository**: `pipeline-pulse`

### **Database**
- **Aurora Cluster**: `pipeline-pulse-aurora-dev`
- **DB Instance**: `pipeline-pulse-aurora-dev-instance`
- **Database**: `pipeline_pulse` (all data will be lost)

### **Networking**
- **Load Balancers**: 
  - `pipeline-pulse-alb`
  - `pipeline-pulse-direct-access-alb`
- **Security Groups**: 6 pipeline-pulse related security groups
- **Target Groups**: Associated with load balancers

### **Storage**
- **S3 Buckets**:
  - `pipeline-pulse-frontend-prod`
  - `pipeline-pulse-minimal-uploads`
  - `pipeline-pulse-uploads`
  - `1chsalesreports.com-frontend`

### **CDN & Distribution**
- **CloudFront Distribution**: `E15EC47TVWETI2`
- **Domain Aliases**: `1chsalesreports.com`, `api.1chsalesreports.com`, etc.

### **Security & Secrets**
- **Secrets Manager**:
  - `pipeline-pulse/app-secrets`
  - `pipeline-pulse/zoho/client-id`
  - `pipeline-pulse/zoho/client-secret`
  - `pipeline-pulse/zoho/refresh-token`
  - `pipeline-pulse/zoho/base-url`
  - `pipeline-pulse/zoho/accounts-url`

### **IAM & Permissions**
- **IAM Roles**:
  - `pipeline-pulse-direct-access-execution-role`
  - `pipeline-pulse-direct-access-task-role`
- **Associated policies and permissions**

## 💰 **Cost Savings Impact**

### **Immediate Savings**
- **Aurora PostgreSQL**: ~$50-100/month
- **ECS Fargate**: ~$20-40/month
- **Application Load Balancer**: ~$20/month
- **CloudFront**: ~$5-15/month
- **S3 Storage**: ~$5-20/month
- **Secrets Manager**: ~$2/month

**Total Estimated Monthly Savings: $100-200+**

## 🔒 **Security Benefits**

### **Risk Reduction**
- ✅ Removes all IAM roles and policies
- ✅ Deletes all stored secrets and credentials
- ✅ Eliminates exposed endpoints and services
- ✅ Removes database access points
- ✅ Cleans up security groups and network access

## ⏱️ **Teardown Timeline**

### **Immediate (0-5 minutes)**
- ECS services stopped
- Load balancers deleted
- S3 buckets emptied and deleted
- Secrets deleted
- IAM roles deleted

### **Medium (5-15 minutes)**
- Aurora database deletion
- Security groups cleanup
- ECR repository deletion

### **Extended (15-60 minutes)**
- CloudFront distribution deletion
- DNS propagation (if applicable)

## 🔍 **Post-Teardown Verification**

### **Manual Verification Commands**
```bash
# Verify ECS resources are gone
aws ecs list-clusters --region ap-southeast-1

# Verify databases are deleted
aws rds describe-db-clusters --region ap-southeast-1

# Verify S3 buckets are gone
aws s3 ls | grep pipeline

# Verify secrets are deleted
aws secretsmanager list-secrets --region ap-southeast-1

# Verify IAM roles are deleted
aws iam list-roles --query "Roles[?contains(RoleName, 'pipeline')]"
```

### **Expected Results**
- No pipeline-pulse related clusters in ECS
- No pipeline-pulse related databases in RDS
- No pipeline-pulse related buckets in S3
- No pipeline-pulse related secrets
- No pipeline-pulse related IAM roles

## 🚨 **Troubleshooting**

### **Common Issues**
1. **Dependency Errors**: Some resources may fail to delete due to dependencies
   - **Solution**: Run the script again after a few minutes
   
2. **CloudFront Deletion Delay**: CloudFront distributions take time to delete
   - **Solution**: This is normal and expected
   
3. **Security Group Dependencies**: May fail if still attached to resources
   - **Solution**: Manual cleanup may be required

### **Manual Cleanup (if needed)**
If the automated script fails, you can manually delete resources through:
- AWS Console
- Individual AWS CLI commands
- CloudFormation stack deletion (if applicable)

## ✅ **Final Confirmation**

After running the teardown script, you should see:
- ✅ All ECS resources removed
- ✅ Database completely deleted
- ✅ All S3 data permanently removed
- ✅ All secrets and credentials deleted
- ✅ All IAM roles and policies removed
- ✅ Significant monthly cost savings achieved
- ✅ Security exposure eliminated

**The Pipeline Pulse infrastructure will be completely removed from your AWS account.**
