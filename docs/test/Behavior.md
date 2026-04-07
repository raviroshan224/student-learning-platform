# Test Feature Behavior & Business Rules

This document outlines the session lifecycle, timing rules, and critical business logic for the Mock Test engine.

## 1. Session Lifecycle (FSM)

The test session follows a strict finite-state machine (FSM) managed by the `TestSessionViewModel`.

**State Machine Implementation:** [lib/features/test/view_model/test_session_view_model.dart#L17](file:///C:/Users/shiwa/StudioProjects/olp_mobileapp/lib/features/test/view_model/test_session_view_model.dart#L17)

| State | Description | Triggers |
|-------|-------------|----------|
| `notStarted` | Initial state. No active session. | Default |
| `starting` | Initializing session via API. | `startTest()` or `loadSession()` |
| `inProgress` | Active session with a timer running. | API Success / Sync |
| `paused` | App in background (see Auto-Submit). | `didChangeAppLifecycleState` |
| `submitting` | Sending final answers and closing session. | Manual "Submit" or Timer End |
| `submitted` | Session finalized, but result not yet loaded. | API Success |
| `completed` | Test result loaded and displayed to user. | `submitTest()` Success |
| `expired` | Timer ran out before submission. | `endsAt` < Now |
| `error` | API or Network failure during any phase. | Error Catch |

---

## 2. Timer & Countdown

The timer is **server-driven**. It is calculated as the difference between the current local time and the `endsAt` timestamp provided by the backend.

- **Calculation:** `endsAt - now`
- **Rule:** If `endsAt` is in the past, the session is considered `expired`.
- **Implementation:** [lib/features/test/view_model/test_session_view_model.dart#L212](file:///C:/Users/shiwa/StudioProjects/olp_mobileapp/lib/features/test/view_model/test_session_view_model.dart#L212)

---

## 3. Auto-Submit & Background Protection

To prevent cheating or session abandonment, the engine tracks the app's lifecycle state.

- **The 10-Second Rule:** If the app remains in the background (or paused) for more than **10 seconds**, the test is automatically submitted.
- **Threshold:** `Duration(seconds: 10)`
- **Triggers:** `AppLifecycleState.paused` -> `AppLifecycleState.resumed`
- **Location:** [lib/features/test/view_model/test_session_view_model.dart#L170](file:///C:/Users/shiwa/StudioProjects/olp_mobileapp/lib/features/test/view_model/test_session_view_model.dart#L170)

---

## 4. Answer Persistence & Refresh Pattern

Every user action (selecting an option, marking for review) follows a **Sync-after-Action** pattern to ensure the state is always saved on the server.

1. User selects an option (e.g., Option B).
2. UI calls `submitAnswer(index, "B")`.
3. `PATCH /answer` is sent to the server.
4. **On Success:** The engine IMMEDIATELY calls `GET /session` to refresh the entire state.
5. This ensures that even if the app crashes, the latest answers are always persisted and visible upon recovery.

---

## 5. Crash Recovery

The current session ID is persisted locally to allow the user to rejoin an active test if it was interrupted.

- **Storage Key:** `active_test_session_id` (SharedPreferences)
- **Flow:**
    - On App Start: `_loadPersistedSessionId()` checks for a saved ID.
    - If found and no session is active, it calls `loadSession(id)`.
    - If the session is within its `endsAt` window, the user is transitioned back to the `QuizPage`.

**Location:** [lib/features/test/view_model/test_session_view_model.dart#L603-L616](file:///C:/Users/shiwa/StudioProjects/olp_mobileapp/lib/features/test/view_model/test_session_view_model.dart#L603-L616)

---

## 6. Gating Logic (CanTakeTest)

Before starting a test, the app checks the `canTakeTest` property of the `MockTest` object.

- **Free Tests:** Always accessible.
- **Paid Tests:** Must have `isPurchased: true`.
- **Enrollment:** The test must belong to an enrolled `courseId`.
- **Implementation:** [lib/features/test/presentation/pages/detail_pages/test_details.dart#L70](file:///C:/Users/shiwa/StudioProjects/olp_mobileapp/lib/features/test/presentation/pages/detail_pages/test_details.dart#L70)
