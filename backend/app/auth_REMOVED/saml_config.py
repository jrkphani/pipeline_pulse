"""
SAML Configuration for Pipeline Pulse
Handles SAML SSO integration with Zoho Directory
"""

import os
from typing import Dict, Any
from urllib.parse import urljoin

def get_saml_settings() -> Dict[str, Any]:
    """
    Generate SAML settings configuration for pysaml2
    """
    
    # Get base URL from environment
    base_url = os.getenv("BASE_URL", "https://localhost:8000")
    
    # Zoho SAML URLs from metadata
    zoho_entity_id = os.getenv(
        "ZOHO_SAML_ENTITY_ID",
        "https://directory.zoho.in/p/60021093475/app/128434000000235001/sso"
    )
    zoho_sso_url = os.getenv(
        "ZOHO_SAML_SSO_URL",
        "https://directory.zoho.in/p/60021093475/app/128434000000235001/sso"
    )
    zoho_sls_url = os.getenv(
        "ZOHO_SAML_SLS_URL",
        "https://directory.zoho.in/p/60021093475/app/128434000000235001/sso/logout"
    )
    zoho_x509_cert = os.getenv("ZOHO_SAML_X509_CERT", "")
    
    # Certificate paths (for production)
    private_key_path = os.getenv("SAML_PRIVATE_KEY_PATH", "/tmp/saml.key")
    certificate_path = os.getenv("SAML_CERTIFICATE_PATH", "/tmp/saml.crt")
    
    settings = {
        # Service Provider (Pipeline Pulse) configuration
        "sp": {
            "entityId": f"{base_url}/auth/saml/metadata",
            "assertionConsumerService": {
                "url": f"{base_url}/auth/saml/acs",
                "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
            },
            "singleLogoutService": {
                "url": f"{base_url}/auth/saml/logout",
                "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
            },
            "NameIDFormat": "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
            "x509cert": "",  # Will be loaded from file
            "privateKey": "",  # Will be loaded from file
        },
        
        # Identity Provider (Zoho) configuration
        "idp": {
            "entityId": zoho_entity_id,
            "singleSignOnService": {
                "url": zoho_sso_url,
                "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
            },
            "singleLogoutService": {
                "url": zoho_sls_url,
                "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
            },
            "x509cert": zoho_x509_cert.replace("\\n", "\n") if zoho_x509_cert else "",
        },
        
        # Security settings
        "security": {
            "nameIdEncrypted": False,
            "authnRequestsSigned": True,
            "logoutRequestSigned": True,
            "logoutResponseSigned": True,
            "signMetadata": True,
            "wantAssertionsSigned": True,
            "wantNameId": True,
            "wantAssertionsEncrypted": False,
            "wantNameIdEncrypted": False,
            "requestedAuthnContext": True,
            "requestedAuthnContextComparison": "exact",
            "wantXMLValidation": True,
            "relaxDestinationValidation": False,
            "destinationStrictlyMatches": True,
            "allowRepeatAttributeName": False,
            "rejectUnsolicitedResponsesWithInResponseTo": True,
            "signatureAlgorithm": "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256",
            "digestAlgorithm": "http://www.w3.org/2001/04/xmlenc#sha256",
        }
    }
    
    # Load certificates if they exist
    try:
        if os.path.exists(certificate_path):
            with open(certificate_path, 'r') as cert_file:
                settings["sp"]["x509cert"] = cert_file.read()
        
        if os.path.exists(private_key_path):
            with open(private_key_path, 'r') as key_file:
                settings["sp"]["privateKey"] = key_file.read()
    except Exception as e:
        print(f"Warning: Could not load SAML certificates: {e}")
    
    return settings


def get_attribute_mapping() -> Dict[str, str]:
    """
    Define attribute mapping from SAML response to user fields
    """
    return {
        "email": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
        "first_name": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname",
        "last_name": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname",
        "department": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/department",
        "role": "http://schemas.microsoft.com/ws/2008/06/identity/claims/role",
    }


def create_saml_certificates():
    """
    Create self-signed certificates for SAML (development only)
    """
    import subprocess
    import tempfile
    
    private_key_path = os.getenv("SAML_PRIVATE_KEY_PATH", "/tmp/saml.key")
    certificate_path = os.getenv("SAML_CERTIFICATE_PATH", "/tmp/saml.crt")
    
    if not os.path.exists(private_key_path) or not os.path.exists(certificate_path):
        try:
            # Generate private key and certificate
            subprocess.run([
                "openssl", "req", "-new", "-x509", "-days", "365", "-nodes",
                "-out", certificate_path, "-keyout", private_key_path,
                "-subj", "/C=US/ST=State/L=City/O=Organization/CN=pipeline-pulse"
            ], check=True)
            print(f"Created SAML certificates: {certificate_path}, {private_key_path}")
        except subprocess.CalledProcessError as e:
            print(f"Failed to create SAML certificates: {e}")
        except FileNotFoundError:
            print("OpenSSL not found. Please install OpenSSL or provide existing certificates.")


# Initialize certificates on import (for development)
if os.getenv("ENVIRONMENT", "development") == "development":
    create_saml_certificates()
