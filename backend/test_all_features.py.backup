"""
Comprehensive Backend Feature Testing Script
Tests all API endpoints and infrastructure components
"""
import requests
import json
from typing import Dict, Any, Optional

BASE_URL = "http://localhost:8000"
TEST_EMAIL = "doctor@hospital.com"
TEST_PASSWORD = "doctor123"
TEST_ADMIN_EMAIL = "admin@radiology.com"
TEST_ADMIN_PASSWORD = "admin123"

class BackendTester:
    def __init__(self):
        self.access_token: Optional[str] = None
        self.admin_token: Optional[str] = None
        self.results = {
            "passed": [],
            "failed": [],
            "warnings": []
        }

    def test(self, name: str, func):
        """Run a test and record result"""
        print(f"\n{'='*70}")
        print(f"Testing: {name}")
        print('='*70)
        try:
            func()
            self.results["passed"].append(name)
            print(f"✅ PASSED: {name}")
        except Exception as e:
            self.results["failed"].append(f"{name}: {str(e)}")
            print(f"❌ FAILED: {name}")
            print(f"   Error: {e}")

    def warn(self, message: str):
        """Add a warning"""
        self.results["warnings"].append(message)
        print(f"⚠️  WARNING: {message}")

    # ==================== AUTHENTICATION TESTS ====================

    def test_health_check(self):
        """Test health/status endpoint"""
        resp = requests.get(f"{BASE_URL}/")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"

        data = resp.json()
        print(f"   Status: {data.get('status')}")
        print(f"   Cache enabled: {data.get('cache_enabled')}")
        print(f"   Vector DB enabled: {data.get('vector_db_enabled')}")

        if not data.get('vector_db_enabled'):
            self.warn("Vector DB (Qdrant) is NOT enabled - RAG will not work")

        assert data["status"] in ["online", "ok"], "Backend not healthy"

    def test_login(self):
        """Test user login"""
        resp = requests.post(
            f"{BASE_URL}/api/auth/login",
            data={
                "username": TEST_EMAIL,
                "password": TEST_PASSWORD
            }
        )
        assert resp.status_code == 200, f"Login failed: {resp.status_code} - {resp.text}"

        data = resp.json()
        assert "access_token" in data, "No access token in response"

        self.access_token = data["access_token"]
        print(f"   ✓ Got access token: {self.access_token[:20]}...")

    def test_admin_login(self):
        """Test admin login"""
        resp = requests.post(
            f"{BASE_URL}/api/auth/login",
            data={
                "username": TEST_ADMIN_EMAIL,
                "password": TEST_ADMIN_PASSWORD
            }
        )
        assert resp.status_code == 200, f"Admin login failed: {resp.status_code}"

        data = resp.json()
        self.admin_token = data["access_token"]
        print(f"   ✓ Got admin token")

    def test_get_current_user(self):
        """Test get current user endpoint"""
        if not self.access_token:
            raise Exception("No access token - run login test first")

        resp = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {self.access_token}"}
        )
        assert resp.status_code == 200, f"Failed to get current user: {resp.status_code}"

        data = resp.json()
        print(f"   User: {data.get('full_name')} ({data.get('email')})")
        print(f"   Role: {data.get('role')}")
        print(f"   Hospital: {data.get('hospital_name')}")

    # ==================== TEMPLATE TESTS ====================

    def test_list_templates(self):
        """Test listing templates"""
        if not self.access_token:
            raise Exception("No access token")

        resp = requests.get(
            f"{BASE_URL}/templates",
            headers={"Authorization": f"Bearer {self.access_token}"}
        )
        assert resp.status_code == 200, f"Failed to list templates: {resp.status_code}"

        templates = resp.json()
        print(f"   Found {len(templates)} templates")

        if len(templates) < 5:
            self.warn(f"Only {len(templates)} templates found - run sync_templates.py or load_docx_templates.py")

        for tpl in templates[:5]:
            print(f"   - {tpl['title']} ({tpl['template_id']})")

    def test_get_all_templates_via_api(self):
        """Test new templates API endpoint"""
        if not self.access_token:
            raise Exception("No access token")

        resp = requests.get(
            f"{BASE_URL}/api/templates",
            headers={"Authorization": f"Bearer {self.access_token}"}
        )
        assert resp.status_code == 200, f"Failed: {resp.status_code}"

        templates = resp.json()
        print(f"   Found {len(templates)} templates via new API")

    # ==================== REPORT GENERATION TESTS ====================

    def test_generate_report_basic(self):
        """Test basic report generation"""
        if not self.access_token:
            raise Exception("No access token")

        payload = {
            "input": "Patient with acute chest pain and shortness of breath. Rule out pulmonary embolism.",
            "templateId": "ctpa_pe",
            "use_rag": False,
            "meta": {
                "patient_name": "Test Patient",
                "accession": "TEST-001"
            }
        }

        resp = requests.post(
            f"{BASE_URL}/generate",
            json=payload,
            headers={"Authorization": f"Bearer {self.access_token}"}
        )
        assert resp.status_code == 200, f"Generation failed: {resp.status_code} - {resp.text}"

        data = resp.json()
        print(f"   Template used: {data.get('templateTitle')}")
        print(f"   Report length: {len(data.get('report', ''))} characters")
        print(f"   Report ID saved: {data.get('report_id')}")

        assert len(data.get('report', '')) > 100, "Report too short"

    def test_generate_report_with_rag(self):
        """Test report generation with RAG enabled"""
        if not self.access_token:
            raise Exception("No access token")

        payload = {
            "input": "Patient with acute chest pain and dyspnea, suspected pulmonary embolism",
            "templateId": "auto",
            "use_rag": True,
            "meta": {
                "patient_name": "RAG Test Patient",
                "accession": "RAG-001"
            }
        }

        resp = requests.post(
            f"{BASE_URL}/generate",
            json=payload,
            headers={"Authorization": f"Bearer {self.access_token}"}
        )
        assert resp.status_code == 200, f"RAG generation failed: {resp.status_code}"

        data = resp.json()
        similar_cases = data.get('similar_cases', [])

        print(f"   Template auto-selected: {data.get('templateTitle')}")
        print(f"   Similar cases found: {len(similar_cases)}")

        for i, case in enumerate(similar_cases, 1):
            print(f"   Case {i}: {case.get('case_id')} (score: {case.get('score', 0):.2f})")

        if len(similar_cases) == 0:
            self.warn("RAG returned 0 similar cases - run seed_qdrant.py to populate vector DB")

    # ==================== REPORT HISTORY TESTS ====================

    def test_get_reports(self):
        """Test getting report history"""
        if not self.access_token:
            raise Exception("No access token")

        resp = requests.get(
            f"{BASE_URL}/api/reports",
            headers={"Authorization": f"Bearer {self.access_token}"}
        )
        assert resp.status_code == 200, f"Failed: {resp.status_code}"

        reports = resp.json()
        print(f"   Found {len(reports)} reports")

        for report in reports[:3]:
            print(f"   - {report.get('patient_name')} - {report.get('template_title')}")

    def test_get_report_stats(self):
        """Test getting report statistics"""
        if not self.access_token:
            raise Exception("No access token")

        resp = requests.get(
            f"{BASE_URL}/api/reports/stats",
            headers={"Authorization": f"Bearer {self.access_token}"}
        )
        assert resp.status_code == 200, f"Failed: {resp.status_code}"

        stats = resp.json()
        print(f"   Total reports: {stats.get('total_reports')}")
        print(f"   Today: {stats.get('reports_today')}")
        print(f"   This week: {stats.get('reports_this_week')}")
        print(f"   By modality: {stats.get('by_modality')}")

    # ==================== CUSTOM TEMPLATE TESTS ====================

    def test_create_custom_template(self):
        """Test creating a custom template"""
        if not self.access_token:
            raise Exception("No access token")

        payload = {
            "title": "Test Custom Template",
            "keywords": ["test", "custom", "automation"],
            "skeleton": "Test template skeleton with {patient_name} and {indication}",
            "category": "CT",
            "is_shared": False
        }

        resp = requests.post(
            f"{BASE_URL}/api/templates",
            json=payload,
            headers={"Authorization": f"Bearer {self.access_token}"}
        )
        assert resp.status_code == 201, f"Failed: {resp.status_code} - {resp.text}"

        data = resp.json()
        print(f"   Created template: {data.get('title')}")
        print(f"   Template ID: {data.get('template_id')}")
        print(f"   Is system template: {data.get('is_system_template')}")

    def test_get_my_templates(self):
        """Test getting user's custom templates"""
        if not self.access_token:
            raise Exception("No access token")

        resp = requests.get(
            f"{BASE_URL}/api/templates/my",
            headers={"Authorization": f"Bearer {self.access_token}"}
        )
        assert resp.status_code == 200, f"Failed: {resp.status_code}"

        templates = resp.json()
        print(f"   User has {len(templates)} custom templates")

    # ==================== AI SUGGESTIONS TESTS ====================

    def test_differential_diagnosis(self):
        """Test differential diagnosis suggestions"""
        if not self.access_token:
            raise Exception("No access token")

        payload = {
            "findings": "Large right-sided pleural effusion with associated atelectasis. Mediastinal shift to the left.",
            "modality": "CT",
            "language": "en"
        }

        resp = requests.post(
            f"{BASE_URL}/api/suggestions/differential",
            json=payload,
            headers={"Authorization": f"Bearer {self.access_token}"}
        )
        assert resp.status_code == 200, f"Failed: {resp.status_code} - {resp.text}"

        data = resp.json()
        print(f"   Generated {len(data.get('differentials', []))} differential diagnoses")

        for diff in data.get('differentials', [])[:3]:
            print(f"   - {diff.get('diagnosis')} ({diff.get('probability')})")

    def test_followup_recommendations(self):
        """Test follow-up imaging recommendations"""
        if not self.access_token:
            raise Exception("No access token")

        payload = {
            "findings": "6mm solid pulmonary nodule in right upper lobe",
            "impression": "Solitary pulmonary nodule, indeterminate",
            "modality": "CT",
            "language": "en"
        }

        resp = requests.post(
            f"{BASE_URL}/api/suggestions/followup",
            json=payload,
            headers={"Authorization": f"Bearer {self.access_token}"}
        )
        assert resp.status_code == 200, f"Failed: {resp.status_code}"

        data = resp.json()
        print(f"   Generated {len(data.get('recommendations', []))} recommendations")

        for rec in data.get('recommendations', []):
            print(f"   - {rec.get('study')} in {rec.get('timeframe')}")

    # ==================== INFRASTRUCTURE TESTS ====================

    def test_cache_functionality(self):
        """Test if caching is working"""
        print("   Testing cache by making duplicate request...")

        # First request
        import time
        start = time.time()
        self.test_generate_report_basic()
        first_time = time.time() - start

        # Second identical request (should be cached)
        start = time.time()
        self.test_generate_report_basic()
        second_time = time.time() - start

        print(f"   First request: {first_time:.2f}s")
        print(f"   Second request: {second_time:.2f}s")

        if second_time < first_time * 0.5:
            print(f"   ✓ Cache appears to be working (2nd request {second_time/first_time*100:.0f}% of first)")
        else:
            self.warn("Cache may not be working effectively")

    # ==================== RUN ALL TESTS ====================

    def run_all_tests(self):
        """Run all tests in order"""
        print("\n" + "="*70)
        print("RADIOLOGY RAG BACKEND - COMPREHENSIVE FEATURE TEST")
        print("="*70)

        # Authentication
        self.test("Health Check", self.test_health_check)
        self.test("User Login", self.test_login)
        self.test("Admin Login", self.test_admin_login)
        self.test("Get Current User", self.test_get_current_user)

        # Templates
        self.test("List Templates (Legacy)", self.test_list_templates)
        self.test("List Templates (New API)", self.test_get_all_templates_via_api)

        # Report Generation
        self.test("Generate Report (Basic)", self.test_generate_report_basic)
        self.test("Generate Report (with RAG)", self.test_generate_report_with_rag)

        # Report History
        self.test("Get Report History", self.test_get_reports)
        self.test("Get Report Statistics", self.test_get_report_stats)

        # Custom Templates
        self.test("Create Custom Template", self.test_create_custom_template)
        self.test("Get My Templates", self.test_get_my_templates)

        # AI Suggestions
        self.test("Differential Diagnosis AI", self.test_differential_diagnosis)
        self.test("Follow-up Recommendations AI", self.test_followup_recommendations)

        # Infrastructure
        # self.test("Cache Functionality", self.test_cache_functionality)

        # Print summary
        self.print_summary()

    def print_summary(self):
        """Print test results summary"""
        print("\n" + "="*70)
        print("TEST SUMMARY")
        print("="*70)

        total = len(self.results["passed"]) + len(self.results["failed"])
        passed = len(self.results["passed"])

        print(f"\n✅ PASSED: {passed}/{total} tests ({passed/total*100:.0f}%)")
        for test in self.results["passed"]:
            print(f"   ✓ {test}")

        if self.results["failed"]:
            print(f"\n❌ FAILED: {len(self.results['failed'])} tests")
            for test in self.results["failed"]:
                print(f"   ✗ {test}")

        if self.results["warnings"]:
            print(f"\n⚠️  WARNINGS: {len(self.results['warnings'])}")
            for warning in self.results["warnings"]:
                print(f"   ! {warning}")

        print("\n" + "="*70)

        if len(self.results["failed"]) == 0:
            print("🎉 ALL TESTS PASSED! Backend is fully functional!")
        else:
            print("⚠️  Some tests failed. Check the errors above.")

        print("="*70 + "\n")

if __name__ == "__main__":
    tester = BackendTester()
    tester.run_all_tests()
