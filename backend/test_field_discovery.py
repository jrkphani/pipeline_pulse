#!/usr/bin/env python3
"""
Direct test of field discovery using the Zoho CRM service.
"""

import asyncio
import os
import sys
import json
from datetime import datetime

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.zoho_crm_service import zoho_crm_service
from app.core.database import get_db
from sqlalchemy import select
from app.models.user import User

async def test_field_discovery():
    """Test field discovery directly."""
    
    # Get a user with Zoho tokens (using the temp OAuth user)
    async for db in get_db():
        try:
            # Find a user with Zoho connection
            query = select(User).where(User.email.like("%@%")).limit(1)
            result = await db.execute(query)
            user = result.scalar_one_or_none()
            
            if not user:
                print("❌ No users found in database")
                return
            
            print(f"🔍 Testing field discovery for user: {user.email}")
            
            # Define modules to test
            modules = ["Deals", "Accounts", "Contacts", "Leads"]
            discovery_results = {}
            
            for module_name in modules:
                print(f"\n📋 Discovering fields for {module_name}...")
                
                try:
                    # Get fields for the module
                    fields_data = await zoho_crm_service.get_module_fields_for_user(
                        user_email=user.email,
                        module_name=module_name
                    )
                    
                    if fields_data and "fields" in fields_data:
                        all_fields = fields_data.get("fields", [])
                        
                        # Separate custom and standard fields
                        custom_fields = []
                        standard_fields = []
                        important_fields = {
                            "Deals": ["Deal_Name", "Amount", "Stage", "Closing_Date", "Account_Name", "Currency"],
                            "Accounts": ["Account_Name", "Account_Type", "Industry", "Annual_Revenue"],
                            "Contacts": ["First_Name", "Last_Name", "Email", "Phone", "Account_Name"],
                            "Leads": ["First_Name", "Last_Name", "Company", "Email", "Lead_Status"]
                        }
                        
                        for field in all_fields:
                            field_info = {
                                "api_name": field.get("api_name"),
                                "field_label": field.get("field_label"),
                                "data_type": field.get("data_type"),
                                "custom_field": field.get("custom_field", False),
                                "mandatory": field.get("mandatory", False),
                                "read_only": field.get("read_only", False)
                            }
                            
                            if field.get("custom_field", False):
                                custom_fields.append(field_info)
                            else:
                                standard_fields.append(field_info)
                        
                        # Store results
                        discovery_results[module_name] = {
                            "total_fields": len(all_fields),
                            "custom_fields_count": len(custom_fields),
                            "standard_fields_count": len(standard_fields),
                            "custom_fields": custom_fields,
                            "standard_fields": standard_fields
                        }
                        
                        print(f"   ✅ Found {len(all_fields)} total fields")
                        print(f"   📊 Custom fields: {len(custom_fields)}")
                        print(f"   📊 Standard fields: {len(standard_fields)}")
                        
                        # Display custom fields
                        if custom_fields:
                            print(f"\n   🔧 Custom Fields:")
                            for cf in custom_fields[:5]:  # Show first 5
                                print(f"      - {cf['field_label']} ({cf['api_name']}) - Type: {cf['data_type']}")
                            if len(custom_fields) > 5:
                                print(f"      ... and {len(custom_fields) - 5} more")
                        
                        # Display important standard fields
                        print(f"\n   ⭐ Key Standard Fields:")
                        important_for_module = important_fields.get(module_name, [])
                        for sf in standard_fields:
                            if sf['api_name'] in important_for_module:
                                print(f"      - {sf['field_label']} ({sf['api_name']}) - Type: {sf['data_type']}")
                    
                    else:
                        print(f"   ❌ No fields data returned")
                        discovery_results[module_name] = {"error": "No fields data"}
                        
                except Exception as e:
                    print(f"   ❌ Error: {str(e)}")
                    discovery_results[module_name] = {"error": str(e)}
            
            # Save results
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"zoho_field_discovery_{timestamp}.json"
            
            with open(filename, 'w') as f:
                json.dump(discovery_results, f, indent=2)
            
            print(f"\n💾 Full results saved to: {filename}")
            
            # Summary
            total_custom = sum(
                r.get("custom_fields_count", 0) 
                for r in discovery_results.values() 
                if "error" not in r
            )
            
            print(f"\n📊 Summary:")
            print(f"   Modules discovered: {len(discovery_results)}")
            print(f"   Total custom fields: {total_custom}")
            
        finally:
            break

if __name__ == "__main__":
    asyncio.run(test_field_discovery())