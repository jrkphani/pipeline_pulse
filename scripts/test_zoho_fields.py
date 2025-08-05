#!/usr/bin/env python3
"""
Quick test script to check Zoho field discovery.

This script tests the field discovery endpoints directly.
"""

import requests
import json

# Test with a specific module
def test_module_fields(module_name="Deals"):
    """Test field discovery for a specific module."""
    
    # You'll need to replace this with your actual session cookie
    # Get it from your browser after logging in
    session_cookie = input("Enter your session cookie: ").strip()
    
    headers = {
        "Cookie": f"session={session_cookie}"
    }
    
    url = f"http://localhost:8000/api/v1/zoho/fields/{module_name}"
    
    print(f"\nFetching fields for {module_name}...")
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        
        print(f"\n✅ Success! Found {data['summary']['total_fields']} fields")
        print(f"   - Custom fields: {data['summary']['custom_fields_count']}")
        print(f"   - Standard fields: {data['summary']['standard_fields_count']}")
        
        # Show some custom fields
        custom_fields = data.get('custom_fields', [])
        if custom_fields:
            print(f"\n🔧 Custom Fields in {module_name}:")
            for field in custom_fields[:5]:
                print(f"   - {field['field_label']} ({field['api_name']})")
                print(f"     Type: {field['data_type']}, Required: {field.get('mandatory', False)}")
        
        # Save full results
        with open(f"{module_name.lower()}_fields.json", 'w') as f:
            json.dump(data, f, indent=2)
        print(f"\n💾 Full results saved to: {module_name.lower()}_fields.json")
        
    else:
        print(f"❌ Failed with status {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    print("Zoho CRM Field Discovery Test")
    print("=============================")
    
    # Test Deals module by default
    test_module_fields("Deals")