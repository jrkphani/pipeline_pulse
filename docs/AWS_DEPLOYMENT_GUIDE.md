# Pipeline Pulse Deployment Guide - 1chsalesreports.com

## 🎯 **Deployment Overview**

```
Repository: https://github.com/jrkphani/pipeline_pulse.git
Domain: 1chsalesreports.com (Route 53 ✅)
Frontend: https://1chsalesreports.com (S3 + CloudFront)
Backend API: https://api.1chsalesreports.com (ECS Fargate)
Database: RDS PostgreSQL (Private)
```

## 📁 **Current Repository Structure**

```
pipeline-pulse/
├── frontend/                 # React/Vite application
│   ├── src/
│   ├── public/
│   ├── package.json         # Vite + TypeScript setup
│   ├── .env
│   ├── vite.config.ts
│   └── tsconfig.json
├── backend/                 # FastAPI application
│   ├── app/
│   ├── main.py
│   ├── requirements.txt
│   ├── .env
│   └── .env.example
├── docs/
├── O2R_COMPLETE_MAPPING.md
├── README.md
└── (other documentation files)
```

## 🔧 **Required Repository Updates**

### **Step 1: Add Infrastructure Directory**
```bash
cd /Users/jrkphani/Projects/pipeline-pulse

# Create infrastructure directory structure
mkdir -p infrastructure/cloudformation
mkdir -p infrastructure/scripts
mkdir -p .github/workflows

# Create deployment scripts
mkdir -p scripts
```

### **Step 2: Add Dockerfile for Backend**

Create `backend/Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd --create-home --shell /bin/bash appuser && \
    chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### **Step 3: Update Frontend Build Configuration**

Create `frontend/amplify.yml`:
```yaml
version: 1
env:
  variables:
    VITE_API_URL: 'https://api.1chsalesreports.com'
    VITE_ENVIRONMENT: 'production'
    VITE_APP_NAME: 'Pipeline Pulse'
    VITE_COMPANY_NAME: '1CloudHub'
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

### **Step 4: Update Environment Files**

Update `backend/.env.example`:
```bash
# Database
DATABASE_URL=postgresql://username:password@host:5432/pipeline_pulse

# Zoho CRM Configuration
ZOHO_CLIENT_ID=your_zoho_client_id
ZOHO_CLIENT_SECRET=your_zoho_client_secret
ZOHO_REFRESH_TOKEN=your_refresh_token
ZOHO_BASE_URL=https://www.zohoapis.com/crm/v2

# API Configuration
CORS_ORIGINS=https://1chsalesreports.com,https://www.1chsalesreports.com
JWT_SECRET_KEY=your_jwt_secret_key
ENVIRONMENT=production

# Optional
REDIS_URL=redis://localhost:6379
```

Update `frontend/.env.example`:
```bash
# API Configuration
VITE_API_URL=https://api.1chsalesreports.com
VITE_ENVIRONMENT=production
VITE_APP_NAME=Pipeline Pulse
VITE_COMPANY_NAME=1CloudHub
```

## 🏗️ **Step 5: Infrastructure Setup**

### **Main Infrastructure (infrastructure/cloudformation/main.yml)**
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Pipeline Pulse Infrastructure for 1chsalesreports.com'

Parameters:
  DomainName:
    Type: String
    Default: '1chsalesreports.com'
  CertificateArn:
    Type: String
    Description: 'ARN of the SSL certificate'
  
Resources:
  # VPC and Networking
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: pipeline-pulse-vpc

  # Private Subnets for ECS and RDS
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: pipeline-pulse-private-1

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: pipeline-pulse-private-2

  # Public Subnets for ALB
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.101.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: pipeline-pulse-public-1

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.102.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: pipeline-pulse-public-2

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: pipeline-pulse-igw

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # NAT Gateway for private subnets
  NATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt EIPForNAT.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: pipeline-pulse-nat

  EIPForNAT:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: pipeline-pulse-public-rt

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: pipeline-pulse-private-rt

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway

  # Subnet associations
  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable

  # Security Groups
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Application Load Balancer
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: pipeline-pulse-alb-sg

  ECSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for ECS tasks
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 8000
          ToPort: 8000
          SourceSecurityGroupId: !Ref ALBSecurityGroup
      Tags:
        - Key: Name
          Value: pipeline-pulse-ecs-sg

  RDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for RDS database
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref ECSSecurityGroup
      Tags:
        - Key: Name
          Value: pipeline-pulse-rds-sg

  # S3 Bucket for Frontend
  FrontendBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${DomainName}-frontend'
      WebsiteConfiguration:
        IndexDocument: index.html
        ErrorDocument: error.html
      PublicAccessBlockConfiguration:
        BlockPublicAcls: false
        BlockPublicPolicy: false
        IgnorePublicAcls: false
        RestrictPublicBuckets: false

  FrontendBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref FrontendBucket
      PolicyDocument:
        Statement:
          - Sid: PublicReadGetObject
            Effect: Allow
            Principal: '*'
            Action: 's3:GetObject'
            Resource: !Sub '${FrontendBucket}/*'

  # CloudFront Distribution
  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Aliases:
          - !Ref DomainName
          - !Sub 'www.${DomainName}'
        DefaultCacheBehavior:
          TargetOriginId: S3Origin
          ViewerProtocolPolicy: redirect-to-https
          CachePolicyId: 658327ea-f89d-4fab-a63d-7e88639e58f6  # Managed-CachingOptimized
        DefaultRootObject: index.html
        Enabled: true
        Origins:
          - Id: S3Origin
            DomainName: !GetAtt FrontendBucket.RegionalDomainName
            S3OriginConfig:
              OriginAccessIdentity: ''
        PriceClass: PriceClass_100
        ViewerCertificate:
          AcmCertificateArn: !Ref CertificateArn
          SslSupportMethod: sni-only
          MinimumProtocolVersion: TLSv1.2_2021
        CustomErrorResponses:
          - ErrorCode: 404
            ResponseCode: 200
            ResponsePagePath: /index.html
          - ErrorCode: 403
            ResponseCode: 200
            ResponsePagePath: /index.html

  # Route 53 Records
  MainRoute53Record:
    Type: AWS::Route53::RecordSet
    Properties:
      HostedZoneName: !Sub '${DomainName}.'
      Name: !Ref DomainName
      Type: A
      AliasTarget:
        DNSName: !GetAtt CloudFrontDistribution.DomainName
        HostedZoneId: Z2FDTNDATAQYW2  # CloudFront hosted zone ID

  WWWRoute53Record:
    Type: AWS::Route53::RecordSet
    Properties:
      HostedZoneName: !Sub '${DomainName}.'
      Name: !Sub 'www.${DomainName}'
      Type: A
      AliasTarget:
        DNSName: !GetAtt CloudFrontDistribution.DomainName
        HostedZoneId: Z2FDTNDATAQYW2  # CloudFront hosted zone ID

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'
  
  PrivateSubnet1Id:
    Description: Private Subnet 1 ID
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet1-ID'
  
  PrivateSubnet2Id:
    Description: Private Subnet 2 ID
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet2-ID'
  
  PublicSubnet1Id:
    Description: Public Subnet 1 ID
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet1-ID'
  
  PublicSubnet2Id:
    Description: Public Subnet 2 ID
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet2-ID'
  
  ECSSecurityGroupId:
    Description: ECS Security Group ID
    Value: !Ref ECSSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-ECS-SecurityGroup-ID'
  
  RDSSecurityGroupId:
    Description: RDS Security Group ID
    Value: !Ref RDSSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-RDS-SecurityGroup-ID'
  
  ALBSecurityGroupId:
    Description: ALB Security Group ID
    Value: !Ref ALBSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-ALB-SecurityGroup-ID'
  
  FrontendBucketName:
    Description: Frontend S3 Bucket Name
    Value: !Ref FrontendBucket
    Export:
      Name: !Sub '${AWS::StackName}-Frontend-Bucket'
  
  CloudFrontDistributionId:
    Description: CloudFront Distribution ID
    Value: !Ref CloudFrontDistribution
    Export:
      Name: !Sub '${AWS::StackName}-CloudFront-ID'
  
  CloudFrontDomainName:
    Description: CloudFront Distribution Domain Name
    Value: !GetAtt CloudFrontDistribution.DomainName
    Export:
      Name: !Sub '${AWS::StackName}-CloudFront-Domain'
```

### **RDS Configuration (infrastructure/cloudformation/rds.yml)**
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'RDS PostgreSQL setup for Pipeline Pulse'

Parameters:
  StackName:
    Type: String
    Default: 'pipeline-pulse-infrastructure'
  DBUsername:
    Type: String
    Default: 'postgres'
    Description: 'Database master username'
  DBPassword:
    Type: String
    NoEcho: true
    Description: 'Database master password'
    MinLength: 8

Resources:
  # DB Subnet Group
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Subnet group for Pipeline Pulse database
      SubnetIds:
        - Fn::ImportValue: !Sub '${StackName}-PrivateSubnet1-ID'
        - Fn::ImportValue: !Sub '${StackName}-PrivateSubnet2-ID'
      Tags:
        - Key: Name
          Value: pipeline-pulse-db-subnet-group

  # RDS Instance
  DatabaseInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      DBInstanceIdentifier: pipeline-pulse-db
      DBInstanceClass: db.t4g.micro
      Engine: postgres
      EngineVersion: '15.4'
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Ref DBPassword
      AllocatedStorage: 20
      StorageType: gp3
      StorageEncrypted: true
      VPCSecurityGroups:
        - Fn::ImportValue: !Sub '${StackName}-RDS-SecurityGroup-ID'
      DBSubnetGroupName: !Ref DBSubnetGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      MultiAZ: false
      PubliclyAccessible: false
      DeletionProtection: true
      DBName: pipeline_pulse
      Tags:
        - Key: Name
          Value: pipeline-pulse-database

Outputs:
  DatabaseEndpoint:
    Description: RDS instance endpoint
    Value: !GetAtt DatabaseInstance.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-DB-Endpoint'
  
  DatabasePort:
    Description: RDS instance port
    Value: !GetAtt DatabaseInstance.Endpoint.Port
    Export:
      Name: !Sub '${AWS::StackName}-DB-Port'
```

### **ECS Configuration (infrastructure/cloudformation/ecs.yml)**
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'ECS Fargate setup for Pipeline Pulse API'

Parameters:
  StackName:
    Type: String
    Default: 'pipeline-pulse-infrastructure'
  DomainName:
    Type: String
    Default: '1chsalesreports.com'
  CertificateArn:
    Type: String
    Description: 'ARN of the SSL certificate'
  ECRImageURI:
    Type: String
    Description: 'ECR image URI for the application'
  DBEndpoint:
    Type: String
    Description: 'RDS endpoint'

Resources:
  # ECS Cluster
  ECSCluster:
    Type: AWS::ECS::Cluster
    Properties:
      ClusterName: pipeline-pulse-cluster
      CapacityProviders:
        - FARGATE
        - FARGATE_SPOT
      DefaultCapacityProviderStrategy:
        - CapacityProvider: FARGATE
          Weight: 1

  # ECS Task Definition
  TaskDefinition:
    Type: AWS::ECS::TaskDefinition
    Properties:
      Family: pipeline-pulse-api
      NetworkMode: awsvpc
      RequiresCompatibilities:
        - FARGATE
      Cpu: 256
      Memory: 512
      ExecutionRoleArn: !Ref ECSTaskExecutionRole
      TaskRoleArn: !Ref ECSTaskRole
      ContainerDefinitions:
        - Name: pipeline-pulse-api
          Image: !Ref ECRImageURI
          PortMappings:
            - ContainerPort: 8000
              Protocol: tcp
          LogConfiguration:
            LogDriver: awslogs
            Options:
              awslogs-group: !Ref LogGroup
              awslogs-region: !Ref AWS::Region
              awslogs-stream-prefix: ecs
          Environment:
            - Name: ENVIRONMENT
              Value: production
            - Name: CORS_ORIGINS
              Value: !Sub 'https://${DomainName},https://www.${DomainName}'
          Secrets:
            - Name: DATABASE_URL
              ValueFrom: !Ref DatabaseURLSecret
            - Name: ZOHO_CLIENT_ID
              ValueFrom: !Ref ZohoClientIdSecret
            - Name: ZOHO_CLIENT_SECRET
              ValueFrom: !Ref ZohoClientSecretSecret
            - Name: JWT_SECRET_KEY
              ValueFrom: !Ref JWTSecretKeySecret
          HealthCheck:
            Command:
              - CMD-SHELL
              - 'curl -f http://localhost:8000/health || exit 1'
            Interval: 30
            Timeout: 5
            Retries: 3
            StartPeriod: 60

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: pipeline-pulse-alb
      Scheme: internet-facing
      Type: application
      Subnets:
        - Fn::ImportValue: !Sub '${StackName}-PublicSubnet1-ID'
        - Fn::ImportValue: !Sub '${StackName}-PublicSubnet2-ID'
      SecurityGroups:
        - Fn::ImportValue: !Sub '${StackName}-ALB-SecurityGroup-ID'

  # Target Group
  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: pipeline-pulse-tg
      Port: 8000
      Protocol: HTTP
      VpcId:
        Fn::ImportValue: !Sub '${StackName}-VPC-ID'
      TargetType: ip
      HealthCheckPath: /health
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3

  # HTTPS Listener
  HTTPSListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 443
      Protocol: HTTPS
      Certificates:
        - CertificateArn: !Ref CertificateArn
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup

  # HTTP Listener (redirect to HTTPS)
  HTTPListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: redirect
          RedirectConfig:
            Protocol: HTTPS
            Port: 443
            StatusCode: HTTP_301

  # ECS Service
  ECSService:
    Type: AWS::ECS::Service
    DependsOn: HTTPSListener
    Properties:
      ServiceName: pipeline-pulse-api-service
      Cluster: !Ref ECSCluster
      TaskDefinition: !Ref TaskDefinition
      LaunchType: FARGATE
      DesiredCount: 1
      NetworkConfiguration:
        AwsvpcConfiguration:
          SecurityGroups:
            - Fn::ImportValue: !Sub '${StackName}-ECS-SecurityGroup-ID'
          Subnets:
            - Fn::ImportValue: !Sub '${StackName}-PrivateSubnet1-ID'
            - Fn::ImportValue: !Sub '${StackName}-PrivateSubnet2-ID'
      LoadBalancers:
        - ContainerName: pipeline-pulse-api
          ContainerPort: 8000
          TargetGroupArn: !Ref TargetGroup

  # IAM Roles
  ECSTaskExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: ecs-tasks.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
      Policies:
        - PolicyName: SecretsManagerAccess
          PolicyDocument:
            Statement:
              - Effect: Allow
                Action:
                  - secretsmanager:GetSecretValue
                Resource: 
                  - !Ref DatabaseURLSecret
                  - !Ref ZohoClientIdSecret
                  - !Ref ZohoClientSecretSecret
                  - !Ref JWTSecretKeySecret

  ECSTaskRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: ecs-tasks.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: ApplicationPermissions
          PolicyDocument:
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub '${LogGroup}/*'

  # Secrets Manager
  DatabaseURLSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: pipeline-pulse/database-url
      Description: Database connection URL
      SecretString: !Sub 'postgresql://postgres:${AWS::NoValue}@${DBEndpoint}:5432/pipeline_pulse'

  ZohoClientIdSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: pipeline-pulse/zoho-client-id
      Description: Zoho CRM Client ID
      SecretString: 'your_zoho_client_id_here'

  ZohoClientSecretSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: pipeline-pulse/zoho-client-secret
      Description: Zoho CRM Client Secret
      SecretString: 'your_zoho_client_secret_here'

  JWTSecretKeySecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: pipeline-pulse/jwt-secret-key
      Description: JWT Secret Key
      GenerateSecretString:
        SecretStringTemplate: '{}'
        GenerateStringKey: 'JWT_SECRET_KEY'
        PasswordLength: 64
        ExcludeCharacters: '"@/\'

  # CloudWatch Log Group
  LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: /ecs/pipeline-pulse-api
      RetentionInDays: 14

  # Route 53 Record for API
  APIRoute53Record:
    Type: AWS::Route53::RecordSet
    Properties:
      HostedZoneName: !Sub '${DomainName}.'
      Name: !Sub 'api.${DomainName}'
      Type: A
      AliasTarget:
        DNSName: !GetAtt ApplicationLoadBalancer.DNSName
        HostedZoneId: !GetAtt ApplicationLoadBalancer.CanonicalHostedZoneID

Outputs:
  LoadBalancerDNS:
    Description: DNS name of the load balancer
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-LoadBalancer-DNS'
  
  ECSClusterName:
    Description: Name of the ECS cluster
    Value: !Ref ECSCluster
    Export:
      Name: !Sub '${AWS::StackName}-ECS-Cluster'
  
  ECSServiceName:
    Description: Name of the ECS service
    Value: !Ref ECSService
    Export:
      Name: !Sub '${AWS::StackName}-ECS-Service'
```

## 🚀 **Step 6: GitHub Actions CI/CD**

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy Pipeline Pulse

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: pipeline-pulse
  DOMAIN_NAME: 1chsalesreports.com

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        component: [frontend, backend]
    
    steps:
    - name: Checkout
      uses: actions/checkout@v4

    - name: Test Frontend
      if: matrix.component == 'frontend'
      run: |
        cd frontend
        npm ci
        npm run lint
        # Add npm test when you have tests

    - name: Test Backend
      if: matrix.component == 'backend'
      run: |
        cd backend
        python -m pip install --upgrade pip
        pip install -r requirements.txt
        # Add pytest when you have tests

  deploy-infrastructure:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    needs: test
    
    steps:
    - name: Checkout
      uses: actions/checkout@v4

    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${{ env.AWS_REGION }}

    - name: Deploy main infrastructure
      run: |
        aws cloudformation deploy \
          --template-file infrastructure/cloudformation/main.yml \
          --stack-name pipeline-pulse-infrastructure \
          --parameter-overrides \
            DomainName=${{ env.DOMAIN_NAME }} \
            CertificateArn=${{ secrets.CERTIFICATE_ARN }} \
          --capabilities CAPABILITY_IAM \
          --no-fail-on-empty-changeset

    - name: Deploy RDS
      run: |
        aws cloudformation deploy \
          --template-file infrastructure/cloudformation/rds.yml \
          --stack-name pipeline-pulse-rds \
          --parameter-overrides \
            StackName=pipeline-pulse-infrastructure \
            DBUsername=postgres \
            DBPassword=${{ secrets.DB_PASSWORD }} \
          --capabilities CAPABILITY_IAM \
          --no-fail-on-empty-changeset

  build-and-deploy-backend:
    needs: deploy-infrastructure
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v4

    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${{ env.AWS_REGION }}

    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v2

    - name: Build, tag, and push image to Amazon ECR
      id: build-image
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        IMAGE_TAG: ${{ github.sha }}
      run: |
        cd backend
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
        docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest
        echo "image=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG" >> $GITHUB_OUTPUT

    - name: Get RDS endpoint
      id: get-rds-endpoint
      run: |
        DB_ENDPOINT=$(aws cloudformation describe-stacks \
          --stack-name pipeline-pulse-rds \
          --query "Stacks[0].Outputs[?OutputKey=='DatabaseEndpoint'].OutputValue" \
          --output text)
        echo "db-endpoint=$DB_ENDPOINT" >> $GITHUB_OUTPUT

    - name: Deploy ECS
      env:
        IMAGE_URI: ${{ steps.build-image.outputs.image }}
        DB_ENDPOINT: ${{ steps.get-rds-endpoint.outputs.db-endpoint }}
      run: |
        aws cloudformation deploy \
          --template-file infrastructure/cloudformation/ecs.yml \
          --stack-name pipeline-pulse-ecs \
          --parameter-overrides \
            StackName=pipeline-pulse-infrastructure \
            DomainName=${{ env.DOMAIN_NAME }} \
            CertificateArn=${{ secrets.CERTIFICATE_ARN }} \
            ECRImageURI=$IMAGE_URI \
            DBEndpoint=$DB_ENDPOINT \
          --capabilities CAPABILITY_IAM \
          --no-fail-on-empty-changeset

    - name: Update database connection secret
      run: |
        aws secretsmanager update-secret \
          --secret-id pipeline-pulse/database-url \
          --secret-string "postgresql://postgres:${{ secrets.DB_PASSWORD }}@${{ steps.get-rds-endpoint.outputs.db-endpoint }}:5432/pipeline_pulse"

    - name: Update ECS service
      run: |
        aws ecs update-service \
          --cluster pipeline-pulse-cluster \
          --service pipeline-pulse-api-service \
          --force-new-deployment

  build-and-deploy-frontend:
    needs: [deploy-infrastructure, build-and-deploy-backend]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: frontend/package-lock.json

    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${{ env.AWS_REGION }}

    - name: Build React app
      env:
        VITE_API_URL: https://api.${{ env.DOMAIN_NAME }}
        VITE_ENVIRONMENT: production
        VITE_APP_NAME: Pipeline Pulse
        VITE_COMPANY_NAME: 1CloudHub
      run: |
        cd frontend
        npm ci
        npm run build

    - name: Deploy to S3
      run: |
        cd frontend
        aws s3 sync dist/ s3://${{ env.DOMAIN_NAME }}-frontend --delete

    - name: Invalidate CloudFront
      run: |
        DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
          --stack-name pipeline-pulse-infrastructure \
          --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" \
          --output text)
        aws cloudfront create-invalidation \
          --distribution-id $DISTRIBUTION_ID \
          --paths "/*"
```

## 📋 **Step 7: Pre-Deployment Setup**

### **1. SSL Certificate Setup**
```bash
# Request SSL certificate (must be done in us-east-1 for CloudFront)
aws acm request-certificate \
  --domain-name 1chsalesreports.com \
  --subject-alternative-names "*.1chsalesreports.com" \
  --validation-method DNS \
  --region us-east-1

# Get certificate ARN after DNS validation
aws acm list-certificates \
  --certificate-statuses ISSUED \
  --region us-east-1 \
  --query "CertificateSummaryList[?DomainName=='1chsalesreports.com'].CertificateArn" \
  --output text
```

### **2. Create ECR Repository**
```bash
aws ecr create-repository \
  --repository-name pipeline-pulse \
  --region us-east-1
```

### **3. Set GitHub Repository Secrets**
Navigate to https://github.com/jrkphani/pipeline_pulse/settings/secrets/actions and add:

- `AWS_ACCESS_KEY_ID`: Your AWS access key
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret key
- `CERTIFICATE_ARN`: SSL certificate ARN from step 1
- `DB_PASSWORD`: Choose a secure database password (12+ characters)

## 🔧 **Step 8: Manual Deployment Commands**

### **Initial Infrastructure Deployment**
```bash
cd /Users/jrkphani/Projects/pipeline-pulse

# 1. Deploy main infrastructure
aws cloudformation deploy \
  --template-file infrastructure/cloudformation/main.yml \
  --stack-name pipeline-pulse-infrastructure \
  --parameter-overrides \
    DomainName=1chsalesreports.com \
    CertificateArn=arn:aws:acm:us-east-1:ACCOUNT:certificate/CERT-ID \
  --capabilities CAPABILITY_IAM \
  --region us-east-1

# 2. Deploy RDS
aws cloudformation deploy \
  --template-file infrastructure/cloudformation/rds.yml \
  --stack-name pipeline-pulse-rds \
  --parameter-overrides \
    StackName=pipeline-pulse-infrastructure \
    DBUsername=postgres \
    DBPassword=YourSecurePassword123! \
  --capabilities CAPABILITY_IAM \
  --region us-east-1

# 3. Build and push Docker image
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ACCOUNT.dkr.ecr.us-east-1.amazonaws.com

cd backend
docker build -t pipeline-pulse .
docker tag pipeline-pulse:latest ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/pipeline-pulse:latest
docker push ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/pipeline-pulse:latest

# 4. Get RDS endpoint
DB_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name pipeline-pulse-rds \
  --query "Stacks[0].Outputs[?OutputKey=='DatabaseEndpoint'].OutputValue" \
  --output text)

# 5. Deploy ECS
aws cloudformation deploy \
  --template-file infrastructure/cloudformation/ecs.yml \
  --stack-name pipeline-pulse-ecs \
  --parameter-overrides \
    StackName=pipeline-pulse-infrastructure \
    DomainName=1chsalesreports.com \
    CertificateArn=arn:aws:acm:us-east-1:ACCOUNT:certificate/CERT-ID \
    ECRImageURI=ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/pipeline-pulse:latest \
    DBEndpoint=$DB_ENDPOINT \
  --capabilities CAPABILITY_IAM \
  --region us-east-1

# 6. Update secrets with actual values
aws secretsmanager update-secret \
  --secret-id pipeline-pulse/database-url \
  --secret-string "postgresql://postgres:YourSecurePassword123!@${DB_ENDPOINT}:5432/pipeline_pulse" \
  --region us-east-1

# 7. Build and deploy frontend
cd ../frontend
npm ci
npm run build

aws s3 sync dist/ s3://1chsalesreports.com-frontend --delete

# 8. Invalidate CloudFront
DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
  --stack-name pipeline-pulse-infrastructure \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" \
  --output text)
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"
```

## 🔧 **Step 9: Post-Deployment Configuration**

### **1. Update Zoho Credentials**
```bash
# Update Zoho Client ID
aws secretsmanager update-secret \
  --secret-id pipeline-pulse/zoho-client-id \
  --secret-string "your_actual_zoho_client_id" \
  --region us-east-1

# Update Zoho Client Secret
aws secretsmanager update-secret \
  --secret-id pipeline-pulse/zoho-client-secret \
  --secret-string "your_actual_zoho_client_secret" \
  --region us-east-1
```

### **2. Initialize Database**
```bash
# Connect to ECS task and run database migrations
aws ecs execute-command \
  --cluster pipeline-pulse-cluster \
  --task $(aws ecs list-tasks --cluster pipeline-pulse-cluster --service-name pipeline-pulse-api-service --query 'taskArns[0]' --output text) \
  --container pipeline-pulse-api \
  --interactive \
  --command "/bin/bash"

# Inside the container, run:
# alembic upgrade head
```

## 💰 **Expected Monthly Costs**

```yaml
Production Environment:
  ECS Fargate (1 task):       $15-25
  RDS t4g.micro:              $13-16  
  S3 + CloudFront:            $5-15
  ALB:                        $16
  NAT Gateway:                $32
  Route 53:                   $0.50
  Secrets Manager:            $2
  CloudWatch Logs:            $3-8
  ────────────────────────────
  Total: $86-114/month

Development costs: Same setup
GitHub Actions: Free (2000 minutes/month)
```

## ✅ **Verification Steps**

1. **Frontend**: Visit https://1chsalesreports.com
2. **API Health**: Test https://api.1chsalesreports.com/health  
3. **SSL Certificate**: Verify HTTPS works on both domains
4. **Database**: Check RDS connectivity from ECS
5. **CI/CD**: Push a small change to main branch and verify auto-deployment

This setup is specifically tailored for your existing codebase structure and will provide a production-ready deployment with automated CI/CD!
