#!/usr/bin/env python3
"""
Find TokenType enum.
"""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

try:
    # Try different possible import paths for TokenType
    token_type_imports = [
        "from zcrmsdk.src.com.zoho.api.authenticator.oauth_token import TokenType",
        "from zcrmsdk.src.com.zoho.api.authenticator.token_type import TokenType", 
        "from zcrmsdk.src.com.zoho.api.authenticator import TokenType",
        "from zcrmsdk.src.com.zoho.crm.api.authenticator.token_type import TokenType",
        "from zcrmsdk.src.com.zoho.crm.api.util.choice import Choice"
    ]
    
    for import_stmt in token_type_imports:
        try:
            print(f"Trying: {import_stmt}")
            exec(import_stmt)
            print(f"✅ Success: {import_stmt}")
            
            # If we successfully imported TokenType, inspect it
            if 'TokenType' in locals():
                token_type = locals()['TokenType']
                print(f"TokenType attributes: {dir(token_type)}")
                if hasattr(token_type, 'REFRESH'):
                    print(f"REFRESH value: {token_type.REFRESH}")
                break
        except ImportError as e:
            print(f"❌ Failed: {e}")
            
    # Let's also try to find what modules contain 'token' related stuff
    print("\n=== Searching SDK structure ===")
    import zcrmsdk
    import pkgutil
    
    def find_modules_with_token(package):
        for importer, modname, ispkg in pkgutil.walk_packages(package.__path__, package.__name__ + "."):
            if 'token' in modname.lower():
                print(f"Found token-related module: {modname}")
                
    find_modules_with_token(zcrmsdk)
                
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()