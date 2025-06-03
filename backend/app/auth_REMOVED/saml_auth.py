"""
SAML SSO Authentication for Pipeline Pulse
"""

import os
import xml.etree.ElementTree as ET
from typing import Dict, Optional, Any
from datetime import datetime, timedelta
import jwt as pyjwt
import logging
from fastapi import HTTPException, Request
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class SAMLConfig:
    """SAML Configuration for Zoho Directory integration"""
    
    def __init__(self):
        # Zoho Directory SAML settings
        self.entity_id = os.getenv("SAML_ENTITY_ID", "http://localhost:5173")
        self.acs_url = os.getenv("SAML_ACS_URL", "http://localhost:5173/auth/saml/acs")
        self.sls_url = os.getenv("SAML_SLS_URL", "http://localhost:5173/auth/saml/logout")
        
        # Zoho Directory IdP settings (you'll get these after creating the app)
        self.idp_entity_id = os.getenv("ZOHO_SAML_ENTITY_ID", "")
        self.idp_sso_url = os.getenv("ZOHO_SAML_SSO_URL", "")
        self.idp_sls_url = os.getenv("ZOHO_SAML_SLS_URL", "")
        self.idp_x509_cert = os.getenv("ZOHO_SAML_X509_CERT", "")
        
        # JWT settings for session management
        self.jwt_secret = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
        self.jwt_algorithm = "HS256"
        self.jwt_expiration_hours = 24


class SAMLUser(BaseModel):
    """SAML User model"""
    email: str
    first_name: Optional[str] = ""
    last_name: Optional[str] = ""
    display_name: Optional[str] = ""
    department: Optional[str] = None
    job_title: Optional[str] = None
    employee_id: Optional[str] = None
    zoho_user_id: Optional[str] = None
    roles: list = []


class SAMLAuthService:
    """SAML Authentication Service"""
    
    def __init__(self):
        self.config = SAMLConfig()
    
    def generate_saml_request(self, relay_state: Optional[str] = None) -> Dict[str, str]:
        """
        Generate SAML Authentication Request
        """
        try:
            # Create SAML AuthnRequest XML
            authn_request = f"""<?xml version="1.0" encoding="UTF-8"?>
<samlp:AuthnRequest 
    xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
    xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
    ID="_{self._generate_request_id()}"
    Version="2.0"
    IssueInstant="{datetime.utcnow().isoformat()}Z"
    Destination="{self.config.idp_sso_url}"
    AssertionConsumerServiceURL="{self.config.acs_url}"
    ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST">
    <saml:Issuer>{self.config.entity_id}</saml:Issuer>
    <samlp:NameIDPolicy 
        Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"
        AllowCreate="true"/>
</samlp:AuthnRequest>"""
            
            # Base64 encode the request
            import base64
            encoded_request = base64.b64encode(authn_request.encode()).decode()
            
            return {
                "sso_url": self.config.idp_sso_url,
                "saml_request": encoded_request,
                "relay_state": relay_state or "/dashboard"
            }
            
        except Exception as e:
            logger.error(f"Error generating SAML request: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to generate SAML request")
    
    def process_saml_response(self, saml_response: str, relay_state: Optional[str] = None) -> Dict[str, Any]:
        """
        Process SAML Response from Zoho Directory
        """
        try:
            # Decode base64 SAML response
            import base64
            decoded_response = base64.b64decode(saml_response).decode()
            
            # Parse XML
            root = ET.fromstring(decoded_response)
            
            # Extract user information from SAML assertion
            user_data = self._extract_user_from_saml(root)
            
            # Generate JWT token for session
            token = self._generate_jwt_token(user_data)
            
            return {
                "success": True,
                "user": user_data.model_dump(),
                "token": token,
                "redirect_url": relay_state or "/dashboard"
            }
            
        except Exception as e:
            logger.error(f"Error processing SAML response: {str(e)}")
            raise HTTPException(status_code=400, detail="Invalid SAML response")
    
    def _extract_user_from_saml(self, saml_root: ET.Element) -> SAMLUser:
        """
        Extract user information from SAML assertion
        """
        try:
            # Define namespaces
            namespaces = {
                'saml': 'urn:oasis:names:tc:SAML:2.0:assertion',
                'samlp': 'urn:oasis:names:tc:SAML:2.0:protocol'
            }
            
            # Find assertion
            assertion = saml_root.find('.//saml:Assertion', namespaces)
            if assertion is None:
                raise ValueError("No assertion found in SAML response")
            
            # Extract NameID (email)
            name_id = assertion.find('.//saml:NameID', namespaces)
            email = name_id.text if name_id is not None else ""
            
            # Extract attributes
            attributes = {}
            attr_statements = assertion.findall('.//saml:AttributeStatement/saml:Attribute', namespaces)
            
            for attr in attr_statements:
                attr_name = attr.get('Name', '')
                attr_value = attr.find('saml:AttributeValue', namespaces)
                if attr_value is not None:
                    attributes[attr_name] = attr_value.text
            
            # Map attributes to user model (using correct Zoho Directory attribute names)
            first_name = attributes.get('first_name', attributes.get('firstName', '')) or ''
            last_name = attributes.get('last_name', attributes.get('lastName', '')) or ''
            department = attributes.get('department', '') or ''
            job_title = attributes.get('job_title', '') or ''
            employee_id = attributes.get('employee_id', '') or ''

            # Generate display name with fallback logic
            if first_name and last_name:
                display_name = f"{first_name} {last_name}".strip()
            elif first_name:
                display_name = first_name
            elif last_name:
                display_name = last_name
            else:
                display_name = email.split('@')[0] if email else 'User'

            # Override with explicit display_name if provided
            display_name = attributes.get('display_name', attributes.get('displayName', display_name))

            # Determine roles based on job title and department
            roles = self._determine_user_roles(job_title, department, employee_id)

            user = SAMLUser(
                email=email or attributes.get('email', ''),
                first_name=first_name,
                last_name=last_name,
                display_name=display_name,
                department=department,
                job_title=job_title,
                employee_id=employee_id,
                zoho_user_id=attributes.get('zohoUserId', ''),
                roles=roles
            )
            
            return user
            
        except Exception as e:
            logger.error(f"Error extracting user from SAML: {str(e)}")
            raise ValueError("Failed to extract user information from SAML response")
    
    def _generate_jwt_token(self, user: SAMLUser) -> str:
        """
        Generate JWT token for authenticated user
        """
        payload = {
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "display_name": user.display_name,
            "zoho_user_id": user.zoho_user_id,
            "roles": user.roles,
            "exp": datetime.utcnow() + timedelta(hours=self.config.jwt_expiration_hours),
            "iat": datetime.utcnow(),
            "iss": "pipeline-pulse"
        }
        
        return pyjwt.encode(payload, self.config.jwt_secret, algorithm=self.config.jwt_algorithm)

    def _generate_jwt_token_from_payload(self, payload: Dict[str, Any]) -> str:
        """
        Generate JWT token from custom payload
        """
        return pyjwt.encode(payload, self.config.jwt_secret, algorithm=self.config.jwt_algorithm)
    
    def verify_jwt_token(self, token: str) -> Dict[str, Any]:
        """
        Verify and decode JWT token
        """
        try:
            payload = pyjwt.decode(token, self.config.jwt_secret, algorithms=[self.config.jwt_algorithm])
            return payload
        except pyjwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token has expired")
        except pyjwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid token")
    
    def _determine_user_roles(self, job_title: str, department: str, employee_id: str) -> list:
        """
        Determine user roles based on job title, department, and employee ID
        """
        roles = []

        # Convert to lowercase for comparison
        job_title_lower = job_title.lower() if job_title else ""
        department_lower = department.lower() if department else ""

        # Admin roles (customize based on your organization)
        admin_titles = ["ceo", "cto", "admin", "administrator", "director", "head"]
        admin_departments = ["it", "technology", "administration"]

        if any(title in job_title_lower for title in admin_titles):
            roles.append("admin")
        elif any(dept in department_lower for dept in admin_departments):
            roles.append("admin")

        # Manager roles
        manager_titles = ["manager", "lead", "supervisor", "head"]
        if any(title in job_title_lower for title in manager_titles):
            roles.append("manager")

        # Sales roles
        sales_titles = ["sales", "account", "business development", "bd"]
        sales_departments = ["sales", "business development"]

        if any(title in job_title_lower for title in sales_titles):
            roles.append("sales")
        elif any(dept in department_lower for dept in sales_departments):
            roles.append("sales")

        # Default role if no specific role found
        if not roles:
            roles.append("user")

        return roles

    def _generate_request_id(self) -> str:
        """
        Generate unique request ID for SAML
        """
        import uuid
        return str(uuid.uuid4())
    
    def generate_logout_request(self, user_email: str) -> Dict[str, str]:
        """
        Generate SAML Logout Request
        """
        try:
            logout_request = f"""<?xml version="1.0" encoding="UTF-8"?>
<samlp:LogoutRequest 
    xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
    xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
    ID="_{self._generate_request_id()}"
    Version="2.0"
    IssueInstant="{datetime.utcnow().isoformat()}Z"
    Destination="{self.config.idp_sls_url}">
    <saml:Issuer>{self.config.entity_id}</saml:Issuer>
    <saml:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress">{user_email}</saml:NameID>
</samlp:LogoutRequest>"""
            
            import base64
            encoded_request = base64.b64encode(logout_request.encode()).decode()
            
            return {
                "sls_url": self.config.idp_sls_url,
                "saml_request": encoded_request
            }
            
        except Exception as e:
            logger.error(f"Error generating logout request: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to generate logout request")


# Global instance
saml_auth_service = SAMLAuthService()
