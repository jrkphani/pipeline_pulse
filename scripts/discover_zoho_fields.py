#!/usr/bin/env python3
"""
Script to discover Zoho CRM fields using the Pipeline Pulse API.

Usage:
    python scripts/discover_zoho_fields.py

This script will:
1. Use your existing session cookie to authenticate
2. Fetch field metadata for all priority modules
3. Save the results to a JSON file for analysis
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
API_BASE_URL = "http://localhost:8000/api/v1"

def get_session_cookie():
    """Get session cookie from user input or environment."""
    print("Please provide your session cookie.")
    print("You can find this in your browser's developer tools after logging in.")
    print("Look for the 'session' cookie in the Application/Storage tab.")
    session_cookie = input("Session cookie value: ").strip()
    return session_cookie

def discover_fields(session_cookie):
    """Discover fields for all modules."""
    headers = {
        "Cookie": f"session={session_cookie}"
    }
    
    # First, let's verify the session is valid
    print("\nVerifying session...")
    me_response = requests.get(f"{API_BASE_URL}/auth/me", headers=headers)
    
    if me_response.status_code != 200:
        print(f"❌ Session is invalid or expired. Status: {me_response.status_code}")
        print(f"Response: {me_response.text}")
        return None
    
    user_data = me_response.json()
    print(f"✅ Authenticated as: {user_data.get('email', 'Unknown')}")
    
    # Now discover fields
    print("\n📊 Discovering fields for all modules...")
    fields_response = requests.get(f"{API_BASE_URL}/zoho/fields", headers=headers)
    
    if fields_response.status_code != 200:
        print(f"❌ Failed to discover fields. Status: {fields_response.status_code}")
        print(f"Response: {fields_response.text}")
        return None
    
    return fields_response.json()

def analyze_fields(discovery_data):
    """Analyze and display field discovery results."""
    if not discovery_data:
        return
    
    print("\n" + "="*80)
    print("FIELD DISCOVERY RESULTS")
    print("="*80)
    
    modules = discovery_data.get("modules", {})
    
    for module_name, module_data in modules.items():
        if "error" in module_data:
            print(f"\n❌ {module_name}: Error - {module_data['error']}")
            continue
        
        print(f"\n📋 MODULE: {module_name}")
        print(f"   Total Fields: {module_data.get('total_fields', 0)}")
        print(f"   Custom Fields: {module_data.get('custom_fields_count', 0)}")
        print(f"   Standard Fields: {module_data.get('standard_fields_count', 0)}")
        
        # Show custom fields
        custom_fields = module_data.get('custom_fields', [])
        if custom_fields:
            print(f"\n   🔧 Custom Fields ({len(custom_fields)}):")
            for field in custom_fields[:10]:  # Show first 10
                print(f"      - {field['field_label']} ({field['api_name']})")
                print(f"        Type: {field['data_type']}, Mandatory: {field.get('mandatory', False)}")
            if len(custom_fields) > 10:
                print(f"      ... and {len(custom_fields) - 10} more custom fields")
        
        # Show important standard fields
        important_fields = module_data.get('important_standard_fields', [])
        if important_fields:
            print(f"\n   ⭐ Important Standard Fields ({len(important_fields)}):")
            for field in important_fields:
                print(f"      - {field['field_label']} ({field['api_name']}) - Type: {field['data_type']}")

def save_results(discovery_data, filename=None):
    """Save discovery results to a JSON file."""
    if not discovery_data:
        return
    
    if not filename:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"zoho_field_discovery_{timestamp}.json"
    
    with open(filename, 'w') as f:
        json.dump(discovery_data, f, indent=2)
    
    print(f"\n💾 Results saved to: {filename}")
    return filename

def main():
    """Main function."""
    print("🔍 Zoho CRM Field Discovery Tool")
    print("================================")
    
    # Get session cookie
    session_cookie = get_session_cookie()
    
    if not session_cookie:
        print("❌ No session cookie provided. Exiting.")
        sys.exit(1)
    
    # Discover fields
    discovery_data = discover_fields(session_cookie)
    
    if discovery_data:
        # Analyze results
        analyze_fields(discovery_data)
        
        # Save results
        filename = save_results(discovery_data)
        
        # Summary
        summary = discovery_data.get("summary", {})
        print(f"\n📊 Summary:")
        print(f"   Modules Discovered: {summary.get('modules_discovered', 0)}")
        print(f"   Total Custom Fields: {summary.get('total_custom_fields', 0)}")
        print(f"   Discovery Time: {discovery_data.get('discovery_timestamp', 'Unknown')}")
        
        print("\n✅ Field discovery completed successfully!")
        print(f"   Review the full results in: {filename}")
    else:
        print("\n❌ Field discovery failed.")
        sys.exit(1)

if __name__ == "__main__":
    main()