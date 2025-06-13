
import requests
import sys
import json
from datetime import datetime

class EmergencyPlatformTester:
    def __init__(self, base_url):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status=200, expected_data=None, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            
            # Check status code
            status_success = response.status_code == expected_status
            if status_success:
                print(f"✅ Status: {response.status_code} (Expected: {expected_status})")
            else:
                print(f"❌ Status: {response.status_code} (Expected: {expected_status})")
                self.test_results.append({
                    "name": name,
                    "success": False,
                    "error": f"Expected status {expected_status}, got {response.status_code}"
                })
                return False, None
            
            # Parse response data
            try:
                response_data = response.json()
            except json.JSONDecodeError:
                print(f"❌ Failed to parse JSON response")
                self.test_results.append({
                    "name": name,
                    "success": False,
                    "error": "Failed to parse JSON response"
                })
                return False, None
            
            # Check expected data if provided
            data_success = True
            if expected_data:
                for key, value in expected_data.items():
                    if key not in response_data:
                        print(f"❌ Expected key '{key}' not found in response")
                        data_success = False
                    elif isinstance(value, int) and response_data[key] != value:
                        print(f"❌ Expected '{key}' to be {value}, got {response_data[key]}")
                        data_success = False
                    elif isinstance(value, list) and len(response_data[key]) != value:
                        print(f"❌ Expected '{key}' to have length {value}, got {len(response_data[key])}")
                        data_success = False
            
            if data_success:
                self.tests_passed += 1
                self.test_results.append({
                    "name": name,
                    "success": True
                })
                return True, response_data
            else:
                self.test_results.append({
                    "name": name,
                    "success": False,
                    "error": "Response data did not match expected values"
                })
                return False, response_data
                
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.test_results.append({
                "name": name,
                "success": False,
                "error": str(e)
            })
            return False, None

    def test_health_endpoint(self):
        """Test the health endpoint"""
        success, data = self.run_test(
            "Health Endpoint",
            "GET",
            "api/health",
            200,
            {"status": "healthy"}
        )
        if success:
            print("✅ Health endpoint returned healthy status")
        return success

    def test_resources_endpoint(self):
        """Test the resources endpoint"""
        success, data = self.run_test(
            "Resources Endpoint",
            "GET",
            "api/resources",
            200
        )
        if success:
            resource_count = len(data.get("resources", []))
            print(f"✅ Resources endpoint returned {resource_count} resources")
            if resource_count == 23:
                print("✅ Expected 23 resources, got 23")
            else:
                print(f"❌ Expected 23 resources, got {resource_count}")
                success = False
        return success

    def test_resources_filtering(self):
        """Test resource filtering by type"""
        # Test generator filter
        success_generator, data_generator = self.run_test(
            "Resources Filtering - Generators",
            "GET",
            "api/resources?type=generator",
            200
        )
        if success_generator:
            generator_count = len(data_generator.get("resources", []))
            print(f"✅ Generator filter returned {generator_count} resources")
            all_generators = all(r["type"] == "generator" for r in data_generator.get("resources", []))
            if all_generators:
                print("✅ All returned resources are generators")
            else:
                print("❌ Some returned resources are not generators")
                success_generator = False
        
        # Test medical filter
        success_medical, data_medical = self.run_test(
            "Resources Filtering - Medical",
            "GET",
            "api/resources?type=medical",
            200
        )
        if success_medical:
            medical_count = len(data_medical.get("resources", []))
            print(f"✅ Medical filter returned {medical_count} resources")
            all_medical = all(r["type"] == "medical" for r in data_medical.get("resources", []))
            if all_medical:
                print("✅ All returned resources are medical facilities")
            else:
                print("❌ Some returned resources are not medical facilities")
                success_medical = False
        
        return success_generator and success_medical

    def test_statistics_endpoint(self):
        """Test the statistics endpoint"""
        success, data = self.run_test(
            "Statistics Endpoint",
            "GET",
            "api/statistics",
            200
        )
        if success:
            print(f"✅ Statistics endpoint returned data: {data}")
            # Check if all required fields are present
            required_fields = ["total_resources", "active_resources", "open_incidents", "active_outages"]
            all_fields_present = all(field in data for field in required_fields)
            if all_fields_present:
                print("✅ All required statistics fields are present")
            else:
                print("❌ Some required statistics fields are missing")
                success = False
        return success

    def test_incidents_endpoint(self):
        """Test the incidents endpoint"""
        success, data = self.run_test(
            "Incidents Endpoint",
            "GET",
            "api/incidents",
            200
        )
        if success:
            incident_count = len(data.get("incidents", []))
            print(f"✅ Incidents endpoint returned {incident_count} incidents")
        return success

    def test_power_outages_endpoint(self):
        """Test the power outages endpoint"""
        success, data = self.run_test(
            "Power Outages Endpoint",
            "GET",
            "api/power-outages",
            200
        )
        if success:
            outage_count = len(data.get("outages", []))
            print(f"✅ Power outages endpoint returned {outage_count} outages")
            if outage_count == 2:
                print("✅ Expected 2 power outages, got 2")
            else:
                print(f"❌ Expected 2 power outages, got {outage_count}")
                success = False
        return success

    def test_resource_creation(self):
        """Test creating a new resource"""
        test_resource = {
            "name": "Test Generator",
            "name_he": "גנרטור בדיקה",
            "type": "generator",
            "lat": 32.1234,
            "lng": 34.8765,
            "status": "active",
            "capacity": 200,
            "description": "Test resource for API testing",
            "description_he": "משאב בדיקה לבדיקת ה-API",
            "contact_phone": "03-1234567",
            "priority": "medium"
        }
        
        success, data = self.run_test(
            "Resource Creation",
            "POST",
            "api/resources",
            200,
            None,
            test_resource
        )
        
        if success and data:
            print(f"✅ Resource created successfully with ID: {data.get('id')}")
            # Verify the resource was created with the correct data
            for key, value in test_resource.items():
                if key in data and data[key] == value:
                    print(f"✅ Field '{key}' matches expected value")
                elif key in data:
                    print(f"❌ Field '{key}' has value '{data[key]}', expected '{value}'")
                    success = False
                else:
                    print(f"❌ Field '{key}' missing from response")
                    success = False
        
        return success

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Emergency Platform API Tests")
        print(f"🔗 Base URL: {self.base_url}")
        print("=" * 50)
        
        # Run all tests
        tests = [
            self.test_health_endpoint,
            self.test_resources_endpoint,
            self.test_resources_filtering,
            self.test_statistics_endpoint,
            self.test_incidents_endpoint,
            self.test_power_outages_endpoint,
            self.test_resource_creation
        ]
        
        for test in tests:
            test()
            print("-" * 50)
        
        # Print summary
        print("\n📊 Test Summary:")
        print(f"Total tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"Success rate: {success_rate:.2f}%")
        
        # Print failed tests
        failed_tests = [test for test in self.test_results if not test["success"]]
        if failed_tests:
            print("\n❌ Failed Tests:")
            for test in failed_tests:
                print(f"- {test['name']}: {test.get('error', 'Unknown error')}")
        
        return self.tests_passed == self.tests_run

def main():
    # Get the backend URL from the frontend .env file
    backend_url = "https://e8574774-3a3b-4483-8674-9eeb12dfd291.preview.emergentagent.com"
    
    # Create tester instance
    tester = EmergencyPlatformTester(backend_url)
    
    # Run all tests
    success = tester.run_all_tests()
    
    # Return exit code based on test results
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
