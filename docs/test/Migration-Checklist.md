# Migration Checklist: Test Feature (Flutter -> Next.js)

Follow these prioritized steps to implement the "Test" feature in the Next.js web application.

## Phase 1: API & Data Layer (Core)

- [ ] Create `TestSession` and `TestResult` TypeScript interfaces (see Models.md).
- [ ] Implement `ExamsService` (or `TestSessionsService`) using `axios` or `fetch`.
    - [ ] `POST /test-sessions/start`
    - [ ] `GET /test-sessions/{sessionId}/question/{index}`
    - [ ] `PATCH /test-sessions/{sessionId}/answer`
- [ ] Implement Request Interceptors for JWT auth.
- [ ] Handle **403 Forbidden** (Blocked Test) and **422 Unprocessable Entity** (Invalid Payload) scenarios.

## Phase 2: Session FSM & Timer (Logic)

- [ ] Define `TestSessionStatus` enum (Matching `Behavior.md`).
- [ ] Implement `useTestSession` hook or `Recoil` atom for global session state.
- [ ] Implement **Server-Driven Timer Logic**:
    - [ ] Sync `endsAt` from initial response.
    - [ ] Run a `setInterval` locally every second.
    - [ ] Automatically trigger `submitSession()` when the timer hits zero.
- [ ] Implement **Auto-Submit on Background**:
    - [ ] Use `document.addEventListener('visibilitychange')`.
    - [ ] Track `hidden` state duration.
    - [ ] If duration > 10s, call submit API upon return.

## Phase 3: UI Components (Presentation)

- [ ] Implement `QuizLayout`: Fixed header (Timer), Main content (Question + Options), Footer (Navigation).
- [ ] Implement `OptionSelector`: Radio-button style options with clear selection states.
- [ ] Implement `QuestionGrid`: A clickable map of all questions (Attempted: Green, Marked: Purple).
- [ ] Implement `RichTextRenderer`: Use a library like `dompurify` and `html-react-parser` to render question prompts.

## Phase 4: Persistence & Recovery (Resilience)

- [ ] Implement `localStorage` or `Cookie` based persistence for `activeSessionId`.
- [ ] On page load (Root Layout), check for an active session.
- [ ] If found, verify validity (endsAt > now) and redirect the user back to the quiz.
- [ ] Clear state immediately upon successful submission or manual "Exit".

## Phase 5: Result & Solutions (Outcome)

- [ ] Implement `ResultDashboard`: Visual charts and summary statistics.
- [ ] Implement `SolutionsReview`: Read-only `QuizPage` variant that highlights:
    - [ ] User's choice (Red if wrong).
    - [ ] Correct choice (Green).
    - [ ] Explanation (HTML).

## Critical Implementation Notes

> [!WARNING]
> **No Session-Wide Question Load:** The mobile app fetches full test sessions (all questions) in a single GET only if they are small. For large mock tests (100+), prefer fetching questions by index to keep initial load times low.

> [!TIP]
> **Use React Query:** Leverage `useMutation` for answers and `useQuery` for session refreshes to simplify the "Action -> Refresh" pattern.
