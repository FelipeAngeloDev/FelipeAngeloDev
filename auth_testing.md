# Auth Testing Playbook (CodeMaster)

App uses Emergent Google Auth.

## Create test user + session
```bash
mongosh --eval "
use('test_database');
var visitorId = 'user_' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  user_id: visitorId,
  email: 'test.user.' + Date.now() + '@example.com',
  name: 'Aluno Teste',
  picture: null,
  created_at: new Date()
});
db.user_progress.insertOne({
  user_id: visitorId,
  completed: [],
  xp: 0,
  streak: 0,
  last_activity: null
});
db.user_sessions.insertOne({
  user_id: visitorId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
});
print('Session token: ' + sessionToken);
print('User ID: ' + visitorId);
"
```

## Endpoints
- GET /api/auth/me — Authorization: Bearer <token>
- GET /api/courses (public)
- GET /api/courses/{slug} (public)
- GET /api/courses/{slug}/lessons/{lesson_id} (public)
- GET /api/progress — auth required
- POST /api/progress/complete — auth required, body { course_slug, lesson_id }
- POST /api/tutor/chat — auth required, body { message, model: "claude"|"gpt", session_id? }
- POST /api/auth/logout — auth required
