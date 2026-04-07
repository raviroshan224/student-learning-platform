# Test Feature Models

This document defines the TypeScript interfaces and provides JSON examples for the data models used in the Mock Test and Test Session features.

## Core Models

### TestSession
The root object for an active test session.

**File Reference:** [lib/features/test/models/test_session_models.dart#L1](file:///C:/Users/shiwa/StudioProjects/olp_mobileapp/lib/features/test/models/test_session_models.dart#L1)

```typescript
interface TestSession {
  sessionId: string;
  mockTestId: string;
  examId?: string;
  examTitle?: string;
  status: 'in_progress' | 'completed' | 'expired' | 'submitted';
  currentQuestionIndex: number;
  totalQuestions: number;
  durationMinutes: number;
  startedAt: string; // ISO 8601
  endsAt: string;    // ISO 8601
  questions: TestQuestion[];
  answers: Record<number, AnswerState>;
}
```

### TestQuestion
A single question within a session.

**File Reference:** [lib/features/test/models/test_session_models.dart#L77](file:///C:/Users/shiwa/StudioProjects/olp_mobileapp/lib/features/test/models/test_session_models.dart#L77)

```typescript
interface TestQuestion {
  index: number;
  questionId: string;
  prompt: string;
  description?: string;
  imageUrl?: string;
  explanation?: string;
  options: TestQuestionOption[];
  selectedOptionKey?: string;
  isMarkedForReview?: boolean;
}
```

### TestQuestionOption
An answer option for a question.

```typescript
interface TestQuestionOption {
  key: string;
  label: string;
  isCorrect?: boolean; // Only present in solutions or completed sessions
}
```

---

## State & Requests

### AnswerState
Represents the current state of a user's answer.

```typescript
interface AnswerState {
  selectedOptionKey: string;
  submittedAt?: string;
  isMarkedForReview?: boolean;
  isCorrect?: boolean;
}
```

### AnswerSubmitRequest
Payload for submitting an answer.

```typescript
interface AnswerSubmitRequest {
  questionIndex: number;
  selectedAnswer: string; // The option key
}
```

---

## Results & Summary

### TestSummary
High-level statistics for a completed test.

**File Reference:** [lib/features/test/models/test_session_models.dart#L248](file:///C:/Users/shiwa/StudioProjects/olp_mobileapp/lib/features/test/models/test_session_models.dart#L248)

```typescript
interface TestSummary {
  totalQuestions: number;
  attempted: number;
  correct: number;
  incorrect: number;
  skipped: number;
  markedForReview: number;
  score: number;
  percentage: number;
  timeSpentSeconds: number;
}
```

### TestResult
The final outcome of a test attempt.

```typescript
interface TestResult {
  summary: TestSummary;
  rank?: number;
  percentile?: number;
  feedback?: string;
  completedAt: string;
  passed: boolean;
}
```

---

## Examples

### JSON: Start Session Response
```json
{
  "id": "sess_12345",
  "mockTestId": "test_987",
  "title": "General Knowledge Mock 1",
  "status": "in_progress",
  "durationMinutes": 30,
  "startedAt": "2024-06-01T10:00:00Z",
  "endsAt": "2024-06-01T10:30:00Z",
  "totalQuestions": 2,
  "questions": [
    {
      "index": 0,
      "id": "q_1",
      "prompt": "What is the capital of France?",
      "options": [
        { "key": "A", "label": "London" },
        { "key": "B", "label": "Paris" }
      ]
    }
  ]
}
```
