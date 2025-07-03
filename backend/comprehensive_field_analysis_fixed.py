#!/usr/bin/env python3
"""
Comprehensive Field Analysis for Zoho CRM - Fixed Version
Analyzes ALL fields returned by the API to find O2R custom fields
"""

import asyncio
import json
import sys
import os
from datetime import datetime

# Add the backend directory to the Python path
sys.path.append('/Users/jrkphani/Projects/pipeline-pulse/backend')

from app.services.zoho_sdk_manager import get_sdk_manager
from app.services.async_zoho_wrapper import AsyncZohoWrapper

async def initialize_and_analyze():
    """Initialize SDK and run comprehensive field analysis"""
    print("🚀 Starting Comprehensive Field Analysis for O2R Custom Fields")
    print("=" * 70)
    
    try:
        # Initialize SDK first
        print("🔧 Initializing Zoho SDK...")
        sdk_manager = get_sdk_manager()
        
        if not sdk_manager.is_initialized():
            init_result = sdk_manager.initialize_sdk()
            if not init_result:
                print("❌ Failed to initialize SDK")
                return
        
        print("✅ SDK initialized successfully")
        
        # Now run the comprehensive analysis
        await run_comprehensive_analysis()
        
    except Exception as e:
        print(f"❌ Analysis failed: {e}")
        import traceback
        traceback.print_exc()

async def run_comprehensive_analysis():
    """Run the actual field analysis"""
    print("\n🔍 Analyzing ALL fields available in Zoho CRM...")
    
    async with AsyncZohoWrapper() as wrapper:
        # Method 1: Get sample deal with maximum field information
        print("\n📋 Method 1: Fetching sample deal with all available fields...")
        try:
            # Get without specifying fields to get all available
            result = await wrapper.get_records(
                module_name="Deals",
                page=1,
                per_page=1,
                fields=None  # Get all available fields
            )
            
            if result.get("status") == "success":
                deals = result.get("data", [])
                if deals:
                    sample_deal = deals[0]
                    all_fields_in_deal = list(sample_deal.keys())
                    
                    print(f"✅ Sample deal contains {len(all_fields_in_deal)} fields")
                    
                    # Analyze field patterns
                    await analyze_field_patterns(sample_deal, all_fields_in_deal)
                    
                    # Save complete structure
                    await save_analysis_results(sample_deal, all_fields_in_deal)
                else:
                    print("❌ No deals found")
            else:
                print(f"❌ Error fetching deals: {result.get('message')}")
                
        except Exception as e:
            print(f"❌ Error in Method 1: {e}")
        
        # Method 2: Try getting with a comprehensive field list
        print("\n📋 Method 2: Testing comprehensive field list...")
        await test_comprehensive_field_list(wrapper)

async def analyze_field_patterns(sample_deal, all_fields):
    """Analyze patterns in the field names and values"""
    print(f"\n🔍 Analyzing field patterns...")
    
    # Categorize fields
    custom_fields = []
    date_fields = []
    business_fields = []
    system_fields = []
    
    # O2R related keywords
    o2r_keywords = [
        "territory", "region", "service", "line", "solution", "type",
        "strategic", "account", "aws", "funded", "alliance", "motion",
        "proposal", "sow", "po", "purchase", "order", "kickoff", "kick",
        "invoice", "payment", "revenue", "milestone", "phase"
    ]
    
    potential_o2r_fields = []
    
    for field_name in sorted(all_fields):
        field_value = sample_deal.get(field_name)
        field_lower = field_name.lower()
        
        # Check for custom field patterns
        if any(pattern in field_name for pattern in ["__c", "_custom", "_Custom"]):
            custom_fields.append(field_name)
        
        # Check for date patterns
        if any(pattern in field_lower for pattern in ["date", "time", "_at", "_on"]):
            date_fields.append(field_name)
        
        # Check for O2R related fields
        if any(keyword in field_lower for keyword in o2r_keywords):
            potential_o2r_fields.append({
                "field_name": field_name,
                "value": str(field_value)[:100] if field_value else None,
                "matched_keywords": [kw for kw in o2r_keywords if kw in field_lower]
            })
        
        # Check for business-related fields
        if any(term in field_lower for term in ["amount", "value", "revenue", "cost", "price", "deal", "opportunity"]):
            business_fields.append(field_name)
        
        # System fields
        if any(term in field_lower for term in ["id", "created", "modified", "owner", "system"]):
            system_fields.append(field_name)
    
    print(f"\n📊 Field Categories:")
    print(f"   Custom Fields: {len(custom_fields)}")
    print(f"   Date Fields: {len(date_fields)}")
    print(f"   Business Fields: {len(business_fields)}")
    print(f"   System Fields: {len(system_fields)}")
    print(f"   Potential O2R Fields: {len(potential_o2r_fields)}")
    
    if potential_o2r_fields:
        print(f"\n🎯 Potential O2R Fields Found:")
        for field_info in potential_o2r_fields:
            keywords = ", ".join(field_info["matched_keywords"])
            value_preview = field_info["value"] or "null"
            print(f"   ✅ {field_info['field_name']} (keywords: {keywords})")
            print(f"      Value: {value_preview}")
    
    # Show all field names for manual review
    print(f"\n📋 All {len(all_fields)} Fields (for manual review):")
    for i, field_name in enumerate(sorted(all_fields), 1):
        value = sample_deal.get(field_name)
        value_str = str(value)[:50] + "..." if value and len(str(value)) > 50 else str(value)
        print(f"   {i:2d}. {field_name}: {value_str}")

async def test_comprehensive_field_list(wrapper):
    """Test fetching with a comprehensive list of potential field names"""
    print("\n🧪 Testing comprehensive field name variations...")
    
    # Extended list of potential field names to test
    potential_fields = [
        # Standard variations
        "Territory", "Region", "Service_Line", "Solution_Type", "Strategic_Account",
        "AWS_Funded", "Alliance_Motion", "Proposal_Date", "SOW_Date", "PO_Date",
        "Kickoff_Date", "Invoice_Date", "Payment_Date", "Revenue_Date",
        
        # With __c suffix (Salesforce style)
        "Territory__c", "Region__c", "Service_Line__c", "Solution_Type__c", 
        "Strategic_Account__c", "AWS_Funded__c", "Alliance_Motion__c",
        "Proposal_Date__c", "SOW_Date__c", "PO_Date__c", "Kickoff_Date__c",
        "Invoice_Date__c", "Payment_Date__c", "Revenue_Date__c",
        
        # Alternative naming patterns
        "Sales_Territory", "Sales_Region", "Service_Type", "Solution_Category",
        "Strategic_Flag", "AWS_Flag", "Partner_Motion", "Proposal_Submit_Date",
        "Statement_of_Work_Date", "Purchase_Order_Date", "Project_Start_Date",
        "Billing_Date", "Payment_Received_Date", "Revenue_Recognition_Date",
        
        # Abbreviated versions
        "Terr", "Svc_Line", "Sol_Type", "Strat_Acct", "AWS_Fund", "All_Motion",
        "Prop_Date", "SOW_Dt", "PO_Dt", "KO_Date", "Inv_Date", "Pay_Date", "Rev_Date",
        
        # Space variations
        "Territory ", " Territory", "Service Line", "Solution Type", "Strategic Account",
        "AWS Funded", "Alliance Motion", "Proposal Date", "SOW Date", "PO Date",
        "Kickoff Date", "Invoice Date", "Payment Date", "Revenue Date"
    ]
    
    # Test in batches to respect 50-field limit
    batch_size = 45  # Leave room for essential fields
    essential_fields = ["id", "Deal_Name", "Amount", "Stage", "Owner"]
    
    found_fields = {}
    
    for i in range(0, len(potential_fields), batch_size):
        batch = potential_fields[i:i+batch_size]
        test_fields = essential_fields + batch
        
        print(f"\n🔄 Testing batch {i//batch_size + 1}: {len(batch)} fields...")
        
        try:
            result = await wrapper.get_records(
                module_name="Deals",
                page=1,
                per_page=1,
                fields=test_fields
            )
            
            if result.get("status") == "success":
                deals = result.get("data", [])
                if deals:
                    deal = deals[0]
                    for field in batch:
                        if field in deal and deal[field] is not None:
                            found_fields[field] = deal[field]
                            print(f"   ✅ Found: {field} = {deal[field]}")
            
        except Exception as e:
            print(f"   ❌ Batch error: {e}")
    
    print(f"\n🎯 Summary of Found Fields:")
    if found_fields:
        for field_name, value in found_fields.items():
            print(f"   ✅ {field_name}: {value}")
    else:
        print("   ❌ No additional fields found in comprehensive test")

async def save_analysis_results(sample_deal, all_fields):
    """Save analysis results to files"""
    print(f"\n💾 Saving analysis results...")
    
    # Prepare analysis data
    analysis_data = {
        "analysis_time": datetime.now().isoformat(),
        "total_fields_found": len(all_fields),
        "all_field_names": sorted(all_fields),
        "sample_deal_data": sample_deal,
        "o2r_mapping_status": {
            "required_fields": [
                "territory", "service_line", "strategic_account", "aws_funded",
                "alliance_motion", "proposal_date", "sow_date", "po_date",
                "kickoff_date", "invoice_date", "payment_date", "revenue_date"
            ],
            "found_mappings": {
                "territory": "Region",
                "service_line": "Solution_Type",
                "invoice_date": "Invoice_Date"
            },
            "still_missing": [
                "strategic_account", "aws_funded", "alliance_motion", "proposal_date",
                "sow_date", "po_date", "kickoff_date", "payment_date", "revenue_date"
            ]
        }
    }
    
    # Save to JSON file
    output_file = "/Users/jrkphani/Projects/pipeline-pulse/backend/comprehensive_field_analysis_results.json"
    with open(output_file, "w") as f:
        json.dump(analysis_data, f, indent=2, default=str)
    
    print(f"✅ Analysis results saved to: {output_file}")

async def compare_with_requirements():
    """Final comparison with O2R requirements"""
    print("\n🎯 Final O2R Requirements Analysis")
    print("-" * 50)
    
    found_mappings = {
        "territory": "Region",
        "service_line": "Solution_Type", 
        "invoice_date": "Invoice_Date"
    }
    
    required_fields = [
        "territory", "service_line", "strategic_account", "aws_funded",
        "alliance_motion", "proposal_date", "sow_date", "po_date",
        "kickoff_date", "invoice_date", "payment_date", "revenue_date"
    ]
    
    print(f"✅ Found {len(found_mappings)} out of {len(required_fields)} O2R fields:")
    for o2r_field, zoho_field in found_mappings.items():
        print(f"   {o2r_field} → {zoho_field}")
    
    missing_fields = [f for f in required_fields if f not in found_mappings]
    print(f"\n❌ Still missing {len(missing_fields)} O2R fields:")
    for field in missing_fields:
        print(f"   {field}")
    
    print(f"\n💡 Recommendations:")
    print(f"   1. Review comprehensive_field_analysis_results.json")
    print(f"   2. Check Zoho CRM admin panel for custom field API names")
    print(f"   3. Verify these fields exist and are accessible via API")
    print(f"   4. Consider asking user to provide exact API names from Zoho")

async def main():
    """Main function to run the comprehensive analysis"""
    await initialize_and_analyze()
    await compare_with_requirements()
    
    print("\n" + "=" * 70)
    print("✅ Comprehensive Field Analysis Complete!")
    print("📁 Check comprehensive_field_analysis_results.json for full details")

if __name__ == "__main__":
    asyncio.run(main())