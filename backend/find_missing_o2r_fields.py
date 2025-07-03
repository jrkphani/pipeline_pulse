#!/usr/bin/env python3
"""
Find Missing O2R Fields using Zoho CRM Fields Metadata API
Uses the official Zoho API to get ALL field definitions and find custom fields
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

async def find_all_custom_fields():
    """Use Zoho Fields Metadata API to find ALL custom fields"""
    print("🔍 FINDING ALL CUSTOM FIELDS USING ZOHO FIELDS METADATA API")
    print("=" * 80)
    
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
        
        # Get field metadata using the official API
        print("\n📋 Fetching ALL field definitions from Zoho CRM...")
        
        async with AsyncZohoWrapper() as wrapper:
            result = await wrapper.get_fields_metadata("Deals")
            
            if result.get("status") == "success":
                fields_data = result.get("data", [])
                print(f"✅ Retrieved {len(fields_data)} field definitions from Zoho API")
                
                # Analyze and categorize fields
                await analyze_field_definitions(fields_data)
                
                # Save complete results
                await save_field_analysis(fields_data)
                
            else:
                print(f"❌ Error getting field metadata: {result.get('message')}")
                
    except Exception as e:
        print(f"❌ Analysis failed: {e}")
        import traceback
        traceback.print_exc()

async def analyze_field_definitions(fields_data):
    """Analyze field definitions to find custom fields and O2R matches"""
    print(f"\n🔍 ANALYZING {len(fields_data)} FIELD DEFINITIONS")
    print("-" * 60)
    
    # Categorize fields
    standard_fields = []
    custom_fields = []
    o2r_candidates = []
    
    # O2R keywords for matching
    o2r_keywords = {
        "territory": ["territory", "region", "area", "zone"],
        "service_line": ["service", "line", "solution", "type", "category", "offering"],
        "strategic_account": ["strategic", "account", "key", "important", "priority"],
        "aws_funded": ["aws", "funded", "funding", "amazon", "grant"],
        "alliance_motion": ["alliance", "motion", "partner", "channel", "referral"],
        "proposal_date": ["proposal", "date", "submit", "sent"],
        "sow_date": ["sow", "statement", "work", "contract", "agreement"],
        "po_date": ["po", "purchase", "order", "procurement"],
        "kickoff_date": ["kickoff", "kick", "off", "start", "begin", "launch"],
        "invoice_date": ["invoice", "billing", "bill", "charge"],
        "payment_date": ["payment", "paid", "received", "collected"],
        "revenue_date": ["revenue", "recognition", "realized", "earned"]
    }
    
    for field in fields_data:
        api_name = field.get("api_name", "").lower()
        display_label = field.get("display_label", "").lower()
        is_custom = field.get("custom_field", False)
        
        # Categorize field
        if is_custom:
            custom_fields.append(field)
        else:
            standard_fields.append(field)
        
        # Check for O2R matches
        for o2r_field, keywords in o2r_keywords.items():
            # Check if any keyword matches the field name or display label
            if any(keyword in api_name or keyword in display_label for keyword in keywords):
                o2r_candidates.append({
                    "o2r_field": o2r_field,
                    "field_info": field,
                    "matched_keywords": [kw for kw in keywords if kw in api_name or kw in display_label],
                    "match_score": len([kw for kw in keywords if kw in api_name or kw in display_label])
                })
    
    print(f"📊 FIELD CATEGORIES:")
    print(f"   Standard Fields: {len(standard_fields)}")
    print(f"   Custom Fields: {len(custom_fields)}")
    print(f"   O2R Candidates: {len(o2r_candidates)}")
    
    # Show all custom fields
    print(f"\n📋 ALL CUSTOM FIELDS FOUND:")
    if custom_fields:
        for i, field in enumerate(custom_fields, 1):
            api_name = field.get("api_name", "unknown")
            display_label = field.get("display_label", "unknown")
            data_type = field.get("data_type", "unknown")
            print(f"   {i:2d}. {api_name} ({display_label}) - {data_type}")
    else:
        print("   ❌ No custom fields found")
    
    # Show O2R candidates
    print(f"\n🎯 O2R FIELD CANDIDATES:")
    if o2r_candidates:
        # Sort by match score (highest first)
        o2r_candidates.sort(key=lambda x: x["match_score"], reverse=True)
        
        for candidate in o2r_candidates:
            o2r_field = candidate["o2r_field"]
            field_info = candidate["field_info"]
            keywords = ", ".join(candidate["matched_keywords"])
            score = candidate["match_score"]
            
            api_name = field_info.get("api_name", "unknown")
            display_label = field_info.get("display_label", "unknown")
            is_custom = field_info.get("custom_field", False)
            
            custom_marker = "🔧" if is_custom else "📋"
            print(f"   ✅ {custom_marker} {o2r_field.upper()}")
            print(f"      API Name: {api_name}")
            print(f"      Display: {display_label}")
            print(f"      Keywords: {keywords} (score: {score})")
            print()
    else:
        print("   ❌ No obvious O2R candidates found")
    
    # Generate field mapping recommendations
    await generate_mapping_recommendations(o2r_candidates, custom_fields)

async def generate_mapping_recommendations(o2r_candidates, custom_fields):
    """Generate field mapping recommendations for O2R"""
    print(f"\n💡 FIELD MAPPING RECOMMENDATIONS")
    print("-" * 50)
    
    # Current confirmed mappings
    confirmed_mappings = {
        "territory": "Region",
        "service_line": "Solution_Type",
        "invoice_date": "Invoice_Date"
    }
    
    print(f"✅ CONFIRMED MAPPINGS (already working):")
    for o2r_field, zoho_field in confirmed_mappings.items():
        print(f"   {o2r_field} → {zoho_field}")
    
    # Generate new mapping suggestions
    print(f"\n🔍 NEW MAPPING SUGGESTIONS:")
    
    # Group candidates by O2R field
    candidates_by_field = {}
    for candidate in o2r_candidates:
        o2r_field = candidate["o2r_field"]
        if o2r_field not in confirmed_mappings:  # Skip already confirmed ones
            if o2r_field not in candidates_by_field:
                candidates_by_field[o2r_field] = []
            candidates_by_field[o2r_field].append(candidate)
    
    if candidates_by_field:
        for o2r_field, candidates in candidates_by_field.items():
            print(f"\n   📌 {o2r_field.upper()}:")
            
            # Sort candidates by score
            candidates.sort(key=lambda x: x["match_score"], reverse=True)
            
            for i, candidate in enumerate(candidates[:3], 1):  # Show top 3
                field_info = candidate["field_info"]
                api_name = field_info.get("api_name")
                display_label = field_info.get("display_label")
                is_custom = field_info.get("custom_field", False)
                score = candidate["match_score"]
                
                confidence = "HIGH" if score >= 2 else "MEDIUM" if score >= 1 else "LOW"
                custom_marker = "🔧 Custom" if is_custom else "📋 Standard"
                
                print(f"      {i}. {api_name} - {confidence} confidence")
                print(f"         Display: {display_label}")
                print(f"         Type: {custom_marker}")
    else:
        print("   ❌ No new mapping candidates found")
    
    # Show missing O2R fields that need manual investigation
    all_o2r_fields = [
        "territory", "service_line", "strategic_account", "aws_funded",
        "alliance_motion", "proposal_date", "sow_date", "po_date",
        "kickoff_date", "invoice_date", "payment_date", "revenue_date"
    ]
    
    found_o2r_fields = set(confirmed_mappings.keys()) | set(candidates_by_field.keys())
    missing_o2r_fields = [field for field in all_o2r_fields if field not in found_o2r_fields]
    
    if missing_o2r_fields:
        print(f"\n❌ STILL MISSING O2R FIELDS:")
        for field in missing_o2r_fields:
            print(f"   {field}")
        
        print(f"\n🔍 MANUAL INVESTIGATION NEEDED:")
        print(f"   These fields may:")
        print(f"   1. Have completely different names in Zoho")
        print(f"   2. Not exist yet and need to be created")
        print(f"   3. Be hidden from API access")
        print(f"   4. Be in a different module or layout")

async def save_field_analysis(fields_data):
    """Save complete field analysis to JSON file"""
    print(f"\n💾 SAVING FIELD ANALYSIS...")
    
    # Prepare analysis data
    analysis_data = {
        "analysis_time": datetime.now().isoformat(),
        "api_used": "Zoho CRM Fields Metadata API v8",
        "total_fields": len(fields_data),
        "all_fields": fields_data,
        "summary": {
            "standard_fields": len([f for f in fields_data if not f.get("custom_field", False)]),
            "custom_fields": len([f for f in fields_data if f.get("custom_field", False)]),
            "custom_field_list": [
                {
                    "api_name": f.get("api_name"),
                    "display_label": f.get("display_label"),
                    "data_type": f.get("data_type")
                }
                for f in fields_data if f.get("custom_field", False)
            ]
        },
        "o2r_status": {
            "confirmed_mappings": {
                "territory": "Region",
                "service_line": "Solution_Type",
                "invoice_date": "Invoice_Date"
            },
            "total_required": 12,
            "confirmed_count": 3,
            "missing_count": 9
        }
    }
    
    # Save to JSON file
    output_file = "/Users/jrkphani/Projects/pipeline-pulse/backend/zoho_fields_metadata_analysis.json"
    with open(output_file, "w") as f:
        json.dump(analysis_data, f, indent=2, default=str)
    
    print(f"✅ Field analysis saved to: {output_file}")

async def test_discovered_fields():
    """Test accessing any newly discovered custom fields"""
    print(f"\n🧪 TESTING ACCESS TO DISCOVERED FIELDS")
    print("-" * 50)
    
    # This will be filled based on the analysis results
    print("   This section will test API access to newly discovered custom fields")
    print("   Run this analysis first, then update this function with specific field names")

async def main():
    """Main function to run the field discovery"""
    await find_all_custom_fields()
    
    print("\n" + "=" * 80)
    print("✅ FIELD DISCOVERY ANALYSIS COMPLETE!")
    print("📁 Check zoho_fields_metadata_analysis.json for full details")
    print("🎯 Use the mapping recommendations to update data_sync_service.py")

if __name__ == "__main__":
    asyncio.run(main())