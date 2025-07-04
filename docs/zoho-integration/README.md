# Zoho Integration Guide

## 📋 Overview

Pipeline Pulse integrates with Zoho services to provide comprehensive business intelligence and authentication:

- **🔐 Authentication**: Zoho Directory SAML SSO for secure user access
- **📊 CRM Data**: Zoho CRM API v8 integration for opportunity tracking  
- **👥 User Management**: Role-based access control with Zoho Directory
- **🔄 Real-time Sync**: Live data synchronization between Zoho CRM and Pipeline Pulse

## 🏗️ Architecture

### Integration Flow
```
Users → Zoho Directory SAML → Pipeline Pulse Frontend
  ↓
Pipeline Pulse Backend → Zoho SDK v8 → Zoho CRM API
  ↓
AWS RDS Database (PostgreSQL)
```

### Key Components

| Component | Purpose | Location |
|-----------|---------|----------|
| **Zoho SDK Manager** | Centralized SDK initialization | `backend/app/services/zoho_sdk_manager.py` |
| **Async Zoho Wrapper** | Async bridge for SDK operations | `backend/app/services/async_zoho_wrapper.py` |
| **OAuth Manager** | Token management and refresh | `backend/app/api/endpoints/oauth.py` |
| **SAML Config** | Authentication configuration | `backend/app/auth/saml_config.py` |

## 🚀 Quick Start

### Prerequisites
- Zoho CRM organization with API access
- Zoho Directory admin access for SAML setup
- AWS infrastructure deployed
- Environment variables configured

### Basic Setup Steps
1. **[Configure SAML Authentication](#saml-setup)** for user login
2. **[Set up CRM API Access](#api-setup)** for data integration  
3. **[Configure Environment Variables](#environment-config)** for backend
4. **[Test Integration](#testing)** to verify functionality

## 📖 Detailed Guides

- **[Setup & Configuration](./setup.md)** - Complete setup instructions
- **[API Reference](./api-reference.md)** - Endpoints and usage examples
- **[Troubleshooting](./troubleshooting.md)** - Common issues and solutions
- **[Migration History](./migration-history.md)** - SDK version changes and upgrades

## 🔗 Quick Links

- [Production Frontend](https://1chsalesreports.com)
- [Production API](https://api.1chsalesreports.com)
- [Zoho CRM Developer Docs](https://www.zoho.com/crm/developer/docs/api/v8/)
- [Zoho Directory SAML Guide](https://help.zoho.com/portal/en/kb/directory/saml-single-sign-on)

---

## 🆘 Need Help?

- **Setup Issues**: Check [troubleshooting guide](./troubleshooting.md)
- **API Problems**: See [API reference](./api-reference.md)
- **Authentication**: Review [setup guide](./setup.md#saml-setup)

*This documentation consolidates information from multiple previous guides and provides a single source of truth for Zoho integration.*