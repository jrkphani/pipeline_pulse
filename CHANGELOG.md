# Changelog

All notable changes to Pipeline Pulse will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2024-12-XX

### 🔐 MAJOR SECURITY ENHANCEMENT - AWS Secrets Manager Migration

#### Added
- **AWS Secrets Manager Integration**: Complete migration from environment variables to AWS Secrets Manager
- **Enterprise-Grade Security**: Secure storage and retrieval of all sensitive data
- **Automatic Database Migration**: Database tables created automatically on application startup
- **Dynamic Secret Retrieval**: Runtime secret fetching with intelligent caching
- **Zero Secret Exposure**: No hardcoded secrets in application code or environment
- **IAM-Based Access Control**: Fine-grained permissions for secret access
- **Comprehensive Audit Logging**: CloudTrail integration for secret access monitoring

#### Security Improvements
- **Database Credentials**: Moved to `pipeline-pulse/prod/database` secret
- **Zoho CRM API**: Moved to `pipeline-pulse/prod/zoho` secret  
- **Currency API**: Moved to `pipeline-pulse/prod/currency` secret
- **JWT Configuration**: Moved to `pipeline-pulse/prod/jwt` secret
- **Environment Detection**: Automatic production vs development configuration
- **Fallback Support**: Graceful degradation for local development

#### Infrastructure Updates
- **ECS Task Definition**: Updated with Secrets Manager permissions
- **IAM Roles**: Configured with appropriate secret access policies
- **Security Groups**: Fixed database connectivity issues
- **Application Load Balancer**: Maintained existing routing configuration
- **CloudFront**: Continued CDN optimization with cache invalidation

#### Documentation
- **README.md**: Updated with comprehensive security section
- **AWS_SECRETS_MANAGER_MIGRATION.md**: Detailed migration documentation
- **Environment Variables**: Updated production vs development configurations
- **Deployment Scripts**: Updated with Secrets Manager integration
- **Security Compliance**: Added SOC 2, PCI DSS, HIPAA, GDPR readiness

#### Technical Implementation
- **Settings Configuration**: Dynamic secret retrieval in `app/core/config.py`
- **Database Connection**: Secure connection string generation
- **Error Handling**: Comprehensive error handling for secret retrieval
- **Caching Strategy**: Efficient secret caching to minimize AWS API calls
- **Startup Process**: Automatic database migration on application startup

### Changed
- **Configuration Management**: Migrated from environment variables to AWS Secrets Manager
- **Application Startup**: Added database migration and secret validation
- **Deployment Process**: Updated scripts to support Secrets Manager
- **Security Architecture**: Enhanced from basic environment variables to enterprise-grade secret management

### Fixed
- **Database Connectivity**: Resolved security group and connection issues
- **Secret Management**: Eliminated hardcoded credentials and environment variable exposure
- **Application Startup**: Improved reliability with automatic database setup
- **Error Handling**: Enhanced error messages and logging for troubleshooting

### Removed
- **Hardcoded Secrets**: Eliminated all sensitive data from application code
- **Environment Variable Dependencies**: Reduced reliance on plain text environment variables
- **Manual Secret Rotation**: Replaced with AWS Secrets Manager automatic rotation capability

## [1.5.0] - 2024-11-XX

### Added
- **O2R Tracking**: Opportunity-to-Revenue tracking functionality
- **Bulk Update Operations**: Mass update capabilities for CRM opportunities
- **Account Manager Analytics**: Performance analysis by territory and country
- **Enhanced File Management**: Upload history and duplicate detection

### Changed
- **Database**: Migrated from SQLite to PostgreSQL for production
- **Authentication**: Enhanced Zoho Directory SAML integration
- **UI Components**: Updated to latest shadcn/ui components

## [1.0.0] - 2024-10-XX

### Added
- **Initial Release**: Core pipeline analysis functionality
- **Zoho CRM Integration**: Direct API connection for data sync
- **Currency Standardization**: SGD conversion using live exchange rates
- **Interactive Analytics**: Country drill-down and pivot tables
- **SAML SSO**: Zoho Directory authentication
- **AWS Deployment**: ECS Fargate with CloudFront CDN

---

## Migration Notes

### AWS Secrets Manager Migration (v2.0.0)
This major release represents a complete security overhaul of Pipeline Pulse. The migration to AWS Secrets Manager provides:

- **Enterprise Security**: Industry-standard secret management
- **Compliance Ready**: Meets SOC 2, PCI DSS, HIPAA, and GDPR requirements
- **Operational Excellence**: Centralized secret management with audit trails
- **Zero Downtime**: Seamless migration without service interruption

### Breaking Changes
- **Environment Variables**: Production deployment no longer uses plain text environment variables for sensitive data
- **Local Development**: Requires AWS credentials for secret access in production mode
- **Deployment Scripts**: Updated deployment process requires AWS Secrets Manager setup

### Upgrade Path
1. Set up AWS Secrets Manager secrets using provided scripts
2. Update IAM roles with appropriate permissions
3. Deploy updated application with new task definition
4. Verify secret retrieval and application functionality

For detailed migration instructions, see `docs/AWS_SECRETS_MANAGER_MIGRATION.md`.
