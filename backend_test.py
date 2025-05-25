#!/usr/bin/env python3
"""
Backend API Testing Script for D&D Note-Taking Application
Tests all CRUD operations and core functionality
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

class DDNoteAPITester:
    def __init__(self, base_url: str = "https://18b4df16-5a9e-4b05-bd8d-feae6b4f3299.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.auth = ("admin", "admin")
        self.tests_run = 0
        self.tests_passed = 0
        self.session_id = None
        self.npc_id = None

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}: PASSED {details}")
        else:
            print(f"❌ {name}: FAILED {details}")
        return success

    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, expected_status: int = 200) -> tuple[bool, Dict]:
        """Make HTTP request and return success status and response data"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        try:
            if method == 'GET':
                response = requests.get(url, auth=self.auth, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, auth=self.auth, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, auth=self.auth, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, auth=self.auth, headers=headers, timeout=10)
            else:
                return False, {"error": f"Unsupported method: {method}"}

            success = response.status_code == expected_status
            try:
                response_data = response.json() if response.content else {}
            except:
                response_data = {"raw_response": response.text}
                
            if not success:
                response_data["status_code"] = response.status_code
                response_data["expected_status"] = expected_status
                
            return success, response_data
            
        except Exception as e:
            return False, {"error": str(e)}

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        success, data = self.make_request('GET', '')
        return self.log_test("Root API Endpoint", success, f"- {data.get('message', 'No message')}")

    def test_auth_check(self):
        """Test authentication endpoint"""
        success, data = self.make_request('GET', 'auth/check')
        auth_valid = success and data.get('authenticated') == True and data.get('username') == 'admin'
        return self.log_test("Authentication Check", auth_valid, f"- User: {data.get('username', 'None')}")

    def test_auth_failure(self):
        """Test authentication failure with wrong credentials"""
        url = f"{self.api_url}/auth/check"
        try:
            response = requests.get(url, auth=("wrong", "credentials"), timeout=10)
            success = response.status_code == 401
            return self.log_test("Authentication Failure", success, f"- Status: {response.status_code}")
        except Exception as e:
            return self.log_test("Authentication Failure", False, f"- Error: {str(e)}")

    def test_create_session(self):
        """Test creating a new session"""
        session_data = {
            "title": "Test Session 1: The Tavern",
            "content": "The party entered the tavern and met Thorin the Blacksmith. He was a gruff dwarf with a magnificent beard."
        }
        success, data = self.make_request('POST', 'sessions', session_data, 200)
        if success and 'id' in data:
            self.session_id = data['id']
            return self.log_test("Create Session", True, f"- ID: {self.session_id}")
        return self.log_test("Create Session", False, f"- Response: {data}")

    def test_get_sessions(self):
        """Test retrieving all sessions"""
        success, data = self.make_request('GET', 'sessions')
        if success and isinstance(data, list):
            return self.log_test("Get Sessions", True, f"- Count: {len(data)}")
        return self.log_test("Get Sessions", False, f"- Response: {data}")

    def test_get_session_by_id(self):
        """Test retrieving a specific session"""
        if not self.session_id:
            return self.log_test("Get Session by ID", False, "- No session ID available")
        
        success, data = self.make_request('GET', f'sessions/{self.session_id}')
        if success and data.get('id') == self.session_id:
            return self.log_test("Get Session by ID", True, f"- Title: {data.get('title', 'No title')}")
        return self.log_test("Get Session by ID", False, f"- Response: {data}")

    def test_update_session(self):
        """Test updating a session"""
        if not self.session_id:
            return self.log_test("Update Session", False, "- No session ID available")
        
        update_data = {
            "content": "Updated content: The party entered the tavern and met Thorin the Blacksmith and Elara the Barmaid."
        }
        success, data = self.make_request('PUT', f'sessions/{self.session_id}', update_data)
        if success and 'updated_at' in data:
            return self.log_test("Update Session", True, f"- Updated at: {data.get('updated_at')}")
        return self.log_test("Update Session", False, f"- Response: {data}")

    def test_create_npc(self):
        """Test creating a new NPC"""
        npc_data = {
            "name": "Thorin the Blacksmith",
            "status": "Alive",
            "race": "Dwarf",
            "class_role": "Blacksmith",
            "appearance": "A gruff dwarf with a magnificent beard and strong arms from years of smithing.",
            "quirks_mannerisms": "Always wipes his hands on his leather apron when nervous.",
            "background": "Master blacksmith who has served the town for over 30 years.",
            "notes": "Friendly to adventurers, offers weapon repairs at fair prices."
        }
        success, data = self.make_request('POST', 'npcs', npc_data, 200)
        if success and 'id' in data:
            self.npc_id = data['id']
            return self.log_test("Create NPC", True, f"- ID: {self.npc_id}, Name: {data.get('name')}")
        return self.log_test("Create NPC", False, f"- Response: {data}")

    def test_get_npcs(self):
        """Test retrieving all NPCs"""
        success, data = self.make_request('GET', 'npcs')
        if success and isinstance(data, list):
            return self.log_test("Get NPCs", True, f"- Count: {len(data)}")
        return self.log_test("Get NPCs", False, f"- Response: {data}")

    def test_get_npc_by_id(self):
        """Test retrieving a specific NPC"""
        if not self.npc_id:
            return self.log_test("Get NPC by ID", False, "- No NPC ID available")
        
        success, data = self.make_request('GET', f'npcs/{self.npc_id}')
        if success and data.get('id') == self.npc_id:
            return self.log_test("Get NPC by ID", True, f"- Name: {data.get('name', 'No name')}")
        return self.log_test("Get NPC by ID", False, f"- Response: {data}")

    def test_update_npc(self):
        """Test updating an NPC"""
        if not self.npc_id:
            return self.log_test("Update NPC", False, "- No NPC ID available")
        
        update_data = {
            "background": "Master blacksmith who has served the town for over 30 years. Recently started training an apprentice."
        }
        success, data = self.make_request('PUT', f'npcs/{self.npc_id}', update_data)
        if success and 'updated_at' in data:
            return self.log_test("Update NPC", True, f"- Updated at: {data.get('updated_at')}")
        return self.log_test("Update NPC", False, f"- Response: {data}")

    def test_extract_npc(self):
        """Test NPC extraction functionality"""
        if not self.session_id:
            return self.log_test("Extract NPC", False, "- No session ID available")
        
        extraction_data = {
            "session_id": self.session_id,
            "extracted_text": "Elara the Barmaid served drinks to the party",
            "npc_name": "Elara the Barmaid"
        }
        success, data = self.make_request('POST', 'extract-npc', extraction_data)
        if success and 'action' in data and 'npc' in data:
            action = data.get('action')
            npc_name = data.get('npc', {}).get('name', 'Unknown')
            return self.log_test("Extract NPC", True, f"- Action: {action}, NPC: {npc_name}")
        return self.log_test("Extract NPC", False, f"- Response: {data}")

    def test_suggest_npcs(self):
        """Test NPC suggestion functionality"""
        text_data = {
            "text": "The party met Gandalf the Wizard and Aragorn the Ranger at the inn. They discussed the quest with Frodo Baggins."
        }
        success, data = self.make_request('POST', 'suggest-npcs', text_data)
        if success and 'suggested_npcs' in data:
            suggestions = data.get('suggested_npcs', [])
            return self.log_test("Suggest NPCs", True, f"- Suggestions: {len(suggestions)} found: {suggestions}")
        return self.log_test("Suggest NPCs", False, f"- Response: {data}")

    def test_delete_npc(self):
        """Test deleting an NPC"""
        if not self.npc_id:
            return self.log_test("Delete NPC", False, "- No NPC ID available")
        
        success, data = self.make_request('DELETE', f'npcs/{self.npc_id}', expected_status=200)
        if success and 'message' in data:
            return self.log_test("Delete NPC", True, f"- {data.get('message')}")
        return self.log_test("Delete NPC", False, f"- Response: {data}")

    def test_delete_session(self):
        """Test deleting a session"""
        if not self.session_id:
            return self.log_test("Delete Session", False, "- No session ID available")
        
        success, data = self.make_request('DELETE', f'sessions/{self.session_id}', expected_status=200)
        if success and 'message' in data:
            return self.log_test("Delete Session", True, f"- {data.get('message')}")
        return self.log_test("Delete Session", False, f"- Response: {data}")

    def run_all_tests(self):
        """Run all API tests in sequence"""
        print("🚀 Starting D&D Note-Taking API Tests")
        print(f"📡 Testing against: {self.base_url}")
        print("=" * 60)

        # Basic connectivity and auth tests
        self.test_root_endpoint()
        self.test_auth_check()
        self.test_auth_failure()

        # Session CRUD tests
        self.test_create_session()
        self.test_get_sessions()
        self.test_get_session_by_id()
        self.test_update_session()

        # NPC CRUD tests
        self.test_create_npc()
        self.test_get_npcs()
        self.test_get_npc_by_id()
        self.test_update_npc()

        # Advanced functionality tests
        self.test_extract_npc()
        self.test_suggest_npcs()

        # Cleanup tests
        self.test_delete_npc()
        self.test_delete_session()

        # Print summary
        print("=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed! Backend API is working correctly.")
            return 0
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed. Check the issues above.")
            return 1

def main():
    """Main function to run the tests"""
    tester = DDNoteAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())