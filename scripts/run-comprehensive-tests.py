#!/usr/bin/env python3
"""
Comprehensive Test Suite for Pipeline Pulse Zoho Integration
Executes all test categories and provides detailed reporting
"""

import asyncio
import os
import sys
import json
import time
from datetime import datetime
from typing import Dict, List, Any, Optional
import argparse

# Add backend to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Load environment variables from backend/.env
from dotenv import load_dotenv
backend_env_path = os.path.join(os.path.dirname(__file__), '..', 'backend', '.env')
load_dotenv(backend_env_path)


class TestResult:
    """Test result container"""
    def __init__(self, name: str, category: str):
        self.name = name
        self.category = category
        self.passed = False
        self.duration = 0.0
        self.details = {}
        self.error = None
        self.warnings = []
    
    def to_dict(self):
        return {
            "name": self.name,
            "category": self.category,
            "passed": self.passed,
            "duration": self.duration,
            "details": self.details,
            "error": str(self.error) if self.error else None,
            "warnings": self.warnings
        }


class TestSuite:
    """Main test suite coordinator"""
    
    def __init__(self, verbose: bool = False):
        self.verbose = verbose
        self.results: List[TestResult] = []
        self.start_time = None
        self.end_time = None
    
    async def run_test(self, test_func, name: str, category: str) -> TestResult:
        """Run a single test and capture results"""
        result = TestResult(name, category)
        
        if self.verbose:
            print(f"   Running: {name}...")
        
        start_time = time.time()
        try:
            test_output = await test_func()
            result.duration = time.time() - start_time
            
            if isinstance(test_output, dict):
                result.passed = test_output.get("passed", False)
                result.details = test_output.get("details", {})
                result.warnings = test_output.get("warnings", [])
            else:
                result.passed = bool(test_output)
            
        except Exception as e:
            result.duration = time.time() - start_time
            result.passed = False
            result.error = e
            if self.verbose:
                print(f"      ❌ Error: {str(e)}")
        
        self.results.append(result)
        
        if self.verbose:
            status = "✅ PASS" if result.passed else "❌ FAIL"
            print(f"      {status} ({result.duration:.2f}s)")
        
        return result
    
    def get_category_results(self, category: str) -> List[TestResult]:
        """Get results for a specific category"""
        return [r for r in self.results if r.category == category]
    
    def get_summary(self) -> Dict[str, Any]:
        """Get test summary statistics"""
        total_tests = len(self.results)
        passed_tests = sum(1 for r in self.results if r.passed)
        total_duration = sum(r.duration for r in self.results)
        
        categories = {}
        for result in self.results:
            if result.category not in categories:
                categories[result.category] = {"total": 0, "passed": 0}
            categories[result.category]["total"] += 1
            if result.passed:
                categories[result.category]["passed"] += 1
        
        return {
            "total_tests": total_tests,
            "passed_tests": passed_tests,
            "failed_tests": total_tests - passed_tests,
            "pass_rate": (passed_tests / total_tests * 100) if total_tests > 0 else 0,
            "total_duration": total_duration,
            "categories": categories,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None
        }
    
    def print_summary(self):
        """Print comprehensive test summary"""
        summary = self.get_summary()
        
        print("\n" + "=" * 80)
        print("🎉 COMPREHENSIVE TEST RESULTS")
        print("=" * 80)
        
        # Overall statistics
        print(f"Total Tests: {summary['total_tests']}")
        print(f"Passed: {summary['passed_tests']}")
        print(f"Failed: {summary['failed_tests']}")
        print(f"Pass Rate: {summary['pass_rate']:.1f}%")
        print(f"Total Duration: {summary['total_duration']:.2f}s")
        print()
        
        # Category breakdown
        print("📊 Category Results:")
        print("-" * 50)
        
        for category, stats in summary['categories'].items():
            passed = stats['passed']
            total = stats['total']
            rate = (passed / total * 100) if total > 0 else 0
            
            if rate == 100:
                status = "✅"
            elif rate >= 90:
                status = "⚠️"
            else:
                status = "❌"
            
            print(f"{status} {category}: {passed}/{total} tests passed ({rate:.1f}%)")
        
        print()
        
        # Failed tests details
        failed_tests = [r for r in self.results if not r.passed]
        if failed_tests:
            print("❌ Failed Tests:")
            print("-" * 30)
            for test in failed_tests:
                print(f"   • {test.category}: {test.name}")
                if test.error:
                    print(f"     Error: {str(test.error)[:100]}...")
        
        # Warnings
        warnings = []
        for result in self.results:
            warnings.extend(result.warnings)
        
        if warnings:
            print("\n⚠️ Warnings:")
            print("-" * 20)
            for warning in warnings[:5]:  # Show first 5 warnings
                print(f"   • {warning}")
        
        # Overall status
        print("\n" + "=" * 80)
        if summary['pass_rate'] >= 95:
            print("🎉 STATUS: ✅ EXCELLENT - Ready for production!")
        elif summary['pass_rate'] >= 90:
            print("🎯 STATUS: ⚠️ GOOD - Minor issues to address")
        elif summary['pass_rate'] >= 80:
            print("⚠️ STATUS: ⚠️ NEEDS WORK - Several issues found")
        else:
            print("🚨 STATUS: ❌ CRITICAL - Major issues require attention")
        
        print("=" * 80)
    
    def save_report(self, filename: str = None):
        """Save detailed test report to file"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"test_report_{timestamp}.json"
        
        report_data = {
            "summary": self.get_summary(),
            "results": [r.to_dict() for r in self.results],
            "environment": {
                "branch": self._get_git_branch(),
                "python_version": sys.version,
                "test_timestamp": datetime.now().isoformat()
            }
        }
        
        with open(filename, 'w') as f:
            json.dump(report_data, f, indent=2, default=str)
        
        print(f"\n📄 Detailed report saved to: {filename}")
    
    def _get_git_branch(self) -> str:
        """Get current git branch"""
        try:
            import subprocess
            result = subprocess.run(
                ['git', 'rev-parse', '--abbrev-ref', 'HEAD'],
                capture_output=True, text=True, cwd=os.path.dirname(__file__)
            )
            return result.stdout.strip()
        except:
            return "unknown"


async def main():
    """Main test execution function"""
    
    parser = argparse.ArgumentParser(description="Run comprehensive test suite")
    parser.add_argument("--category", help="Run specific test category")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose output")
    parser.add_argument("--report", "-r", action="store_true", help="Save detailed report")
    parser.add_argument("--list", "-l", action="store_true", help="List available categories")
    
    args = parser.parse_args()
    
    # Available test categories
    categories = [
        "authentication",
        "connectivity", 
        "data_retrieval",
        "crud_operations",
        "performance",
        "error_handling",
        "integration",
        "production_readiness"
    ]
    
    if args.list:
        print("Available test categories:")
        for cat in categories:
            print(f"  • {cat}")
        return
    
    # Initialize test suite
    suite = TestSuite(verbose=args.verbose)
    suite.start_time = datetime.now()
    
    print(f"🚀 Starting Comprehensive Test Suite - {suite.start_time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Environment: local-testing branch")
    print(f"Target categories: {args.category or 'all'}")
    print("=" * 80)
    
    # Import test modules
    try:
        from test_authentication import run_authentication_tests
        from test_connectivity import run_connectivity_tests
        from test_data_retrieval import run_data_retrieval_tests
        from test_crud_operations import run_crud_operations_tests
        from test_performance import run_performance_tests
        from test_error_handling import run_error_handling_tests
        from test_integration import run_integration_tests
        from test_production_readiness import run_production_readiness_tests
        
    except ImportError as e:
        print(f"❌ Failed to import test modules: {e}")
        print("Creating test modules...")
        # We'll create the test modules in the next steps
        return
    
    # Run tests based on category selection
    test_functions = {
        "authentication": run_authentication_tests,
        "connectivity": run_connectivity_tests,
        "data_retrieval": run_data_retrieval_tests,
        "crud_operations": run_crud_operations_tests,
        "performance": run_performance_tests,
        "error_handling": run_error_handling_tests,
        "integration": run_integration_tests,
        "production_readiness": run_production_readiness_tests
    }
    
    if args.category:
        if args.category in test_functions:
            print(f"🧪 Running {args.category} tests...")
            await test_functions[args.category](suite)
        else:
            print(f"❌ Unknown category: {args.category}")
            return
    else:
        # Run all categories
        for category, test_func in test_functions.items():
            print(f"\n🧪 Running {category} tests...")
            await test_func(suite)
    
    suite.end_time = datetime.now()
    
    # Print results
    suite.print_summary()
    
    # Save report if requested
    if args.report:
        suite.save_report()


if __name__ == "__main__":
    asyncio.run(main())
