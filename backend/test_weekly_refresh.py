#!/usr/bin/env python3
"""
Test script for weekly currency refresh functionality

This script tests the complete weekly refresh workflow:
1. Fresh cache detection
2. Stale cache detection  
3. Weekly refresh execution
4. Cache timestamp updates
"""

import sys
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.services.currency_service import currency_service
from app.core.database import get_db

def test_weekly_refresh():
    """Test the complete weekly refresh workflow"""
    
    print("🧪 Testing Weekly Currency Refresh Functionality")
    print("=" * 60)
    
    # Get database session
    db_gen = get_db()
    db = next(db_gen)
    
    try:
        # Test 1: Fresh Cache Detection
        print("\n1️⃣ Testing Fresh Cache Detection")
        print("-" * 40)
        
        # Ensure we have fresh cache
        currency_service.get_exchange_rates(db, force_refresh=True)
        
        cache_status = currency_service.get_cache_status(db)
        print(f"Cache Status: {cache_status['cache_status']}")
        print(f"Total Currencies: {cache_status['total_currencies']}")
        print(f"Age: {cache_status['age_days']} days")
        
        assert cache_status['cache_status'] == 'fresh', "Cache should be fresh after force refresh"
        print("✅ Fresh cache detection working correctly")
        
        # Test 2: Stale Cache Simulation
        print("\n2️⃣ Testing Stale Cache Detection")
        print("-" * 40)
        
        # Artificially age the cache to 8 days old
        old_date = datetime.utcnow() - timedelta(days=8)
        conn = sqlite3.connect('pipeline_pulse.db')
        cursor = conn.cursor()
        cursor.execute('UPDATE currency_rates SET updated_at = ?', (old_date.isoformat(),))
        conn.commit()
        conn.close()
        
        cache_status = currency_service.get_cache_status(db)
        print(f"Cache Status: {cache_status['cache_status']}")
        print(f"Age: {cache_status['age_days']} days")
        
        assert cache_status['cache_status'] == 'stale', "Cache should be stale after aging"
        assert cache_status['age_days'] >= 7, "Cache should be at least 7 days old"
        print("✅ Stale cache detection working correctly")
        
        # Test 3: Weekly Refresh Execution
        print("\n3️⃣ Testing Weekly Refresh Execution")
        print("-" * 40)
        
        # Execute force refresh (simulating weekly scheduler)
        print("Executing force refresh...")
        rates_before = currency_service.get_exchange_rates(db, force_refresh=False)
        rates_after = currency_service.get_exchange_rates(db, force_refresh=True)
        
        print(f"Rates before refresh: {len(rates_before)}")
        print(f"Rates after refresh: {len(rates_after)}")
        
        assert len(rates_after) > 0, "Should return rates after refresh"
        print("✅ Weekly refresh execution working correctly")
        
        # Test 4: Cache Timestamp Updates
        print("\n4️⃣ Testing Cache Timestamp Updates")
        print("-" * 40)
        
        cache_status = currency_service.get_cache_status(db)
        print(f"Cache Status: {cache_status['cache_status']}")
        print(f"Age: {cache_status['age_days']} days")
        print(f"Last Updated: {cache_status['last_updated']}")
        
        # Check if timestamps are recent (within last minute)
        if cache_status['last_updated']:
            last_updated = datetime.fromisoformat(cache_status['last_updated'])
            age_minutes = (datetime.utcnow() - last_updated).total_seconds() / 60
            print(f"Age in minutes: {age_minutes:.2f}")
            
            assert age_minutes < 5, "Cache should be updated within last 5 minutes"
            assert cache_status['cache_status'] == 'fresh', "Cache should be fresh after refresh"
        
        print("✅ Cache timestamp updates working correctly")
        
        # Test 5: Rate Persistence
        print("\n5️⃣ Testing Rate Persistence")
        print("-" * 40)
        
        # Check database directly
        conn = sqlite3.connect('pipeline_pulse.db')
        cursor = conn.cursor()
        cursor.execute('SELECT COUNT(*) FROM currency_rates;')
        db_count = cursor.fetchone()[0]
        
        cursor.execute('SELECT currency_code, sgd_rate FROM currency_rates ORDER BY currency_code LIMIT 5;')
        sample_rates = cursor.fetchall()
        conn.close()
        
        print(f"Rates in database: {db_count}")
        print("Sample rates:")
        for currency, rate in sample_rates:
            print(f"  {currency}: {rate}")
        
        assert db_count > 0, "Should have rates persisted in database"
        print("✅ Rate persistence working correctly")
        
        # Summary
        print("\n🎉 All Tests Passed!")
        print("=" * 60)
        print("Weekly refresh functionality is working correctly:")
        print("✅ Fresh cache detection")
        print("✅ Stale cache detection") 
        print("✅ Weekly refresh execution")
        print("✅ Cache timestamp updates")
        print("✅ Rate persistence")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False
        
    finally:
        db.close()

if __name__ == "__main__":
    success = test_weekly_refresh()
    sys.exit(0 if success else 1)
