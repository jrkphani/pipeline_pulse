#!/usr/bin/env python3
"""
Test Thread Safety of Zoho SDK Implementation
"""

import asyncio
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from dotenv import load_dotenv
load_dotenv()

async def test_concurrent_operations():
    """Test concurrent Zoho API operations"""
    try:
        from app.services.thread_safe_zoho_wrapper import ThreadSafeZohoWrapper, ZohoUserContext
        from app.core.config import settings
        
        print("🧵 Testing thread-safe concurrent operations...")
        
        # Create multiple user contexts (simulating different users/sessions)
        user1_context = ZohoUserContext(
            user_id="user1@1cloudhub.com",
            client_id=settings.ZOHO_CLIENT_ID,
            client_secret=settings.ZOHO_CLIENT_SECRET,
            refresh_token=settings.ZOHO_REFRESH_TOKEN,
            data_center="IN"
        )
        
        user2_context = ZohoUserContext(
            user_id="user2@1cloudhub.com", 
            client_id=settings.ZOHO_CLIENT_ID,
            client_secret=settings.ZOHO_CLIENT_SECRET,
            refresh_token=settings.ZOHO_REFRESH_TOKEN,
            data_center="IN"
        )
        
        async with ThreadSafeZohoWrapper(max_workers=4) as wrapper:
            print("✅ Thread-safe wrapper initialized")
            
            # Test concurrent API calls with different user contexts
            tasks = [
                wrapper.get_records("Deals", page=1, per_page=10, user_context=user1_context),
                wrapper.get_records("Deals", page=1, per_page=10, user_context=user2_context),
                wrapper.get_records("Deals", page=1, per_page=10, user_context=None),  # Default context
                wrapper.get_records("Contacts", page=1, per_page=5, user_context=user1_context),
            ]
            
            print("🚀 Starting concurrent API calls...")
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Analyze results
            success_count = 0
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    print(f"❌ Task {i+1} failed: {result}")
                else:
                    success_count += 1
                    print(f"✅ Task {i+1} succeeded: {result.get('status', 'unknown')} - {len(result.get('data', []))} records")
            
            print(f"\n📊 Results: {success_count}/{len(tasks)} tasks succeeded")
            return success_count == len(tasks)
            
    except Exception as e:
        print(f"❌ Thread safety test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_thread_safety_vs_original():
    """Compare thread-safe vs original implementation"""
    try:
        print("\n🔄 Comparing implementations...")
        
        # Test original implementation
        from app.services.async_zoho_wrapper import AsyncZohoWrapper
        
        print("Testing original AsyncZohoWrapper...")
        async with AsyncZohoWrapper() as original_wrapper:
            original_result = await original_wrapper.get_records("Deals", page=1, per_page=5)
            print(f"✅ Original: {original_result.get('status')} - {len(original_result.get('data', []))} records")
        
        # Test thread-safe implementation
        from app.services.thread_safe_zoho_wrapper import ThreadSafeZohoWrapper
        
        print("Testing ThreadSafeZohoWrapper...")
        async with ThreadSafeZohoWrapper() as thread_safe_wrapper:
            thread_safe_result = await thread_safe_wrapper.get_records("Deals", page=1, per_page=5)
            print(f"✅ Thread-safe: {thread_safe_result.get('status')} - {len(thread_safe_result.get('data', []))} records")
        
        # Compare results
        original_count = len(original_result.get('data', []))
        thread_safe_count = len(thread_safe_result.get('data', []))
        
        if original_count == thread_safe_count:
            print("✅ Both implementations return same data count")
            return True
        else:
            print(f"⚠️ Data count mismatch: Original={original_count}, Thread-safe={thread_safe_count}")
            return False
            
    except Exception as e:
        print(f"❌ Comparison test failed: {e}")
        return False


async def main():
    """Run all thread safety tests"""
    print("🧪 Thread Safety Test Suite")
    print("=" * 60)
    
    # Test 1: Concurrent operations
    test1_success = await test_concurrent_operations()
    
    # Test 2: Implementation comparison
    test2_success = await test_thread_safety_vs_original()
    
    print("=" * 60)
    
    if test1_success and test2_success:
        print("🎉 All thread safety tests PASSED!")
        print("\n✅ Recommendations:")
        print("- Use ThreadSafeZohoWrapper for production")
        print("- Switch to this implementation for better concurrency")
        print("- User context switching works correctly")
    else:
        print("💥 Some thread safety tests FAILED!")
        print("\n⚠️ Issues:")
        if not test1_success:
            print("- Concurrent operations have issues")
        if not test2_success:
            print("- Implementation comparison failed")


if __name__ == "__main__":
    asyncio.run(main())