#!/usr/bin/env python3
"""
Analyze probability data in the deals to understand why Delivery Stage shows no deals
"""

import sqlite3
import json
from collections import Counter
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

def analyze_probability_data():
    """Analyze the probability distribution in the deals data"""
    
    print("🔍 Analyzing Probability Data in Pipeline Pulse")
    print("=" * 60)
    
    try:
        # Connect to database
        conn = sqlite3.connect('pipeline_pulse.db')
        cursor = conn.cursor()
        
        # Get the latest analysis data
        cursor.execute("""
            SELECT id, filename, total_deals, data 
            FROM analyses 
            WHERE is_latest = 1
        """)
        
        result = cursor.fetchone()
        if not result:
            print("❌ No analysis data found")
            return
        
        analysis_id, filename, total_deals, data_json = result
        print(f"📊 Analysis: {filename}")
        print(f"📈 Total Deals: {total_deals}")
        print(f"🆔 Analysis ID: {analysis_id}")
        
        # Parse the JSON data
        try:
            deals_data = json.loads(data_json)
        except json.JSONDecodeError as e:
            print(f"❌ Failed to parse JSON data: {e}")
            return
        
        print(f"\n📋 Loaded {len(deals_data)} deals from database")
        
        # Extract probability values
        probabilities = []
        probability_field_names = ['probability', 'Probability', 'prob', 'Prob', 'stage_probability']
        
        for deal in deals_data:
            prob_value = None
            
            # Try different possible field names for probability
            for field_name in probability_field_names:
                if field_name in deal:
                    prob_value = deal[field_name]
                    break
            
            if prob_value is not None:
                try:
                    # Handle percentage strings (e.g., "85%")
                    if isinstance(prob_value, str):
                        prob_value = prob_value.strip().rstrip('%')
                    
                    prob_float = float(prob_value)
                    probabilities.append(prob_float)
                except (ValueError, TypeError):
                    print(f"⚠️ Invalid probability value: {prob_value}")
        
        if not probabilities:
            print("❌ No probability values found in deals data")
            print("\n🔍 Available fields in first deal:")
            if deals_data:
                for key in deals_data[0].keys():
                    print(f"   • {key}")
            return
        
        print(f"\n📊 Probability Analysis ({len(probabilities)} deals with probability data)")
        print("-" * 50)
        
        # Basic statistics
        min_prob = min(probabilities)
        max_prob = max(probabilities)
        avg_prob = sum(probabilities) / len(probabilities)
        
        print(f"📈 Range: {min_prob}% - {max_prob}%")
        print(f"📊 Average: {avg_prob:.1f}%")
        
        # Count by probability ranges (matching updated filter stages)
        ranges = {
            "0-9%": (0, 9),
            "10-39% (Sales)": (10, 39),
            "40-70% (Presales)": (40, 70),
            "71-80% (Deal Approval)": (71, 80),
            "81-100% (Delivery)": (81, 100)
        }
        
        print(f"\n📋 Distribution by Pipeline Stages:")
        print("-" * 40)
        
        for range_name, (min_val, max_val) in ranges.items():
            count = sum(1 for p in probabilities if min_val <= p <= max_val)
            percentage = (count / len(probabilities)) * 100
            print(f"{range_name:20} {count:4d} deals ({percentage:5.1f}%)")
        
        # Detailed breakdown for high probability deals
        high_prob_deals = [p for p in probabilities if p >= 80]
        if high_prob_deals:
            print(f"\n🎯 High Probability Deals (≥80%):")
            print("-" * 30)
            prob_counter = Counter(high_prob_deals)
            for prob in sorted(prob_counter.keys()):
                count = prob_counter[prob]
                print(f"   {prob}%: {count} deals")
        else:
            print(f"\n❌ No deals found with probability ≥80%")
        
        # Check for deals in Delivery Stage range (81-100%)
        delivery_deals = [p for p in probabilities if 81 <= p <= 100]
        print(f"\n🚚 Delivery Stage Analysis (81-100%):")
        print("-" * 35)
        print(f"   Total deals: {len(delivery_deals)}")
        
        if delivery_deals:
            print(f"   Probability values: {sorted(set(delivery_deals))}")
            
            # Show sample deals in delivery stage
            print(f"\n📋 Sample Delivery Stage Deals:")
            delivery_count = 0
            for deal in deals_data:
                prob_value = None
                for field_name in probability_field_names:
                    if field_name in deal:
                        prob_value = deal[field_name]
                        break
                
                if prob_value is not None:
                    try:
                        if isinstance(prob_value, str):
                            prob_value = prob_value.strip().rstrip('%')
                        prob_float = float(prob_value)
                        
                        if 81 <= prob_float <= 100:
                            deal_name = deal.get('Deal Name', deal.get('deal_name', deal.get('name', 'Unknown')))
                            print(f"   • {deal_name}: {prob_float}%")
                            delivery_count += 1
                            if delivery_count >= 5:  # Show max 5 examples
                                break
                    except (ValueError, TypeError):
                        continue
        else:
            print(f"   ❌ No deals found in 81-100% range")
            print(f"\n🔍 Checking for deals close to this range:")
            near_delivery = [p for p in probabilities if 75 <= p <= 80]
            if near_delivery:
                print(f"   Deals in 75-80% range: {len(near_delivery)} deals")
                print(f"   Values: {sorted(set(near_delivery))}")
        
        # Check unique probability values
        unique_probs = sorted(set(probabilities))
        print(f"\n📊 All Unique Probability Values:")
        print("-" * 35)
        print(f"   Count: {len(unique_probs)} unique values")
        if len(unique_probs) <= 20:
            print(f"   Values: {unique_probs}")
        else:
            print(f"   First 10: {unique_probs[:10]}")
            print(f"   Last 10: {unique_probs[-10:]}")
        
        conn.close()
        
        # Summary and recommendations
        print(f"\n💡 Summary and Recommendations:")
        print("=" * 40)
        
        if not delivery_deals:
            print("❌ Issue Confirmed: No deals in Delivery Stage (81-100%)")
            print("🔍 Possible causes:")
            print("   1. Data source doesn't contain high-probability deals")
            print("   2. Deals might use different probability scale")
            print("   3. High-probability deals might be in different status")
            
            max_prob_in_data = max(probabilities) if probabilities else 0
            print(f"   4. Highest probability in data: {max_prob_in_data}%")
            
            if max_prob_in_data < 81:
                print("   → Consider adjusting Delivery Stage range")
                print(f"   → Suggested range: {max(70, int(max_prob_in_data * 0.9))}-{int(max_prob_in_data)}%")
        else:
            print("✅ Delivery Stage deals found - filter should be working")
            print("🔍 If frontend shows 0 deals, check:")
            print("   1. Date range filter compatibility")
            print("   2. Frontend filtering logic")
            print("   3. Data parsing in frontend")
        
        return True
        
    except Exception as e:
        print(f"❌ Analysis failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = analyze_probability_data()
    sys.exit(0 if success else 1)
