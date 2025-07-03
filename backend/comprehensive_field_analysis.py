#!/usr/bin/env python3
"""
Comprehensive Field Analysis for Zoho CRM
Analyzes ALL fields returned by the API to find O2R custom fields
"""

import asyncio
import json
from datetime import datetime
from app.services.async_zoho_wrapper import AsyncZohoWrapper

async def get_all_available_fields():
    """Get ALL fields available in Zoho CRM Deals module"""
    print("🔍 Analyzing ALL fields available in Zoho CRM...")
    
    async with AsyncZohoWrapper() as wrapper:
        # Method 1: Get fields metadata from Zoho
        print("\n📋 Method 1: Getting fields metadata...")
        try:
            fields_result = await wrapper.get_fields("Deals")
            if fields_result.get("status") == "success":
                fields_data = fields_result.get("data", [])
                print(f"✅ Found {len(fields_data)} field definitions")
                
                # Analyze field types and patterns
                custom_fields = []
                standard_fields = []
                
                for field in fields_data:
                    field_name = field.get("api_name", "")
                    field_type = field.get("data_type", "")
                    is_custom = field.get("custom_field", False)
                    display_label = field.get("field_label", "")
                    
                    field_info = {
                        "api_name": field_name,
                        "display_label": display_label,
                        "data_type": field_type,
                        "is_custom": is_custom
                    }
                    
                    if is_custom:
                        custom_fields.append(field_info)
                    else:
                        standard_fields.append(field_info)
                
                print(f"\n📊 Field Analysis:")
                print(f"   Standard Fields: {len(standard_fields)}")
                print(f"   Custom Fields: {len(custom_fields)}")
                
                # Look for O2R-related custom fields
                o2r_keywords = [
                    "territory", "service", "line", "strategic", "account", "aws", "funded",
                    "alliance", "motion", "proposal", "date", "sow", "po", "kickoff",
                    "invoice", "payment", "revenue", "milestone", "phase", "opportunity"
                ]
                
                print(f"\n🎯 O2R-Related Custom Fields:")
                potential_o2r_fields = []
                
                for field in custom_fields:
                    api_name = field["api_name"].lower()
                    display_label = field["display_label"].lower()
                    
                    # Check if field name or label contains O2R keywords
                    for keyword in o2r_keywords:
                        if keyword in api_name or keyword in display_label:
                            potential_o2r_fields.append(field)
                            print(f"   ✅ {field['api_name']} ({field['display_label']})")
                            break
                
                if not potential_o2r_fields:
                    print("   ❌ No obvious O2R-related custom fields found")
                
                # Save all custom fields for manual review
                with open("/Users/jrkphani/Projects/pipeline-pulse/backend/all_custom_fields.json", "w") as f:
                    json.dump({
                        "analysis_time": datetime.now().isoformat(),
                        "total_custom_fields": len(custom_fields),
                        "custom_fields": custom_fields,
                        "potential_o2r_fields": potential_o2r_fields
                    }, f, indent=2)
                
                print(f"\n💾 Saved {len(custom_fields)} custom fields to all_custom_fields.json")
                
        except Exception as e:
            print(f"❌ Error getting fields metadata: {e}")
        
        # Method 2: Get a sample deal with ALL possible fields
        print("\n📋 Method 2: Fetching sample deal with maximum fields...")
        try:
            # Get first 50 fields from actual deal data
            result = await wrapper.get_records(
                module_name="Deals",
                page=1,
                per_page=1,
                fields=None  # This should return all available fields
            )
            
            if result.get("status") == "success":
                deals = result.get("data", [])
                if deals:
                    sample_deal = deals[0]
                    all_fields_in_deal = list(sample_deal.keys())
                    
                    print(f"✅ Sample deal contains {len(all_fields_in_deal)} fields")
                    
                    # Find custom fields in the actual data
                    custom_field_patterns = ["__c", "_custom", "_Custom"]
                    date_patterns = ["_date", "_Date", "date", "Date"]
                    
                    print(f"\n🔍 Fields in sample deal:")
                    custom_fields_found = []
                    date_fields_found = []
                    
                    for field_name in sorted(all_fields_in_deal):
                        # Check for custom field patterns
                        is_custom_pattern = any(pattern in field_name for pattern in custom_field_patterns)
                        is_date_pattern = any(pattern in field_name for pattern in date_patterns)
                        
                        if is_custom_pattern:
                            custom_fields_found.append(field_name)
                        if is_date_pattern:
                            date_fields_found.append(field_name)
                        
                        # Show all fields for manual review
                        value = sample_deal.get(field_name)
                        if value is not None:
                            value_str = str(value)[:50] + "..." if len(str(value)) > 50 else str(value)
                            print(f"   {field_name}: {value_str}")
                    
                    print(f"\n📋 Custom Pattern Fields: {custom_fields_found}")
                    print(f"📅 Date Pattern Fields: {date_fields_found}")
                    
                    # Save full deal structure for analysis
                    with open("/Users/jrkphani/Projects/pipeline-pulse/backend/sample_deal_structure.json", "w") as f:
                        json.dump({
                            "analysis_time": datetime.now().isoformat(),
                            "total_fields": len(all_fields_in_deal),
                            "all_fields": all_fields_in_deal,
                            "custom_pattern_fields": custom_fields_found,
                            "date_pattern_fields": date_fields_found,
                            "sample_deal": sample_deal
                        }, f, indent=2)
                    
                    print(f"\n💾 Saved complete deal structure to sample_deal_structure.json")
                
        except Exception as e:
            print(f"❌ Error getting sample deal: {e}")

async def compare_with_o2r_requirements():
    """Compare found fields with O2R requirements"""
    print("\n🎯 Comparing with O2R Requirements...")
    
    # O2R fields we need to find
    required_o2r_fields = {
        "territory": "Territory/Region information",
        "service_line": "Service Line/Solution Type",
        "strategic_account": "Strategic Account flag",
        "aws_funded": "AWS Funded opportunity flag", 
        "alliance_motion": "Alliance Motion type",
        "proposal_date": "Proposal submission date",
        "sow_date": "Statement of Work date",
        "po_date": "Purchase Order date",
        "kickoff_date": "Project kickoff date",
        "invoice_date": "Invoice date",
        "payment_date": "Payment received date",
        "revenue_date": "Revenue recognition date"
    }
    
    # Fields we already found
    found_mappings = {
        "territory": "Region",
        "service_line": "Solution_Type", 
        "invoice_date": "Invoice_Date"
    }
    
    print(f"✅ Found {len(found_mappings)} out of {len(required_o2r_fields)} O2R fields:")
    for o2r_field, zoho_field in found_mappings.items():
        print(f"   {o2r_field} → {zoho_field}")
    
    missing_fields = set(required_o2r_fields.keys()) - set(found_mappings.keys())
    print(f"\n❌ Still missing {len(missing_fields)} O2R fields:")
    for field in sorted(missing_fields):
        print(f"   {field}: {required_o2r_fields[field]}")
    
    print(f"\n💡 Next steps:")
    print(f"   1. Review all_custom_fields.json for manual field mapping")
    print(f"   2. Check sample_deal_structure.json for field patterns")
    print(f"   3. Verify field names in Zoho CRM admin interface")

async def main():
    """Run comprehensive field analysis"""
    print("🚀 Starting Comprehensive Field Analysis for O2R Custom Fields")
    print("=" * 70)
    
    try:
        await get_all_available_fields()
        await compare_with_o2r_requirements()
        
        print("\n" + "=" * 70)
        print("✅ Comprehensive analysis completed!")
        print("📁 Check the generated JSON files for detailed field information")
        
    except Exception as e:
        print(f"❌ Analysis failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())