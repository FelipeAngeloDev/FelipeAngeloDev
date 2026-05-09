"""Backend tests for CodeMaster app."""
import os
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://easy-coding-path.preview.emergentagent.com").rstrip("/")
TOKEN = os.environ.get("TEST_TOKEN", "")


@pytest.fixture(scope="session")
def auth_headers():
    return {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}


# ---- Public courses ----
class TestCourses:
    def test_list_courses(self):
        r = requests.get(f"{BASE_URL}/api/courses", timeout=15)
        assert r.status_code == 200
        data = r.json()
        slugs = {c["slug"] for c in data}
        assert {"python", "javascript", "html-css", "java"}.issubset(slugs)
        for c in data:
            assert "title" in c and "lesson_count" in c and c["lesson_count"] > 0

    def test_get_course_python(self):
        r = requests.get(f"{BASE_URL}/api/courses/python", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["slug"] == "python"
        assert isinstance(d["lessons"], list) and len(d["lessons"]) >= 5
        assert d["lessons"][0]["id"] == "py-1"

    def test_get_course_not_found(self):
        r = requests.get(f"{BASE_URL}/api/courses/doesnotexist", timeout=15)
        assert r.status_code == 404

    def test_get_lesson(self):
        r = requests.get(f"{BASE_URL}/api/courses/python/lessons/py-1", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["course"]["slug"] == "python"
        assert d["lesson"]["id"] == "py-1"
        assert "theory" in d["lesson"] and "exercise" in d["lesson"]
        assert d["lesson"]["exercise"]["correct"] == 1


# ---- Auth gating ----
class TestAuthGating:
    def test_me_no_token(self):
        r = requests.get(f"{BASE_URL}/api/auth/me", timeout=15)
        assert r.status_code == 401

    def test_progress_no_token(self):
        r = requests.get(f"{BASE_URL}/api/progress", timeout=15)
        assert r.status_code == 401

    def test_complete_no_token(self):
        r = requests.post(f"{BASE_URL}/api/progress/complete",
                          json={"course_slug": "python", "lesson_id": "py-1"}, timeout=15)
        assert r.status_code == 401

    def test_tutor_no_token(self):
        r = requests.post(f"{BASE_URL}/api/tutor/chat",
                          json={"message": "oi", "model": "claude"}, timeout=15)
        assert r.status_code == 401


# ---- Authenticated flows ----
class TestAuthenticated:
    def test_me(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/auth/me", headers=auth_headers, timeout=15)
        assert r.status_code == 200, r.text
        u = r.json()
        assert "email" in u and "user_id" in u

    def test_progress(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/progress", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert "completed" in d and "xp" in d and "streak" in d

    def test_complete_lesson_first_then_idempotent(self, auth_headers):
        r1 = requests.post(f"{BASE_URL}/api/progress/complete",
                           headers=auth_headers,
                           json={"course_slug": "python", "lesson_id": "py-1"}, timeout=15)
        assert r1.status_code == 200, r1.text
        d1 = r1.json()
        assert d1["xp_gained"] == 20
        assert d1["streak"] >= 1
        # GET to verify persistence
        rg = requests.get(f"{BASE_URL}/api/progress", headers=auth_headers, timeout=15)
        assert rg.status_code == 200
        assert "python:py-1" in rg.json()["completed"]
        # Second call -> 0 xp
        r2 = requests.post(f"{BASE_URL}/api/progress/complete",
                           headers=auth_headers,
                           json={"course_slug": "python", "lesson_id": "py-1"}, timeout=15)
        assert r2.status_code == 200
        assert r2.json()["xp_gained"] == 0


# ---- Tutor (LLM) ----
class TestTutor:
    def test_tutor_claude(self, auth_headers):
        r = requests.post(f"{BASE_URL}/api/tutor/chat",
                          headers=auth_headers,
                          json={"message": "Olá! Em uma frase, o que é Python?", "model": "claude"},
                          timeout=90)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("reply") and len(d["reply"]) > 5
        assert d.get("session_id")

    def test_tutor_gpt(self, auth_headers):
        r = requests.post(f"{BASE_URL}/api/tutor/chat",
                          headers=auth_headers,
                          json={"message": "Diga oi em uma palavra.", "model": "gpt"},
                          timeout=90)
        assert r.status_code == 200, r.text
        assert r.json().get("reply")


# ---- Logout (run last) ----
class TestZLogout:
    def test_logout(self, auth_headers):
        r = requests.post(f"{BASE_URL}/api/auth/logout", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        # After logout, token should be invalid
        r2 = requests.get(f"{BASE_URL}/api/auth/me", headers=auth_headers, timeout=15)
        assert r2.status_code == 401
