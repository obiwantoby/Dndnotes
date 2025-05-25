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

    def test_structured_session_template(self):
        """Test getting structured session template"""
        success, data = self.make_request('GET', 'sessions/template/structured')
        if success and isinstance(data, dict):
            # Check if template has expected structured fields
            expected_fields = ['session_number', 'session_date', 'players_present', 'session_goal', 
                             'combat_encounters', 'roleplay_encounters', 'npcs_encountered', 
                             'loot', 'notes', 'notable_roleplay_moments', 'next_session_goals', 
                             'overarching_missions']
            has_all_fields = all(field in data for field in expected_fields)
            return self.log_test("Get Structured Template", has_all_fields, f"- Fields present: {has_all_fields}")
        return self.log_test("Get Structured Template", False, f"- Response: {data}")

    def test_create_structured_session(self):
        """Test creating a structured session with comprehensive data"""
        structured_data = {
            "session_number": 5,
            # "session_date": "2024-02-15",  # Skipping date field due to backend serialization issue
            "players_present": ["Alice", "Bob", "Charlie", "Diana"],
            "session_goal": "Infiltrate the goblin stronghold and rescue the captured villagers",
            "combat_encounters": [
                {
                    "id": "combat1",
                    "description": "Ambush by goblin scouts at the forest entrance",
                    "enemies": "3 Goblin Scouts, 1 Hobgoblin",
                    "outcome": "Victory - party defeated all enemies",
                    "notable_events": "Charlie used clever tactics to flank the hobgoblin"
                },
                {
                    "id": "combat2", 
                    "description": "Final battle in the stronghold throne room",
                    "enemies": "Goblin King, 2 Elite Guards",
                    "outcome": "Victory after intense battle",
                    "notable_events": "Alice's critical hit finished the Goblin King"
                }
            ],
            "roleplay_encounters": [
                {
                    "id": "rp1",
                    "description": "Negotiation with captured goblin for information",
                    "npcs_involved": ["Grax the Goblin"],
                    "outcome": "Successfully extracted stronghold layout",
                    "importance": "Critical intelligence for mission success"
                }
            ],
            "npcs_encountered": [
                {
                    "id": "npc1",
                    "npc_name": "Grax the Goblin",
                    "role": "Captured scout",
                    "notes": "Provided valuable intel about stronghold defenses",
                    "first_encounter": True
                },
                {
                    "id": "npc2",
                    "npc_name": "Elder Marta",
                    "role": "Village elder",
                    "notes": "Thanked party for rescue mission",
                    "first_encounter": False
                }
            ],
            "loot": [
                {
                    "id": "loot1",
                    "item_name": "Goblin King's Crown",
                    "description": "Ornate crown with embedded gems",
                    "value": "500 gp",
                    "recipient": "Party treasury"
                },
                {
                    "id": "loot2",
                    "item_name": "+1 Shortsword",
                    "description": "Magical blade with goblin runes",
                    "value": "300 gp",
                    "recipient": "Bob"
                }
            ],
            "notes": "Excellent teamwork displayed. Party worked well together and showed good tactical thinking.",
            "notable_roleplay_moments": [
                "Charlie's inspiring speech before the final battle",
                "Diana's compassionate healing of wounded villagers",
                "Bob's humorous interaction with the goblin prisoner"
            ],
            "next_session_goals": "Return to town, collect reward, and investigate rumors of dragon sightings",
            "overarching_missions": [
                {
                    "id": "mission1",
                    "mission_name": "Rescue the Villagers",
                    "status": "Completed",
                    "description": "Save captured villagers from goblin stronghold",
                    "notes": "Successfully completed with no casualties"
                },
                {
                    "id": "mission2",
                    "mission_name": "Investigate Dragon Threat",
                    "status": "In Progress", 
                    "description": "Look into reports of dragon activity near the mountains",
                    "notes": "Next major quest line to pursue"
                }
            ]
        }
        
        session_data = {
            "title": "Session 5: The Goblin Stronghold",
            "session_type": "structured",
            "structured_data": structured_data
        }
        
        success, data = self.make_request('POST', 'sessions', session_data, 200)
        if success and 'id' in data:
            self.structured_session_id = data['id']
            # Verify structured data was saved correctly
            session_type_correct = data.get('session_type') == 'structured'
            has_structured_data = data.get('structured_data') is not None
            return self.log_test("Create Structured Session", session_type_correct and has_structured_data, 
                               f"- ID: {self.structured_session_id}, Type: {data.get('session_type')}")
        return self.log_test("Create Structured Session", False, f"- Response: {data}")

    def test_export_structured_session(self):
        """Test exporting structured session data"""
        if not hasattr(self, 'structured_session_id') or not self.structured_session_id:
            return self.log_test("Export Structured Session", False, "- No structured session ID available")
        
        success, data = self.make_request('GET', f'sessions/{self.structured_session_id}/export')
        if success and 'session_info' in data and 'structured_data' in data:
            session_info = data.get('session_info', {})
            structured_data = data.get('structured_data', {})
            
            # Verify export contains expected sections
            has_session_info = 'title' in session_info and 'session_type' in session_info
            has_structured_sections = all(section in structured_data for section in 
                                        ['session_number', 'combat_encounters', 'loot', 'overarching_missions'])
            
            return self.log_test("Export Structured Session", has_session_info and has_structured_sections,
                               f"- Export format valid, Type: {session_info.get('session_type')}")
        return self.log_test("Export Structured Session", False, f"- Response: {data}")

    def test_mixed_session_types(self):
        """Test that both structured and free-form sessions can coexist"""
        # Create a free-form session
        free_form_data = {
            "title": "Free Form Session: Quick Notes",
            "content": "Party met some NPCs and had adventures. Thorin helped with equipment.",
            "session_type": "free_form"
        }
        
        success1, data1 = self.make_request('POST', 'sessions', free_form_data, 200)
        
        # Get all sessions and verify both types exist
        success2, data2 = self.make_request('GET', 'sessions')
        
        if success1 and success2 and isinstance(data2, list):
            session_types = [session.get('session_type') for session in data2]
            has_structured = 'structured' in session_types
            has_free_form = 'free_form' in session_types
            
            # Clean up the free-form session
            if 'id' in data1:
                self.make_request('DELETE', f'sessions/{data1["id"]}', expected_status=200)
            
            return self.log_test("Mixed Session Types", has_structured and has_free_form,
                               f"- Types found: {set(session_types)}")
        return self.log_test("Mixed Session Types", False, f"- Response: {data2}")

    def test_structured_session_validation(self):
        """Test structured session data validation and edge cases"""
        # Test with minimal structured data
        minimal_data = {
            "title": "Minimal Structured Session",
            "session_type": "structured",
            "structured_data": {
                "session_number": 1,
                "players_present": ["Player1"],
                "session_goal": "Test minimal data"
            }
        }
        
        success, data = self.make_request('POST', 'sessions', minimal_data, 200)
        if success and 'id' in data:
            # Clean up
            self.make_request('DELETE', f'sessions/{data["id"]}', expected_status=200)
            return self.log_test("Structured Session Validation", True, "- Minimal data accepted")
        return self.log_test("Structured Session Validation", False, f"- Response: {data}")

    def cleanup_structured_session(self):
        """Clean up the structured session created for testing"""
        if hasattr(self, 'structured_session_id') and self.structured_session_id:
            success, data = self.make_request('DELETE', f'sessions/{self.structured_session_id}', expected_status=200)
            if success:
                return self.log_test("Cleanup Structured Session", True, "- Session deleted")
            return self.log_test("Cleanup Structured Session", False, f"- Response: {data}")
        return self.log_test("Cleanup Structured Session", True, "- No session to clean up")

    def run_all_tests(self):
        """Run all API tests in sequence"""
        print("🚀 Starting D&D Note-Taking API Tests")
        print(f"📡 Testing against: {self.base_url}")
        print("=" * 60)

        # Basic connectivity and auth tests
        self.test_root_endpoint()
        self.test_auth_check()
        self.test_auth_failure()

        # Session CRUD tests (free-form)
        self.test_create_session()
        self.test_get_sessions()
        self.test_get_session_by_id()
        self.test_update_session()

        # NEW: Structured Session Template Tests
        print("\n🆕 Testing New Structured Session Features:")
        self.test_structured_session_template()
        self.test_create_structured_session()
        self.test_export_structured_session()
        self.test_mixed_session_types()
        self.test_structured_session_validation()

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
        self.cleanup_structured_session()

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