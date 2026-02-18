import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any

class CareerFlowAPITester:
    def __init__(self):
        self.base_url = "https://career-compass-756.preview.emergentagent.com"
        self.token = None
        self.test_user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name: str, success: bool, response_data: Dict[Any, Any] = None, error: str = None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test": name,
            "success": success,
            "response": response_data if success else None,
            "error": error if not success else None
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if error:
            print(f"    Error: {error}")

    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, data=None, headers=None) -> tuple:
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        
        # Default headers
        test_headers = {'Content-Type': 'application/json'}
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            response_data = {}
            
            try:
                response_data = response.json() if response.content else {}
            except:
                response_data = {"raw_response": response.text}

            if success:
                self.log_test(name, True, response_data)
                return True, response_data
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}. Response: {response_data}"
                self.log_test(name, False, error=error_msg)
                return False, response_data

        except Exception as e:
            error_msg = f"Request failed: {str(e)}"
            self.log_test(name, False, error=error_msg)
            return False, {}

    def test_auth_endpoints(self):
        """Test authentication endpoints"""
        print("\n🔐 Testing Authentication...")
        
        # Test existing user login (mentioned in review request)
        success, response = self.run_test(
            "Login with existing test user",
            "POST",
            "auth/login",
            200,
            data={"email": "testuser@demo.com", "password": "password123"}
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"    ✓ Token obtained successfully")
        
        # Test /auth/me endpoint
        if self.token:
            self.run_test(
                "Get current user info",
                "GET", 
                "auth/me",
                200
            )

        # Test registration with new user
        timestamp = datetime.now().strftime("%H%M%S")
        new_user_email = f"newuser_{timestamp}@test.com"
        
        success, response = self.run_test(
            "Register new user",
            "POST",
            "auth/register", 
            200,
            data={
                "email": new_user_email,
                "password": "testpass123",
                "name": f"Test User {timestamp}"
            }
        )

    def test_jobs_endpoints(self):
        """Test job management endpoints"""
        print("\n💼 Testing Jobs API...")
        
        if not self.token:
            print("❌ No auth token available, skipping jobs tests")
            return

        # Get existing jobs
        success, jobs_response = self.run_test(
            "Get all jobs",
            "GET",
            "jobs",
            200
        )

        # Create a new job
        job_data = {
            "title": "Software Engineer Test",
            "company": "Test Company Inc",
            "posting_url": "https://example.com/job",
            "description": "Test job description",
            "pay": "$80k - $120k",
            "work_auth": "No sponsorship",
            "location": "Remote",
            "status": "pending",
            "notes": "Test job created by automated test"
        }

        success, create_response = self.run_test(
            "Create new job",
            "POST",
            "jobs",
            200,
            data=job_data
        )

        created_job_id = None
        if success and 'id' in create_response:
            created_job_id = create_response['id']

        # Get specific job
        if created_job_id:
            self.run_test(
                "Get specific job",
                "GET",
                f"jobs/{created_job_id}",
                200
            )

            # Update job status
            update_data = job_data.copy()
            update_data['status'] = 'applied'
            update_data['notes'] = 'Updated by automated test'
            
            self.run_test(
                "Update job",
                "PUT",
                f"jobs/{created_job_id}",
                200,
                data=update_data
            )

            # Delete job (cleanup)
            self.run_test(
                "Delete job",
                "DELETE", 
                f"jobs/{created_job_id}",
                200
            )

    def test_analytics_endpoint(self):
        """Test analytics endpoints"""
        print("\n📊 Testing Analytics API...")
        
        if not self.token:
            print("❌ No auth token available, skipping analytics tests")
            return

        self.run_test(
            "Get dashboard analytics",
            "GET",
            "analytics/dashboard", 
            200
        )

    def test_llm_config_endpoints(self):
        """Test LLM configuration endpoints"""
        print("\n🤖 Testing LLM Config API...")
        
        if not self.token:
            print("❌ No auth token available, skipping LLM config tests")
            return

        # Get current LLM config
        self.run_test(
            "Get LLM config",
            "GET",
            "llm-config",
            200
        )

        # Create/Update LLM config
        config_data = {
            "provider": "openai",
            "model": "gpt-3.5-turbo",
            "api_key": "test-api-key-placeholder",
            "base_url": ""
        }

        self.run_test(
            "Create/Update LLM config",
            "POST",
            "llm-config",
            200,
            data=config_data
        )

    def test_companies_endpoints(self):
        """Test companies endpoints"""
        print("\n🏢 Testing Companies API...")
        
        if not self.token:
            print("❌ No auth token available, skipping companies tests")
            return

        # Get companies
        self.run_test(
            "Get all companies",
            "GET",
            "companies",
            200
        )

        # Create company
        company_data = {
            "name": "Test Company Ltd",
            "about": "Test company for automated testing",
            "stem_support": True,
            "visa_sponsor": True,
            "employee_count": "100-500"
        }

        success, create_response = self.run_test(
            "Create company",
            "POST",
            "companies",
            200,
            data=company_data
        )

        # Cleanup - delete created company
        if success and 'id' in create_response:
            company_id = create_response['id']
            self.run_test(
                "Delete company",
                "DELETE",
                f"companies/{company_id}",
                200
            )

    def test_root_endpoint(self):
        """Test root API endpoint"""
        print("\n🏠 Testing Root Endpoint...")
        
        self.run_test(
            "API root endpoint",
            "GET",
            "",
            200
        )

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting CareerFlow API Tests...")
        print(f"Base URL: {self.base_url}")
        
        # Test in logical order
        self.test_root_endpoint()
        self.test_auth_endpoints()
        self.test_jobs_endpoints()
        self.test_analytics_endpoint()
        self.test_llm_config_endpoints()
        self.test_companies_endpoints()
        
        # Print summary
        print(f"\n📋 Test Summary:")
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test runner"""
    tester = CareerFlowAPITester()
    all_passed = tester.run_all_tests()
    
    # Save detailed results
    with open('/app/test_reports/backend_api_results.json', 'w') as f:
        json.dump({
            'summary': {
                'total_tests': tester.tests_run,
                'passed': tester.tests_passed,
                'failed': tester.tests_run - tester.tests_passed,
                'success_rate': (tester.tests_passed/tester.tests_run)*100 if tester.tests_run > 0 else 0
            },
            'detailed_results': tester.test_results,
            'timestamp': datetime.now().isoformat()
        }, indent=2)
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())