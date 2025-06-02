"""
Basic attribute mapping for SAML authentication
Maps SAML attributes to Pipeline Pulse user fields
"""

# Attribute mapping from SAML response to user model
MAP = {
    "identifier": "urn:oasis:names:tc:SAML:2.0:attrname-format:basic",
    "fro": {
        # Email address
        "email": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
        "emailaddress": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
        
        # Name fields
        "first_name": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname",
        "givenname": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname",
        "last_name": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname",
        "surname": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname",
        
        # Organization fields
        "department": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/department",
        "role": "http://schemas.microsoft.com/ws/2008/06/identity/claims/role",
        
        # Additional Zoho fields
        "displayname": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name",
        "name": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name",
    },
    "to": {
        # Reverse mapping for generating SAML requests
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress": "email",
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname": "first_name",
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname": "last_name",
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/department": "department",
        "http://schemas.microsoft.com/ws/2008/06/identity/claims/role": "role",
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name": "displayname",
    }
}
