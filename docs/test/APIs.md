# Test Feature API Reference

All Test and Mock Test related endpoints are hosted under the base API URL: `https://scholargyan.onecloudlab.com/api/v1/`.

## Authentication Required
All endpoints below require a valid **JWT Bearer Token** in the `Authorization` header.

```bash
Authorization: Bearer <your_access_token>
```

---

## 1. Mock Test Discovery

### GET /mock-tests/courses/:courseId/with-attempts
Fetches all mock tests for a specific course, including the user's latest attempt status.

**Called from:** [lib/features/test/service/mock_test_service.dart#L38](file:///C:/Users/shiwa/StudioProjects/olp_mobileapp/lib/features/test/service/mock_test_service.dart#L38)

**Example cURL:**
```bash
curl -X GET "https://scholargyan.onecloudlab.com/api/v1/mock-tests/courses/course_123/with-attempts?page=1&limit=20" \
     -H "Authorization: Bearer <token>"
```

**Typical Response:**
```json
[
  {
    "id": "mock_test_uuid",
    "title": "Full Mock Test 1",
    "courseId": "course_123",
    "numberOfQuestions": 100,
    "timeLimit": 120,
    "isFree": false,
    "isPurchased": true,
    "canTakeTest": true,
    "attempted": true,
    "lastAttempt": {
      "id": "session_abc",
      "score": 72,
      "passed": true
    }
  }
]
```

---

## 2. Session Lifecycle

### POST /test-sessions/start
Starts a new test session for the given mock test. Returns the first few questions and the session metadata.

**Called from:** [lib/features/test/service/test_session_service.dart#L44](file:///C:/Users/shiwa/StudioProjects/olp_mobileapp/lib/features/test/service/test_session_service.dart#L44)

**Request Body:**
```json
{
  "mockTestId": "test_uuid"
}
```

**Example cURL:**
```bash
curl -X POST "https://scholargyan.onecloudlab.com/api/v1/test-sessions/start" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <token>" \
     -d '{"mockTestId": "test_uuid"}'
```

---

### PATCH /test-sessions/:sessionId/answer
Submits or updates the answer for a specific question in the session.

**Resource:** [lib/features/test/service/test_session_service.dart#L111](file:///C:/Users/shiwa/StudioProjects/olp_mobileapp/lib/features/test/service/test_session_service.dart#L111)

**Request Body:**
```json
{
  "questionIndex": 0,
  "selectedAnswer": "Option_A_Key"
}
```

---

### PATCH /test-sessions/:sessionId/mark-review
Toggles the "Mark for Review" flag for a specific question.

**Resource:** [lib/features/test/service/test_session_service.dart#L138](file:///C:/Users/shiwa/StudioProjects/olp_mobileapp/lib/features/test/service/test_session_service.dart#L138)

**Request Body:**
```json
{
  "questionIndex": 0,
  "markForReview": true
}
```

---

### POST /test-sessions/:sessionId/submit
Finalizes the test session and triggers score calculation.

**Resource:** [lib/features/test/service/test_session_service.dart#L213](file:///C:/Users/shiwa/StudioProjects/olp_mobileapp/lib/features/test/service/test_session_service.dart#L213)

**Response:** Returns a `TestResult` object (see Models.md).

---

## 3. Results & Solutions

### GET /test-sessions/:sessionId/result
Fetches the score and summary for a completed session.

**Resource:** [lib/features/test/service/test_session_service.dart#L234](file:///C:/Users/shiwa/StudioProjects/olp_mobileapp/lib/features/test/service/test_session_service.dart#L234)

---

### GET /test-sessions/:sessionId/solutions
Fetches all questions with correct answers and explanations for post-test review.

**Resource:** [lib/features/test/service/test_session_service.dart#L255](file:///C:/Users/shiwa/StudioProjects/olp_mobileapp/lib/features/test/service/test_session_service.dart#L255)

---

## 4. History

### GET /test-sessions/history/me
Fetches the user's overall test attempt history.

**Query Params:**
- `courseId` (String, Optional): Filter by course.

**Resource:** [lib/features/test/service/test_session_service.dart#L293](file:///C:/Users/shiwa/StudioProjects/olp_mobileapp/lib/features/test/service/test_session_service.dart#L293)
