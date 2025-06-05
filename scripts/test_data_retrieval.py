#!/usr/bin/env python3
"""
Data Retrieval & Validation Tests
Test comprehensive deal data fetching, field validation, and data consistency
"""

import asyncio
import os
import sys
from datetime import datetime
from typing import Dict, Any, List

# Add backend to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Load environment variables
from dotenv import load_dotenv
backend_env_path = os.path.join(os.path.dirname(__file__), '..', 'backend', '.env')
load_dotenv(backend_env_path)


async def test_deal_data_retrieval():
    """Test comprehensive deal data fetching"""
    try:
        from app.services.zoho_crm.core.api_client import ZohoAPIClient
        
        api_client = ZohoAPIClient()
        
        # Test basic deal fetch
        fields = ["Deal_Name", "Amount", "Stage", "Closing_Date", "Account_Name", "Owner"]
        response = await api_client.get("Deals", params={
            "per_page": 50,
            "fields": ",".join(fields)
        })
        
        if not isinstance(response, dict) or "data" not in response:
            return {
                "passed": False,
                "details": {"error": "Invalid response format"},
                "warnings": []
            }
        
        deals = response["data"]
        info = response.get("info", {})
        
        # Analyze data completeness
        total_deals = len(deals)
        field_completeness = {}
        
        for field in fields:
            populated_count = sum(1 for deal in deals if deal.get(field) is not None and deal.get(field) != "")
            field_completeness[field] = {
                "populated": populated_count,
                "total": total_deals,
                "percentage": (populated_count / total_deals * 100) if total_deals > 0 else 0
            }
        
        # Sample deal validation
        sample_deal = deals[0] if deals else {}
        sample_validation = {
            "has_deal_name": bool(sample_deal.get("Deal_Name")),
            "has_amount": sample_deal.get("Amount") is not None,
            "has_stage": bool(sample_deal.get("Stage")),
            "has_id": bool(sample_deal.get("id")),
            "amount_is_numeric": isinstance(sample_deal.get("Amount"), (int, float)) if sample_deal.get("Amount") is not None else False
        }
        
        # Check pagination info
        pagination_info = {
            "page": info.get("page", 1),
            "per_page": info.get("per_page", 0),
            "count": info.get("count", 0),
            "more_records": info.get("more_records", False)
        }
        
        warnings = []
        
        # Check for data quality issues
        avg_completeness = sum(fc["percentage"] for fc in field_completeness.values()) / len(field_completeness)
        if avg_completeness < 90:
            warnings.append(f"Low data completeness: {avg_completeness:.1f}%")
        
        if total_deals == 0:
            warnings.append("No deals retrieved")
        
        # Check for required fields
        if not sample_validation.get("has_deal_name"):
            warnings.append("Sample deal missing Deal_Name")
        
        return {
            "passed": total_deals > 0 and avg_completeness >= 70,
            "details": {
                "total_deals_retrieved": total_deals,
                "field_completeness": field_completeness,
                "average_completeness": round(avg_completeness, 2),
                "sample_deal_validation": sample_validation,
                "pagination_info": pagination_info,
                "sample_deal": {
                    "Deal_Name": sample_deal.get("Deal_Name", "N/A"),
                    "Amount": sample_deal.get("Amount", "N/A"),
                    "Stage": sample_deal.get("Stage", "N/A")
                } if sample_deal else {}
            },
            "warnings": warnings
        }
        
    except Exception as e:
        return {
            "passed": False,
            "details": {"error": str(e)},
            "warnings": []
        }


async def test_field_validation():
    """Test field parameter requirements and validation"""
    try:
        from app.services.zoho_crm.core.api_client import ZohoAPIClient
        
        api_client = ZohoAPIClient()
        
        validation_results = {}
        warnings = []
        
        # Test 1: Request without fields (should fail)
        try:
            await api_client.get("Deals", params={"per_page": 1})
            validation_results["request_without_fields"] = {
                "failed_as_expected": False,
                "note": "Request should have failed but didn't"
            }
            warnings.append("Request without fields should have failed")
        except Exception as e:
            error_str = str(e)
            if "REQUIRED_PARAM_MISSING" in error_str or "fields" in error_str.lower():
                validation_results["request_without_fields"] = {
                    "failed_as_expected": True,
                    "error_type": "REQUIRED_PARAM_MISSING"
                }
            else:
                validation_results["request_without_fields"] = {
                    "failed_as_expected": False,
                    "unexpected_error": error_str
                }
                warnings.append(f"Unexpected error without fields: {error_str}")
        
        # Test 2: Request with valid fields
        try:
            response = await api_client.get("Deals", params={
                "per_page": 3,
                "fields": "Deal_Name,Amount,Stage"
            })
            
            if isinstance(response, dict) and "data" in response:
                deals = response["data"]
                validation_results["request_with_valid_fields"] = {
                    "successful": True,
                    "deals_returned": len(deals),
                    "fields_in_response": list(deals[0].keys()) if deals else []
                }
            else:
                validation_results["request_with_valid_fields"] = {
                    "successful": False,
                    "error": "Invalid response format"
                }
                warnings.append("Valid fields request returned invalid format")
                
        except Exception as e:
            validation_results["request_with_valid_fields"] = {
                "successful": False,
                "error": str(e)
            }
            warnings.append(f"Valid fields request failed: {str(e)}")
        
        # Test 3: Request with invalid field names
        try:
            await api_client.get("Deals", params={
                "per_page": 1,
                "fields": "Invalid_Field_Name,Another_Invalid_Field"
            })
            validation_results["request_with_invalid_fields"] = {
                "failed_as_expected": False,
                "note": "Request with invalid fields should have failed"
            }
            warnings.append("Request with invalid fields should have failed")
        except Exception as e:
            error_str = str(e)
            if "INVALID_DATA" in error_str or "invalid" in error_str.lower():
                validation_results["request_with_invalid_fields"] = {
                    "failed_as_expected": True,
                    "error_type": "INVALID_DATA"
                }
            else:
                validation_results["request_with_invalid_fields"] = {
                    "failed_as_expected": True,
                    "error_type": "OTHER",
                    "error": error_str
                }
        
        # Test 4: Field type validation
        try:
            response = await api_client.get("Deals", params={
                "per_page": 5,
                "fields": "Deal_Name,Amount,Stage,Closing_Date,Created_Time"
            })
            
            if isinstance(response, dict) and "data" in response:
                deals = response["data"]
                if deals:
                    sample_deal = deals[0]
                    field_types = {}
                    
                    for field, value in sample_deal.items():
                        if value is not None:
                            field_types[field] = type(value).__name__
                    
                    validation_results["field_type_validation"] = {
                        "successful": True,
                        "field_types": field_types,
                        "amount_is_numeric": isinstance(sample_deal.get("Amount"), (int, float)),
                        "deal_name_is_string": isinstance(sample_deal.get("Deal_Name"), str)
                    }
                else:
                    validation_results["field_type_validation"] = {
                        "successful": False,
                        "error": "No deals returned for type validation"
                    }
            else:
                validation_results["field_type_validation"] = {
                    "successful": False,
                    "error": "Invalid response format"
                }
                
        except Exception as e:
            validation_results["field_type_validation"] = {
                "successful": False,
                "error": str(e)
            }
            warnings.append(f"Field type validation failed: {str(e)}")
        
        # Test 5: Default field set validation
        default_fields = [
            "Deal_Name", "Amount", "Stage", "Closing_Date", "Account_Name",
            "Owner", "Probability", "Created_Time", "Modified_Time"
        ]
        
        try:
            response = await api_client.get("Deals", params={
                "per_page": 2,
                "fields": ",".join(default_fields)
            })
            
            if isinstance(response, dict) and "data" in response:
                deals = response["data"]
                if deals:
                    returned_fields = set(deals[0].keys())
                    requested_fields = set(default_fields + ["id"])  # ID is always returned
                    
                    validation_results["default_field_set"] = {
                        "successful": True,
                        "requested_fields": len(default_fields),
                        "returned_fields": len(returned_fields),
                        "all_requested_returned": requested_fields.issubset(returned_fields)
                    }
                else:
                    validation_results["default_field_set"] = {
                        "successful": False,
                        "error": "No deals returned"
                    }
            else:
                validation_results["default_field_set"] = {
                    "successful": False,
                    "error": "Invalid response format"
                }
                
        except Exception as e:
            validation_results["default_field_set"] = {
                "successful": False,
                "error": str(e)
            }
            warnings.append(f"Default field set test failed: {str(e)}")
        
        # Calculate validation score
        validation_checks = [
            validation_results.get("request_without_fields", {}).get("failed_as_expected", False),
            validation_results.get("request_with_valid_fields", {}).get("successful", False),
            validation_results.get("request_with_invalid_fields", {}).get("failed_as_expected", False),
            validation_results.get("field_type_validation", {}).get("successful", False),
            validation_results.get("default_field_set", {}).get("successful", False)
        ]
        
        validation_score = (sum(validation_checks) / len(validation_checks)) * 100
        
        return {
            "passed": validation_score >= 80,
            "details": {
                "validation_results": validation_results,
                "validation_score": validation_score,
                "passed_checks": sum(validation_checks),
                "total_checks": len(validation_checks)
            },
            "warnings": warnings
        }
        
    except Exception as e:
        return {
            "passed": False,
            "details": {"error": str(e)},
            "warnings": []
        }


async def test_data_consistency():
    """Test data consistency across multiple requests"""
    try:
        from app.services.zoho_crm.core.api_client import ZohoAPIClient
        
        api_client = ZohoAPIClient()
        
        consistency_results = {}
        warnings = []
        
        # Test 1: Same deal, multiple requests
        try:
            # First request
            response1 = await api_client.get("Deals", params={
                "per_page": 1,
                "fields": "Deal_Name,Amount,Stage,Modified_Time"
            })
            
            # Second request (same parameters)
            response2 = await api_client.get("Deals", params={
                "per_page": 1,
                "fields": "Deal_Name,Amount,Stage,Modified_Time"
            })
            
            if (isinstance(response1, dict) and "data" in response1 and 
                isinstance(response2, dict) and "data" in response2):
                
                deals1 = response1["data"]
                deals2 = response2["data"]
                
                if deals1 and deals2:
                    deal1 = deals1[0]
                    deal2 = deals2[0]
                    
                    # Compare key fields
                    consistency_results["same_deal_multiple_requests"] = {
                        "deal_name_consistent": deal1.get("Deal_Name") == deal2.get("Deal_Name"),
                        "amount_consistent": deal1.get("Amount") == deal2.get("Amount"),
                        "stage_consistent": deal1.get("Stage") == deal2.get("Stage"),
                        "modified_time_consistent": deal1.get("Modified_Time") == deal2.get("Modified_Time"),
                        "id_consistent": deal1.get("id") == deal2.get("id")
                    }
                else:
                    consistency_results["same_deal_multiple_requests"] = {
                        "error": "No deals returned in one or both requests"
                    }
                    warnings.append("Consistency test failed - no deals returned")
            else:
                consistency_results["same_deal_multiple_requests"] = {
                    "error": "Invalid response format"
                }
                warnings.append("Consistency test failed - invalid response format")
                
        except Exception as e:
            consistency_results["same_deal_multiple_requests"] = {
                "error": str(e)
            }
            warnings.append(f"Same deal consistency test failed: {str(e)}")
        
        # Test 2: ID format consistency
        try:
            response = await api_client.get("Deals", params={
                "per_page": 10,
                "fields": "Deal_Name"
            })
            
            if isinstance(response, dict) and "data" in response:
                deals = response["data"]
                
                if deals:
                    id_formats = []
                    for deal in deals:
                        deal_id = deal.get("id", "")
                        id_formats.append({
                            "id": deal_id,
                            "length": len(str(deal_id)),
                            "is_numeric": str(deal_id).isdigit(),
                            "format": "18-digit" if len(str(deal_id)) == 18 and str(deal_id).isdigit() else "other"
                        })
                    
                    # Check if all IDs follow same format
                    id_lengths = [fmt["length"] for fmt in id_formats]
                    id_types = [fmt["format"] for fmt in id_formats]
                    
                    consistency_results["id_format_consistency"] = {
                        "total_deals_checked": len(deals),
                        "id_formats": id_formats[:3],  # Show first 3 as examples
                        "consistent_length": len(set(id_lengths)) == 1,
                        "consistent_format": len(set(id_types)) == 1,
                        "common_length": max(set(id_lengths), key=id_lengths.count) if id_lengths else 0,
                        "common_format": max(set(id_types), key=id_types.count) if id_types else "unknown"
                    }
                else:
                    consistency_results["id_format_consistency"] = {
                        "error": "No deals returned"
                    }
                    warnings.append("ID format test failed - no deals returned")
            else:
                consistency_results["id_format_consistency"] = {
                    "error": "Invalid response format"
                }
                warnings.append("ID format test failed - invalid response format")
                
        except Exception as e:
            consistency_results["id_format_consistency"] = {
                "error": str(e)
            }
            warnings.append(f"ID format consistency test failed: {str(e)}")
        
        # Test 3: Currency and number formatting
        try:
            response = await api_client.get("Deals", params={
                "per_page": 5,
                "fields": "Deal_Name,Amount,Probability"
            })
            
            if isinstance(response, dict) and "data" in response:
                deals = response["data"]
                
                if deals:
                    number_formats = []
                    for deal in deals:
                        amount = deal.get("Amount")
                        probability = deal.get("Probability")
                        
                        number_formats.append({
                            "deal_name": deal.get("Deal_Name", "Unknown"),
                            "amount": amount,
                            "amount_type": type(amount).__name__ if amount is not None else "None",
                            "probability": probability,
                            "probability_type": type(probability).__name__ if probability is not None else "None"
                        })
                    
                    # Check number type consistency
                    amount_types = [fmt["amount_type"] for fmt in number_formats if fmt["amount_type"] != "None"]
                    prob_types = [fmt["probability_type"] for fmt in number_formats if fmt["probability_type"] != "None"]
                    
                    consistency_results["number_formatting"] = {
                        "deals_checked": len(deals),
                        "sample_formats": number_formats[:3],
                        "amount_types_consistent": len(set(amount_types)) <= 1 if amount_types else True,
                        "probability_types_consistent": len(set(prob_types)) <= 1 if prob_types else True,
                        "common_amount_type": max(set(amount_types), key=amount_types.count) if amount_types else "None",
                        "common_probability_type": max(set(prob_types), key=prob_types.count) if prob_types else "None"
                    }
                else:
                    consistency_results["number_formatting"] = {
                        "error": "No deals returned"
                    }
                    warnings.append("Number formatting test failed - no deals returned")
            else:
                consistency_results["number_formatting"] = {
                    "error": "Invalid response format"
                }
                warnings.append("Number formatting test failed - invalid response format")
                
        except Exception as e:
            consistency_results["number_formatting"] = {
                "error": str(e)
            }
            warnings.append(f"Number formatting test failed: {str(e)}")
        
        # Calculate consistency score
        consistency_checks = []
        
        # Same deal consistency
        same_deal_result = consistency_results.get("same_deal_multiple_requests", {})
        if "error" not in same_deal_result:
            consistency_checks.extend([
                same_deal_result.get("deal_name_consistent", False),
                same_deal_result.get("amount_consistent", False),
                same_deal_result.get("id_consistent", False)
            ])
        
        # ID format consistency
        id_format_result = consistency_results.get("id_format_consistency", {})
        if "error" not in id_format_result:
            consistency_checks.extend([
                id_format_result.get("consistent_length", False),
                id_format_result.get("consistent_format", False)
            ])
        
        # Number formatting consistency
        number_format_result = consistency_results.get("number_formatting", {})
        if "error" not in number_format_result:
            consistency_checks.extend([
                number_format_result.get("amount_types_consistent", False),
                number_format_result.get("probability_types_consistent", False)
            ])
        
        consistency_score = (sum(consistency_checks) / len(consistency_checks) * 100) if consistency_checks else 0
        
        return {
            "passed": consistency_score >= 75,
            "details": {
                "consistency_results": consistency_results,
                "consistency_score": consistency_score,
                "passed_checks": sum(consistency_checks),
                "total_checks": len(consistency_checks)
            },
            "warnings": warnings
        }
        
    except Exception as e:
        return {
            "passed": False,
            "details": {"error": str(e)},
            "warnings": []
        }


async def test_pagination_functionality():
    """Test pagination functionality and data integrity"""
    try:
        from app.services.zoho_crm.core.api_client import ZohoAPIClient
        
        api_client = ZohoAPIClient()
        
        pagination_results = {}
        warnings = []
        
        # Test pagination across multiple pages
        fields = "Deal_Name,Amount,Stage"
        per_page = 10
        
        # Get first page
        page1_response = await api_client.get("Deals", params={
            "per_page": per_page,
            "page": 1,
            "fields": fields
        })
        
        if not isinstance(page1_response, dict) or "data" not in page1_response:
            return {
                "passed": False,
                "details": {"error": "Invalid response format for page 1"},
                "warnings": []
            }
        
        page1_deals = page1_response["data"]
        page1_info = page1_response.get("info", {})
        
        pagination_results["page_1"] = {
            "deals_count": len(page1_deals),
            "page_info": page1_info,
            "has_more_records": page1_info.get("more_records", False)
        }
        
        # If there are more records, test second page
        if page1_info.get("more_records", False):
            try:
                page2_response = await api_client.get("Deals", params={
                    "per_page": per_page,
                    "page": 2,
                    "fields": fields
                })
                
                if isinstance(page2_response, dict) and "data" in page2_response:
                    page2_deals = page2_response["data"]
                    page2_info = page2_response.get("info", {})
                    
                    pagination_results["page_2"] = {
                        "deals_count": len(page2_deals),
                        "page_info": page2_info
                    }
                    
                    # Check for duplicate records between pages
                    page1_ids = {deal.get("id") for deal in page1_deals}
                    page2_ids = {deal.get("id") for deal in page2_deals}
                    duplicate_ids = page1_ids.intersection(page2_ids)
                    
                    pagination_results["duplicate_check"] = {
                        "page1_unique_ids": len(page1_ids),
                        "page2_unique_ids": len(page2_ids),
                        "duplicate_ids": list(duplicate_ids),
                        "no_duplicates": len(duplicate_ids) == 0
                    }
                    
                    if duplicate_ids:
                        warnings.append(f"Found {len(duplicate_ids)} duplicate records between pages")
                        
                else:
                    pagination_results["page_2"] = {
                        "error": "Invalid response format for page 2"
                    }
                    warnings.append("Page 2 request failed")
                    
            except Exception as e:
                pagination_results["page_2"] = {
                    "error": str(e)
                }
                warnings.append(f"Page 2 request failed: {str(e)}")
        else:
            pagination_results["page_2"] = {
                "note": "No additional pages available"
            }
        
        # Test page size consistency
        if len(page1_deals) != per_page and page1_info.get("more_records", False):
            warnings.append(f"Page 1 returned {len(page1_deals)} deals, expected {per_page}")
        
        # Calculate pagination score
        pagination_checks = [
            len(page1_deals) > 0,
            "page" in page1_info,
            "per_page" in page1_info,
            pagination_results.get("duplicate_check", {}).get("no_duplicates", True)
        ]
        
        pagination_score = (sum(pagination_checks) / len(pagination_checks)) * 100
        
        return {
            "passed": pagination_score >= 75,
            "details": {
                "pagination_results": pagination_results,
                "pagination_score": pagination_score,
                "passed_checks": sum(pagination_checks),
                "total_checks": len(pagination_checks)
            },
            "warnings": warnings
        }
        
    except Exception as e:
        return {
            "passed": False,
            "details": {"error": str(e)},
            "warnings": []
        }


async def run_data_retrieval_tests(test_suite):
    """Run all data retrieval tests"""
    
    # Define test functions
    tests = [
        (test_deal_data_retrieval, "Deal Data Retrieval", "data_retrieval"),
        (test_field_validation, "Field Validation", "data_retrieval"),
        (test_data_consistency, "Data Consistency", "data_retrieval"),
        (test_pagination_functionality, "Pagination Functionality", "data_retrieval")
    ]
    
    # Run each test
    for test_func, test_name, category in tests:
        await test_suite.run_test(test_func, test_name, category)


# For standalone execution
async def main():
    """Run data retrieval tests standalone"""
    from run_comprehensive_tests import TestSuite
    
    suite = TestSuite(verbose=True)
    await run_data_retrieval_tests(suite)
    suite.print_summary()


if __name__ == "__main__":
    asyncio.run(main())
