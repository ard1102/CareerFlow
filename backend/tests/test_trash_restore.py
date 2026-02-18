"""
Test trash, soft-delete, and restore functionality for CareerFlow
Tests: GET /api/trash, POST /api/trash/restore/{type}/{id}, DELETE /api/trash/{type}/{id}
Also tests soft-delete: DELETE /api/jobs/{id}, DELETE /api/companies/{id}, etc.
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture(scope="module")
def auth_token():
    """Get auth token for test user"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "pdftest@test.com",
        "password": "test123"
    })
    if response.status_code == 200:
        return response.json()["access_token"]
    pytest.fail(f"Authentication failed: {response.text}")

@pytest.fixture
def api_client(auth_token):
    """Shared requests session with auth header"""
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {auth_token}"
    })
    return session


class TestSoftDeleteJob:
    """Test soft-delete for jobs moves item to trash instead of hard delete"""
    
    def test_create_job_then_soft_delete(self, api_client):
        # Create a test job
        job_data = {
            "title": f"TEST_SoftDelete_Job_{uuid.uuid4().hex[:8]}",
            "company": "TEST_DeleteTestCo",
            "status": "pending",
            "notes": "Test job for soft delete"
        }
        create_response = api_client.post(f"{BASE_URL}/api/jobs", json=job_data)
        assert create_response.status_code == 200, f"Create job failed: {create_response.text}"
        
        job = create_response.json()
        job_id = job["id"]
        assert job["title"] == job_data["title"]
        assert job.get("is_deleted") in [False, None]
        
        # Soft delete the job
        delete_response = api_client.delete(f"{BASE_URL}/api/jobs/{job_id}")
        assert delete_response.status_code == 200, f"Delete job failed: {delete_response.text}"
        
        delete_data = delete_response.json()
        assert "trash" in delete_data.get("message", "").lower()
        assert delete_data.get("can_undo") == True
        
        # Verify job no longer in regular GET /jobs (filtered out)
        jobs_response = api_client.get(f"{BASE_URL}/api/jobs")
        assert jobs_response.status_code == 200
        jobs = jobs_response.json()
        job_ids = [j["id"] for j in jobs]
        assert job_id not in job_ids, "Soft-deleted job should not appear in regular job list"
        
        # Verify job appears in trash
        trash_response = api_client.get(f"{BASE_URL}/api/trash")
        assert trash_response.status_code == 200
        
        trash = trash_response.json()
        trash_job_ids = [j["id"] for j in trash.get("jobs", [])]
        assert job_id in trash_job_ids, "Soft-deleted job should appear in trash"
        
        # Clean up: permanently delete
        cleanup_response = api_client.delete(f"{BASE_URL}/api/trash/job/{job_id}")
        assert cleanup_response.status_code == 200


class TestSoftDeleteCompany:
    """Test soft-delete for companies"""
    
    def test_create_company_then_soft_delete(self, api_client):
        # Create a test company
        company_data = {
            "name": f"TEST_SoftDelete_Company_{uuid.uuid4().hex[:8]}",
            "about": "Test company for soft delete",
            "visa_sponsor": True,
            "stem_support": True
        }
        create_response = api_client.post(f"{BASE_URL}/api/companies", json=company_data)
        assert create_response.status_code == 200, f"Create company failed: {create_response.text}"
        
        company = create_response.json()
        company_id = company["id"]
        
        # Soft delete the company
        delete_response = api_client.delete(f"{BASE_URL}/api/companies/{company_id}")
        assert delete_response.status_code == 200
        
        delete_data = delete_response.json()
        assert "trash" in delete_data.get("message", "").lower()
        
        # Verify company no longer in regular GET /companies
        companies_response = api_client.get(f"{BASE_URL}/api/companies")
        assert companies_response.status_code == 200
        companies = companies_response.json()
        company_ids = [c["id"] for c in companies]
        assert company_id not in company_ids
        
        # Verify company appears in trash
        trash_response = api_client.get(f"{BASE_URL}/api/trash")
        assert trash_response.status_code == 200
        trash = trash_response.json()
        trash_company_ids = [c["id"] for c in trash.get("companies", [])]
        assert company_id in trash_company_ids
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/trash/company/{company_id}")


class TestRestoreFunctionality:
    """Test restoring soft-deleted items"""
    
    def test_restore_job_from_trash(self, api_client):
        # Create job
        job_data = {
            "title": f"TEST_Restore_Job_{uuid.uuid4().hex[:8]}",
            "company": "TEST_RestoreCo",
            "status": "applied"
        }
        create_response = api_client.post(f"{BASE_URL}/api/jobs", json=job_data)
        assert create_response.status_code == 200
        job_id = create_response.json()["id"]
        
        # Soft delete
        delete_response = api_client.delete(f"{BASE_URL}/api/jobs/{job_id}")
        assert delete_response.status_code == 200
        
        # Verify in trash
        trash_response = api_client.get(f"{BASE_URL}/api/trash")
        trash_job_ids = [j["id"] for j in trash_response.json().get("jobs", [])]
        assert job_id in trash_job_ids
        
        # Restore from trash
        restore_response = api_client.post(f"{BASE_URL}/api/trash/restore/job/{job_id}")
        assert restore_response.status_code == 200, f"Restore failed: {restore_response.text}"
        
        restore_data = restore_response.json()
        assert "restored" in restore_data.get("message", "").lower()
        
        # Verify job is back in regular GET /jobs
        jobs_response = api_client.get(f"{BASE_URL}/api/jobs")
        jobs = jobs_response.json()
        job_ids = [j["id"] for j in jobs]
        assert job_id in job_ids, "Restored job should appear in regular job list"
        
        # Verify job is no longer in trash
        trash_response = api_client.get(f"{BASE_URL}/api/trash")
        trash_job_ids = [j["id"] for j in trash_response.json().get("jobs", [])]
        assert job_id not in trash_job_ids, "Restored job should not be in trash"
        
        # Cleanup: hard delete through soft delete + permanent delete
        api_client.delete(f"{BASE_URL}/api/jobs/{job_id}")
        api_client.delete(f"{BASE_URL}/api/trash/job/{job_id}")
    
    def test_restore_company_from_trash(self, api_client):
        # Create company
        company_data = {
            "name": f"TEST_Restore_Company_{uuid.uuid4().hex[:8]}",
            "visa_sponsor": False
        }
        create_response = api_client.post(f"{BASE_URL}/api/companies", json=company_data)
        assert create_response.status_code == 200
        company_id = create_response.json()["id"]
        
        # Soft delete
        api_client.delete(f"{BASE_URL}/api/companies/{company_id}")
        
        # Restore
        restore_response = api_client.post(f"{BASE_URL}/api/trash/restore/company/{company_id}")
        assert restore_response.status_code == 200
        
        # Verify restored
        companies_response = api_client.get(f"{BASE_URL}/api/companies")
        company_ids = [c["id"] for c in companies_response.json()]
        assert company_id in company_ids
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/companies/{company_id}")
        api_client.delete(f"{BASE_URL}/api/trash/company/{company_id}")


class TestPermanentDelete:
    """Test permanent deletion from trash"""
    
    def test_permanent_delete_job(self, api_client):
        # Create job
        job_data = {
            "title": f"TEST_PermDelete_Job_{uuid.uuid4().hex[:8]}",
            "company": "TEST_PermDeleteCo"
        }
        create_response = api_client.post(f"{BASE_URL}/api/jobs", json=job_data)
        assert create_response.status_code == 200
        job_id = create_response.json()["id"]
        
        # Soft delete
        api_client.delete(f"{BASE_URL}/api/jobs/{job_id}")
        
        # Permanent delete
        perm_delete_response = api_client.delete(f"{BASE_URL}/api/trash/job/{job_id}")
        assert perm_delete_response.status_code == 200
        assert "permanently deleted" in perm_delete_response.json().get("message", "").lower()
        
        # Verify gone from trash
        trash_response = api_client.get(f"{BASE_URL}/api/trash")
        trash_job_ids = [j["id"] for j in trash_response.json().get("jobs", [])]
        assert job_id not in trash_job_ids


class TestTrashEndpoint:
    """Test GET /api/trash endpoint structure"""
    
    def test_trash_returns_all_categories(self, api_client):
        response = api_client.get(f"{BASE_URL}/api/trash")
        assert response.status_code == 200
        
        data = response.json()
        # Verify all expected categories exist
        expected_categories = ["jobs", "companies", "contacts", "todos", "knowledge", "reminders"]
        for cat in expected_categories:
            assert cat in data, f"Missing category {cat} in trash response"
            assert isinstance(data[cat], list), f"Category {cat} should be a list"


class TestSoftDeleteOtherEntities:
    """Test soft-delete for contacts, todos, knowledge, reminders"""
    
    def test_contact_soft_delete_and_restore(self, api_client):
        # Create contact
        contact_data = {
            "name": f"TEST_Contact_{uuid.uuid4().hex[:8]}",
            "email": f"test_{uuid.uuid4().hex[:4]}@test.com"
        }
        create_response = api_client.post(f"{BASE_URL}/api/contacts", json=contact_data)
        assert create_response.status_code == 200
        contact_id = create_response.json()["id"]
        
        # Soft delete
        delete_response = api_client.delete(f"{BASE_URL}/api/contacts/{contact_id}")
        assert delete_response.status_code == 200
        assert "trash" in delete_response.json().get("message", "").lower()
        
        # Verify in trash
        trash = api_client.get(f"{BASE_URL}/api/trash").json()
        contact_ids = [c["id"] for c in trash.get("contacts", [])]
        assert contact_id in contact_ids
        
        # Restore
        restore_response = api_client.post(f"{BASE_URL}/api/trash/restore/contact/{contact_id}")
        assert restore_response.status_code == 200
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/contacts/{contact_id}")
        api_client.delete(f"{BASE_URL}/api/trash/contact/{contact_id}")
    
    def test_todo_soft_delete_and_restore(self, api_client):
        # Create todo
        todo_data = {
            "title": f"TEST_Todo_{uuid.uuid4().hex[:8]}",
            "category": "general"
        }
        create_response = api_client.post(f"{BASE_URL}/api/todos", json=todo_data)
        assert create_response.status_code == 200
        todo_id = create_response.json()["id"]
        
        # Soft delete
        delete_response = api_client.delete(f"{BASE_URL}/api/todos/{todo_id}")
        assert delete_response.status_code == 200
        
        # Verify in trash
        trash = api_client.get(f"{BASE_URL}/api/trash").json()
        todo_ids = [t["id"] for t in trash.get("todos", [])]
        assert todo_id in todo_ids
        
        # Restore
        restore_response = api_client.post(f"{BASE_URL}/api/trash/restore/todo/{todo_id}")
        assert restore_response.status_code == 200
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/todos/{todo_id}")
        api_client.delete(f"{BASE_URL}/api/trash/todo/{todo_id}")
    
    def test_knowledge_soft_delete_and_restore(self, api_client):
        # Create knowledge
        knowledge_data = {
            "title": f"TEST_Knowledge_{uuid.uuid4().hex[:8]}",
            "content": "Test knowledge article content",
            "tags": ["test"]
        }
        create_response = api_client.post(f"{BASE_URL}/api/knowledge", json=knowledge_data)
        assert create_response.status_code == 200
        knowledge_id = create_response.json()["id"]
        
        # Soft delete
        delete_response = api_client.delete(f"{BASE_URL}/api/knowledge/{knowledge_id}")
        assert delete_response.status_code == 200
        
        # Verify in trash
        trash = api_client.get(f"{BASE_URL}/api/trash").json()
        knowledge_ids = [k["id"] for k in trash.get("knowledge", [])]
        assert knowledge_id in knowledge_ids
        
        # Restore
        restore_response = api_client.post(f"{BASE_URL}/api/trash/restore/knowledge/{knowledge_id}")
        assert restore_response.status_code == 200
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/knowledge/{knowledge_id}")
        api_client.delete(f"{BASE_URL}/api/trash/knowledge/{knowledge_id}")


class TestErrorCases:
    """Test error handling for trash operations"""
    
    def test_restore_nonexistent_item(self, api_client):
        fake_id = str(uuid.uuid4())
        response = api_client.post(f"{BASE_URL}/api/trash/restore/job/{fake_id}")
        assert response.status_code == 404
    
    def test_permanent_delete_nonexistent_item(self, api_client):
        fake_id = str(uuid.uuid4())
        response = api_client.delete(f"{BASE_URL}/api/trash/job/{fake_id}")
        assert response.status_code == 404
    
    def test_invalid_item_type(self, api_client):
        response = api_client.post(f"{BASE_URL}/api/trash/restore/invalid_type/some_id")
        assert response.status_code == 400


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
