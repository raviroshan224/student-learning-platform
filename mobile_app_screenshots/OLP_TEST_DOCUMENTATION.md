# OLP Mobile App — Tests & Exams Technical Documentation

> Deep-dive reference for rebuilding the **Exams Section** (Tab 3 — Exam listing/detail) and the **Mock Tests / Test Session system** (TestPage, Quiz, Results, Solutions) in a Next.js web application.
>
> Backend base URL: `https://scholargyan.onecloudlab.com/api/v1/`
> Payment checkout URL: `https://scholargyan.onecloudlab.com/payment/checkout`

---

## Table of Contents

1. [Section Overview & Architecture](#1-section-overview--architecture)
2. [UI Component Breakdown](#2-ui-component-breakdown)
3. [API Integrations](#3-api-integrations)
4. [Data Models (TypeScript)](#4-data-models-typescript)
5. [State Management](#5-state-management)
6. [Application Logic & Business Rules](#6-application-logic--business-rules)
7. [User Interaction Flow](#7-user-interaction-flow)
8. [Navigation Flow](#8-navigation-flow)
9. [Reusable Components](#9-reusable-components)
10. [Next.js Implementation Notes](#10-nextjs-implementation-notes)

---

## 1. Section Overview & Architecture

### 1.1 Feature Map

The test/exam section is divided into **two distinct sub-systems**:

```
Dashboard (IndexedStack)
└── Tab 3 — ExamListPage            ← Browse public exam packages
      └── ExamDetailPage             ← Exam detail + linked courses
            └── EnrolledCourseDetailsPage ← Jump to a course

TestPage (accessed from course detail Tab 4 or standalone)
  ├── Tab 0: MockTestListView        ← Available mock tests for a course
  │     └── TestDetailsPage          ← Test metadata + buy/start CTA
  │           └── QuizPage           ← Live test session (question-by-question)
  │                 └── ResultPage   ← Score + stats after submit
  │                       └── SolutionsPage ← Per-question answer review
  └── Tab 1: TestHistory             ← Past test attempts
        └── ResultPage(showDone:false) ← View past result
```

### 1.2 Two Separate Feature Modules

| Feature | Flutter Path | Purpose |
|---|---|---|
| **Exams** | `lib/features/exams/` | Public exam catalogue — listing + detail only, no test-taking |
| **Test** | `lib/features/test/` | Mock test engine — course-based tests, sessions, results, history |

### 1.3 State Provider Map

```
examListViewModelProvider       (ExamListViewModel)  — exam list + pagination
examDetailViewModelProvider     (ExamDetailViewModel) — single exam detail
examViewModelProvider           (ExamViewModel)       — used by explore detail tab

mockTestViewModelProvider       (MockTestViewModel)   — course selection + test list
testSessionViewModelProvider    (TestSessionViewModel) — active test session FSM
testResultControllerProvider    (TestResultController) — result after submission
testSolutionsControllerProvider (TestSolutionsController) — solution data
```

---

## 2. UI Component Breakdown

### 2.1 ExamListPage (Dashboard Tab 3)

**AppBar**
- Title: `"Exams"` via `CustomAppBar`
- Background: white

**Search Bar**
- `CustTextField` — full width, 400ms debounce
- Hint: `"Search by title, category, or course"`
- Prefix: `Icons.search`
- On change → `loadExams(page: 1, search: query, append: false, force: true)`

**Error Banner** (shows above list when error occurs)
- Red border container (failure at 8% opacity, failure at 40% border)
- Error message text + `"Retry"` TextButton inline

**Exam Card (`_ExamCard`)**
- Card: elevation 1, radius 12, margin 16h 6v
- Row layout:
  - Left: 60×60 thumbnail, radius 8px
  - Center: title (bodyLarge, weight 600), badges row
  - Right: `Icons.chevron_right` (gray400)
- Status badge colors:
  - `"active"` → success at 10% bg, success text
  - `"inactive"` or other → gray500 at 10% bg, gray500 text
- Category badge: primary at 10% bg, primary text, radius 12

**Infinite Scroll**
- Threshold: 200px from bottom (NOT 120px like other pages)
- Trigger: `loadExams(page: state.page + 1, append: true, force: true)`
- Loading indicator: `CircularProgressIndicator` as extra list item

**Empty State**
- `"No exams found. Adjust the filters to try again."` — bodySmall, gray600

**Pull-to-refresh**
- `RefreshIndicator` → `notifier.refresh()`

---

### 2.2 ExamDetailPage

**Header Image**
- `AspectRatio(16/9)` with `CachedNetworkImage`
- Loading: `CircularProgressIndicator` centered
- Error: fallback to `AppAssets.errorImage`

**AppBar**
- Dynamic title: `detail?.title ?? 'Exam Detail'`
- Background: white, elevation 2, `foregroundColor: primary`

**Body (SingleChildScrollView)**
- Title: headlineSmall, weight 700, black
- Badges row: category chip (primary at 10%), status chip (success/gray500 at 10%)
- Description: rendered as HTML using `flutter_html` package, font size 14, gray700
- Course Details section: list of `_CourseDetailSection` tiles

**Course Detail Tile (`_CourseDetailSection`)**
- Tappable → `EnrolledCourseDetailsPage(courseId)`
- Container: gray100 bg, gray200 border, radius 12, padding 12
- Left: 64×64 thumbnail
- Right: course title (bodyMedium, weight 600), description, class count

**States**
- Loading: centered `CircularProgressIndicator`
- Error: `_ErrorView` with message + Retry button
- No data: `_ErrorView` with `"Exam details are unavailable."`

---

### 2.3 TestPage (Mock Test Hub)

**AppBar**
- Title: `"Mock Tests"`
- Background: white

**Header Section (Course Selector)**
- Inline row: `"Course:"` label + `DropdownButton<String>` + edit icon button
- Dropdown: all published courses, hint `"Choose a course"`, radius 8
- Edit icon (`Icons.edit`, size 18, primary) → `TestSelectCourse` page
- Loading state: `LinearProgressIndicator` below dropdown
- No courses: info message `"No courses available"` with info icon
- Error: error message with warning icon

**Two-Tab Switcher** (underline style, NOT pill style)
- Labels: `"Available Tests"` | `"Test History"`
- Bottom border: 2px `primary` on selected tab
- Unselected: gray600 text, normal weight
- Selected: primary text, weight 600
- `IndexedStack` keeps both tabs alive

**Available Tests Tab (`MockTestListView`)**
- Vertical `ListView`
- Each item: test card with title, question count, duration, attempts remaining
- Button label logic:
  - `canTakeTest && attemptsUsed == 0` → `"Start Test"` (primary)
  - `canTakeTest && attemptsUsed > 0` → `"Retake Test"` (primary)
  - `!canTakeTest` → `"View Details"` (outlined style)
- Filters tests: only shows tests where `remainingAttempts == null || remainingAttempts > 0`
- Infinite scroll: `loadNextPage()` when near bottom
- Pull-to-refresh → `refreshTests()`

**Test History Tab (`TestHistory`)**
- Vertical `ListView` of past attempts
- Each item: test title, score percentage, completion date, pass/fail badge
- Pass: green background badge
- Fail: red background badge
- Tap → loads session → `ResultPage(showDoneButton: false)`

---

### 2.4 TestDetailsPage

**AppBar**
- Title: test name
- Right action area:
  - `canTakeTest == true` → `"Start Test"` button (shows loading spinner while starting)
  - `!isFree && !isPurchased` → `"Buy Test"` button
  - Else (purchased but blocked by backend) → `"Unavailable"` label (failure color)

**Body (SingleChildScrollView)**
- `_HeaderSection`: title (headlineMedium, bold), info grid
  - Info grid (gray100 container, radius 12, gray200 border):
    - Row 1: Questions count (`Icons.quiz_outlined`) | Duration in minutes (`Icons.access_time`)
    - Row 2 (if available): Pass Mark % (`Icons.check_circle_outline`) | Attempts Left (`Icons.repeat`)
  - Each info item: icon (primary, 20px) + label (bodySmall, gray600) + value (bodyMedium, weight 600)
- Description (HTML rendered with `flutter_html`, gray700, padding 16)
- `_InstructionSection`: white container, gray200 border, radius 12
  - Title: `"Instructions"` (titleMedium, weight 600)
  - Each instruction: `"• "` (primary color) + text (bodyMedium, gray700)
  - Empty: `"No special instructions for this test."` (gray500)
- `_SubjectDistributionSection`: subject name + question count per subject (ListTile format)
- `_ExtraMetadata`: key-value pairs from `extra` map (Additional Information card)

**Buy Test Flow**
- Taps `"Buy Test"` → opens `https://scholargyan.onecloudlab.com/payment/checkout?type=test_purchase&referenceId={testId}&userId={userId}` in external browser
- Uses `launchUrl` with `LaunchMode.externalNonBrowserApplication`

---

### 2.5 QuizPage (Active Test Session)

**AppBar**
- Title: `"X/Y"` format (current question / total questions)

**Body**
- Loading: full-screen `CircularProgressIndicator`
- Question display:
  - Prompt text (bodyMedium, black, max 10 lines)
  - Optional description/subtext below (bodySmall, gray700, max 10 lines)
  - `OptionsList` widget below with options A–D (or more)

**OptionsList**
- Each option: lettered badge (`A`, `B`, `C`, `D`...) + text
- Selected: `blue[50]` background highlight
- Read-only mode: no tap response (used when reviewing)

**Bottom Nav Bar**
- `"Previous"` button (left): white bg, black border, gray700 text
  - Disabled when `isActionLocked` (navigating/answering/submitting)
  - Disabled at question index 0
- `"Next"` button (right): primary color
  - On last question: label changes to `"Submit"` → triggers `_confirmSubmit()`
  - In `readOnly` mode: label stays `"Next"`, no submit

**Submit Dialog (`showSubmitDialog`)**
- `AlertDialog` with:
  - `"Total: X"`, `"Attempted: X"`, `"Not Attempted: X"` stats
  - `"Cancel"` and `"Submit"` buttons
  - On confirm: `submitTest()` → navigate to `ResultPage`

**Action Lock**
- All navigation/selection buttons are disabled when `state.isNavigating || state.isAnswering || state.isSubmitting`

---

### 2.6 ResultPage

**Loading State**
- Full-screen `CircularProgressIndicator` (replaces entire Scaffold)

**No Data State**
- `AppBar` with exam title
- Centered error/retry message

**Result Display**
- Row: `ProgressCircle` (left) + `DetailsCard` (right)
- `ProgressCircle`: circular arc showing score percentage (0–100)
- `DetailsCard`: 4-row key-value table
  - Total Questions
  - Attempted (= totalQuestions - skipped)
  - Correct
  - Incorrect (clamped to ≥ 0)
- `"View Solutions"` button below — disabled while solutions loading
- `"Next Steps"` card (only when `showDoneButton: true`):
  - `"Done"` button → `Navigator.popUntil((route) => route.isFirst)` — goes all the way back

**Data source priority** (result fields may be at top level or inside `summary`):
1. `evaluation.totalQuestions` → `summary.totalQuestions`
2. `evaluation.scorePercentage` → `summary.percentage`
3. etc. (nested fallback chain)

---

### 2.7 SolutionsPage

**AppBar**
- Title: `"Solutions"`

**Body**
- Loading: `CircularProgressIndicator`
- Empty/Error: centered message
- Solution list: `ListView.separated` with 16px gaps

**Solution Card (`_SolutionCard`)**
- `Card` with elevation 0, radius 12, padding 16
- Question number + prompt text (bodyMedium, black)
- Optional question description below (bodySmall, gray700)
- Options list (`_OptionTile` per option):
  - Default: light gray background (`AppColors.lightGreyBg`)
  - Correct option: success at 12% bg, success at 40% border, `"Correct Answer"` badge
  - Selected (wrong) option: primary at 12% bg, primary at 40% border, `"Your Answer"` badge
  - Option letter badge: 32×32px white box, gray300 border, radius 8
- Explanation section: `"Explanation:"` label + explanation text (bodySmall, gray700)
- Result row: `"Result:"` label + status chip (`Correct`/`Incorrect`/`Not answered`/`Answered`)
  - `"Correct"` → success color
  - `"Incorrect"` → failure color
  - `"Not answered"` → gray600
  - `"Answered"` (no correct key to compare) → primary color
- `"Your answer: <text>"` (bodySmall, gray700)
- `"Correct answer: <text>"` (bodySmall, green) — only if correctText available

---

## 3. API Integrations

### 3.1 Exams Feature APIs

| # | Method | Endpoint | Auth | Purpose |
|---|---|---|---|---|
| 1 | `GET` | `/exams` | No | Paginated exam list with search/status/sort |
| 2 | `GET` | `/exams/{id}` | No | Full exam detail |

#### GET /exams — Query Parameters
```
page        integer   default 1
limit       integer   default 10
search      string?   keyword search
status      string?   'Active' | 'Inactive'
sortBy      string?   field name to sort by
sortOrder   string    'asc' | 'desc' (default 'desc')
```

#### GET /exams Response (ExamListResponse)
```json
{
  "data": [ExamSummary],
  "meta": {
    "currentPage": 1,
    "lastPage": 5,
    "perPage": 10,
    "total": 48,
    "from": 1,
    "to": 10
  }
}
```

---

### 3.2 Mock Test APIs

| # | Method | Endpoint | Auth | Purpose |
|---|---|---|---|---|
| 3 | `GET` | `/mock-tests/by-course/{courseId}/with-attempts` | Yes | All mock tests for a course with attempt data |
| 4 | `GET` | `/mock-tests/by-course/{courseId}/with-attempts?limit=200` | Yes | Fetch detail (re-uses list endpoint with high limit) |

**Note:** There is no dedicated `/mock-tests/{id}` endpoint. Detail is fetched by calling the list with `limit=200` and finding by ID, slug, or legacy mockTestId in `extra`.

---

### 3.3 Test Session APIs

All session endpoints require auth and are prefixed with `/test-sessions`.

| # | Method | Endpoint | Body / Params | Purpose |
|---|---|---|---|---|
| 5 | `POST` | `/test-sessions/start` | `{ mockTestId }` | Start a new test session |
| 6 | `GET` | `/test-sessions/{sessionId}` | — | Get current session state |
| 7 | `GET` | `/test-sessions/{sessionId}/question/{index}` | — | Get specific question by index |
| 8 | `PATCH` | `/test-sessions/{sessionId}/answer` | `{ questionIndex, selectedAnswer }` | Submit an answer |
| 9 | `PATCH` | `/test-sessions/{sessionId}/mark-review` | `{ questionIndex, markForReview }` | Toggle mark-for-review flag |
| 10 | `PATCH` | `/test-sessions/{sessionId}/navigate` | `{ questionIndex }` | Navigate to a question |
| 11 | `GET` | `/test-sessions/{sessionId}/summary` | — | Get session stats before submit |
| 12 | `POST` | `/test-sessions/{sessionId}/submit` | — | Submit test and get result |
| 13 | `GET` | `/test-sessions/{sessionId}/result` | — | Get result for completed session |
| 14 | `GET` | `/test-sessions/{sessionId}/solutions` | — | Get all questions + answers + explanations |
| 15 | `GET` | `/test-sessions/history/me` | `courseId?` | Get user's test history |

#### POST /test-sessions/start — Response (unwrapped)
```json
{
  "id": "session123",
  "mockTestId": "test456",
  "status": "in_progress",
  "currentQuestionIndex": 0,
  "totalQuestions": 50,
  "durationMinutes": 60,
  "startedAt": "2024-01-15T10:00:00Z",
  "endsAt": "2024-01-15T11:00:00Z",
  "questions": [...],
  "answers": {}
}
```

#### PATCH /test-sessions/{id}/answer — Body
```json
{
  "questionIndex": 0,
  "selectedAnswer": "option2"
}
```

#### POST /test-sessions/{id}/submit — Response
```json
{
  "totalQuestions": 50,
  "correctAnswers": 35,
  "wrongAnswers": 10,
  "skippedQuestions": 5,
  "scorePercentage": 70.0,
  "passed": true,
  "feedback": "Good job!",
  "rank": 42,
  "summary": { ... }
}
```

**Response Unwrapping:** The service checks for `data.data` or `data.result` wrapper keys first; if neither exists, uses the raw response directly.

---

### 3.4 Payment API

| # | Method | Endpoint | Body | Purpose |
|---|---|---|---|---|
| 16 | `POST` | (payment initiate — via SimplePaymentService) | `{ paymentType, referenceId, promoCode }` | Initiate test purchase, get redirect URL |

**Buy Test Flow (current implementation):**
The app directly builds a URL and opens in external browser:
```
https://scholargyan.onecloudlab.com/payment/checkout
  ?type=test_purchase
  &referenceId={testId}
  &userId={userId}
```

---

### 3.5 API Endpoint Constants

```dart
// Exams
static const exams = '/exams';

// Mock Tests
static const mockTestsByCourse = '/mock-tests/by-course';
// Usage: /mock-tests/by-course/{courseId}/with-attempts

// Test Sessions
static const testSessions = '/test-sessions';
static const testSessionsStart = '/test-sessions/start';
static const testSessionsHistoryMe = '/test-sessions/history/me';
```

---

## 4. Data Models (TypeScript)

### 4.1 Exam Models (Exams Feature)

```typescript
interface ExamListMeta {
  currentPage?: number;    // also 'current_page'
  lastPage?: number;       // also 'last_page'
  perPage?: number;        // also 'per_page'
  total?: number;
  from?: number;
  to?: number;
  // Computed:
  hasNextPage: boolean;    // currentPage < lastPage
  hasPreviousPage: boolean; // currentPage > 1
}

interface ExamSummary {
  id: string;
  title: string;
  examImageUrl?: string;  // also 'image', 'cover', 'imageUrl', 'thumbnailUrl'
  status?: string;         // 'Active' | 'Inactive'
  category?: string;
  courses?: ExamCourseInfo[];
}

interface ExamDetail extends ExamSummary {
  description?: string;
  courseDetails: ExamCourseInfo[];
  validFrom?: Date;
  validTo?: Date;
  metadata?: Record<string, unknown>;
}

interface ExamCourseInfo {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;    // 'courseIconUrl' | 'image' | 'courseImageUrl'
  classCount?: number;
}
```

### 4.2 Mock Test Models

```typescript
interface MockTestMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

interface MockTest {
  id: string;
  courseId: string;
  title?: string;
  description?: string;           // may contain HTML
  instructions: string[];         // array or newline-separated string from API
  testType?: string;
  subjectId?: string;
  subjectName?: string;
  subjectDistribution: Array<{
    subjectName?: string;
    subject?: string;
    questionCount?: number;
    questions?: number;
    value?: number;
  }>;
  numberOfQuestions?: number;     // also 'questionCount'
  cost?: number;                  // 0 = free
  durationMinutes?: number;       // also 'duration', 'time'
  passingPercentage?: number;     // also 'passPercentage'
  attemptsAllowed?: number;       // also 'maxAttempts'
  totalAttempts?: number;
  averageScore?: number;          // also 'avgScore'
  attemptsUsed?: number;          // also 'attemptCount'
  remainingAttempts?: number;     // also 'attemptsRemaining'
  maxAttemptsReached?: boolean;
  isFree: boolean;
  isPurchased: boolean;
  canTakeTest: boolean;           // KEY FIELD — backend-computed access control
  extra?: Record<string, unknown>; // contains slug, legacyId, etc.
}

interface MockTestListResponse {
  tests: MockTest[];
  meta?: MockTestMeta;
}
```

### 4.3 Test Session Models

```typescript
interface TestSession {
  sessionId: string;
  mockTestId: string;
  examId?: string;
  examTitle?: string;
  status?: string;              // 'in_progress' | 'completed' | 'submitted' | 'expired'
  currentQuestionIndex?: number;
  totalQuestions?: number;
  durationMinutes?: number;
  startedAt?: Date;
  endsAt?: Date;                // KEY: timer derived from this
  questions: TestQuestion[];
  answers: Record<number, AnswerState>;
  // Computed:
  isExpired: boolean;           // endsAt < now
}

interface TestQuestion {
  index: number;
  questionId: string;
  prompt: string;               // also 'questionText', 'question', 'text'
  description?: string;         // also 'subtext'
  imageUrl?: string;
  explanation?: string;         // also 'solution'
  options: TestQuestionOption[];
  selectedOptionKey?: string;   // also 'selectedAnswer'
  isMarkedForReview?: boolean;  // also 'flagged'
}

interface TestQuestionOption {
  key: string;    // e.g. 'option1', 'option2', 'a', 'b'
  label: string;  // display text
  isCorrect?: boolean;
}

interface AnswerState {
  selectedOptionKey: string;
  submittedAt?: Date;
  isMarkedForReview?: boolean;
  isCorrect?: boolean;
}

interface AnswerSubmitRequest {
  questionIndex: number;
  selectedAnswer: string;    // option key
}

interface MarkReviewRequest {
  questionIndex: number;
  markForReview: boolean;
}

interface NavigateRequest {
  questionIndex: number;
}
```

### 4.4 Test Summary & Result Models

```typescript
interface TestSummary {
  totalQuestions?: number;
  attempted?: number;      // computed: total - skipped, if not in response
  correct?: number;        // also 'correctAnswers', 'rightAnswers'
  incorrect?: number;      // also 'wrongAnswers', 'incorrectAnswers'; computed: attempted - correct
  skipped?: number;        // also 'skippedQuestions', 'unattempted'
  markedForReview?: number;
  score?: number;
  percentage?: number;     // also 'scorePercentage', 'accuracy'
  timeSpentSeconds?: number;
}

interface TestResult {
  summary?: TestSummary;
  rank?: number;
  percentile?: number;
  feedback?: string;        // also 'remarks'
  completedAt?: Date;
  totalQuestions?: number;
  correctAnswers?: number;
  wrongAnswers?: number;
  skippedQuestions?: number;
  scorePercentage?: number;
  passed?: boolean;         // also 'isPassed', 'hasPassed'
}

interface TestSolution {
  question?: TestQuestion;
  questionText?: string;
  options: Record<string, string>;    // key → label map (option1, option2...)
  selectedAnswerKey?: string;
  correctOptionKey?: string;
  correctAnswerText?: string;
  isCorrect?: boolean;
  explanation?: string;
  media?: string[];
}

interface TestHistoryItem {
  sessionId: string;
  mockTestId?: string;
  mockTestTitle?: string;
  examTitle?: string;
  courseId?: string;
  score?: number;
  percentage?: number;
  correct?: number;
  incorrect?: number;
  attempted?: number;
  totalQuestions?: number;
  completedAt?: Date;
  durationMinutes?: number;
  passed?: boolean;
  attemptNumber?: number;
  status?: string;
}
```

### 4.5 ExamListItem (Test Feature — separate from Exams feature)

```typescript
// Used in test/models/exam_models.dart (separate from exams/data/models)
interface ExamListItem {
  id: string;
  title: string;
  subtitle?: string;
  thumbnailUrl?: string;
  status?: string;
  categoryId?: string;
  categoryName?: string;
  totalQuestions?: number;
  durationMinutes?: number;
  price?: number;
  isFree?: boolean;
  isPurchased?: boolean;
  validFrom?: Date;
  validTo?: Date;
}

interface ExamDetail {
  id: string;
  title: string;
  description?: string;
  totalQuestions?: number;
  durationMinutes?: number;
  timePerQuestionSeconds?: number;
  passingScore?: number;
  isFree?: boolean;
  isPurchased?: boolean;
  price?: number;
  thumbnailUrl?: string;
  validFrom?: Date;
  validTo?: Date;
  instructions: string[];
  courses: ExamCourseDetail[];
  metadata?: Record<string, unknown>;
}

interface ExamCourseDetail {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  enrollmentCost?: number;
  durationHours?: number;
  validityDays?: number;
  isSaved?: boolean;
}
```

---

## 5. State Management

### 5.1 MockTestState

```typescript
interface MockTestState {
  // Courses
  loadingCourses: boolean;
  coursesError: Failure | null;
  courses: CourseModel[];
  selectedCourseId: string | null;

  // Test list
  loadingTests: boolean;
  testsError: Failure | null;
  tests: MockTest[];
  meta: MockTestMeta | null;
  refreshing: boolean;

  // Single test detail
  loadingDetail: boolean;
  detailError: Failure | null;
  selectedTest: MockTest | null;
  selectedTestId: string | null;

  // Computed
  hasCourses: boolean;
  canLoadMore: boolean;   // meta?.hasNext
}
```

**Key behaviors:**
- `mockTestViewModelProvider` auto-calls `loadCourses()` on creation
- `loadCourses()` fetches published courses (`GET /courses?limit=50`), then auto-selects first course and calls `loadMockTests(courseId)`
- `fetchMockTestDetail()` tries in-memory cache first; if not found, calls `fetchMockTests(limit:200)` and searches by ID/slug/legacyId
- `_mergeById()`: merges incoming tests into existing list by ID (prevents duplicates on pagination)
- `updateTestAccess()`: updates `canTakeTest` and `isPurchased` after payment, without re-fetching

### 5.2 TestSessionState (Finite State Machine)

```typescript
enum TestSessionLifecycle {
  notStarted,   // initial
  starting,     // POST /start in progress
  inProgress,   // active test
  paused,       // app backgrounded
  submitting,   // POST /submit in progress
  submitted,    // just submitted
  completed,    // result received
  expired,      // session.endsAt passed
  error         // API failure
}

interface TestSessionState {
  lifecycle: TestSessionLifecycle;
  sessionId: string | null;
  session: TestSession | null;
  lastError: Failure | null;
  recoveryLifecycle: TestSessionLifecycle | null;  // where to go after error recovery
  history: TestHistoryItem[];
  historyLoading: boolean;
  historyError: Failure | null;
}
```

**Key computed properties:**
```typescript
get isNotStarted()  { return lifecycle === 'notStarted'; }
get isStarting()    { return lifecycle === 'starting'; }
get isInProgress()  { return lifecycle === 'inProgress'; }
get isPaused()      { return lifecycle === 'paused'; }
get isSubmitting()  { return lifecycle === 'submitting'; }
get isCompleted()   { return lifecycle === 'completed'; }
get isExpired()     { return lifecycle === 'expired'; }
get isError()       { return lifecycle === 'error'; }
// Legacy aliases (always false in current version):
get isAnswering()   { return false; }
get isNavigating()  { return false; }
```

### 5.3 TestResultController & TestSolutionsController

```typescript
interface TestResultState {
  result: TestResult | null;
  isLoading: boolean;
  error: Failure | null;
}

interface TestSolutionsState {
  items: TestSolution[];
  isLoading: boolean;
  error: Failure | null;
}
```

Both controllers expose:
- `fetch(sessionId, force)` — loads from API
- `hydrate(result)` — immediately sets result without API call (called internally after submit)
- `reset()` — clears state

### 5.4 ExamListViewModel (Exams Feature)

```typescript
interface ExamListState {
  exams: ExamSummary[];
  meta: ExamListMeta | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: Failure | null;
  page: number;
  canLoadMore: boolean;  // meta?.hasNext
}
```

`loadExams(page, append, search, status, sortBy, sortOrder, limit, force)`:
- `append: false` → replaces list (used for new search/filter)
- `append: true` → appends to list (used for pagination)

---

## 6. Application Logic & Business Rules

### 6.1 Session Lifecycle Transitions

```
notStarted ──startTest()──► starting ──success──► inProgress
    ▲                            │                    │
    │                         failure                 │  
    └─────────────────────────── ◄──error──────────────┤
                                                       │
                                            appBackground(>10s)
                                                       │
                                                   submitting
                                                       │
                                                   completed
                                                       │
                                               (loadHistory)
```

### 6.2 Auto-Submit on Background

If the app is backgrounded for **>10 seconds** while `isInProgress`, the session is automatically submitted:

```typescript
const BACKGROUND_THRESHOLD_SECONDS = 10;

function onAppBackground() {
  if (isInProgress) {
    pausedAt = Date.now();
    setLifecycle('paused');
  }
}

async function onAppForeground() {
  if (isPaused && pausedAt) {
    const offlineMs = Date.now() - pausedAt;
    if (offlineMs >= BACKGROUND_THRESHOLD_SECONDS * 1000 || session.isExpired) {
      await submitTest();
    } else {
      setLifecycle('inProgress');
    }
    pausedAt = null;
  }
}
```

### 6.3 Session Crash Recovery

`sessionId` is persisted to `SharedPreferences` immediately after `startSession()` succeeds. On provider creation, `_loadPersistedSessionId()` restores the session if one was in progress:

```typescript
// On app restart / provider recreation:
const savedSessionId = localStorage.getItem('active_test_session_id');
if (savedSessionId) {
  await loadSession(savedSessionId);
}

// Clear after completion:
localStorage.removeItem('active_test_session_id');
```

### 6.4 Timer Computation

The timer is **server-driven** — derived from `session.endsAt`, not from a local countdown:

```typescript
function getRemainingTime(session: TestSession): Duration {
  if (!session.endsAt) return 0;
  const diff = session.endsAt.getTime() - Date.now();
  return diff < 0 ? 0 : diff;
}

function canSubmit(state: TestSessionState): boolean {
  return state.isInProgress && getRemainingTime(state.session!) > 0;
}
```

### 6.5 Session Normalization

After every server refresh (startSession, getSession, after submitAnswer/navigate), the session is "normalized":
1. Merge `answers` map into questions: each question gets its `selectedOptionKey` and `isMarkedForReview` from the answer map
2. Validate `currentQuestionIndex` — clamp to `[0, questions.length - 1]`

```typescript
function normalizeSession(session: TestSession): TestSession {
  const questions = session.questions.map((q, i) => {
    const answer = session.answers[i] ?? session.answers[q.index];
    return {
      ...q,
      selectedOptionKey: answer?.selectedOptionKey ?? q.selectedOptionKey,
      isMarkedForReview: answer?.isMarkedForReview ?? q.isMarkedForReview,
    };
  });
  
  let idx = session.currentQuestionIndex ?? 0;
  if (questions.length === 0) idx = 0;
  else idx = Math.max(0, Math.min(idx, questions.length - 1));
  
  return { ...session, questions, currentQuestionIndex: idx };
}
```

### 6.6 Generation-Based Concurrency Control

Each `startTest()` or `loadSession()` call increments `_sessionGeneration`. Any async operation checks `_shouldApply(generation)` before updating state — if the generation doesn't match, the response is discarded (stale request protection):

```typescript
let sessionGeneration = 0;

function beginNewSession(): number {
  sessionGeneration++;
  return sessionGeneration;
}

function shouldApply(generation: number): boolean {
  return generation === sessionGeneration;
}
```

### 6.7 `canTakeTest` — The Central Access Gate

`canTakeTest` is computed by the backend and is the single source of truth for whether a user can start a test:

```typescript
// If true: show "Start Test" or "Retake Test" button
// If false AND !isFree AND !isPurchased: show "Buy Test" button
// If false AND (isFree OR isPurchased): show "Unavailable"
function getTestCTA(test: MockTest): 'START' | 'BUY' | 'UNAVAILABLE' {
  if (test.canTakeTest) return 'START';
  if (!test.isFree && !test.isPurchased) return 'BUY';
  return 'UNAVAILABLE';
}
```

### 6.8 Exam Pagination (Exams Feature)

```typescript
// Different from courses — uses currentPage/lastPage style, not hasNext
function hasNextPage(meta: ExamListMeta): boolean {
  return meta.currentPage != null && meta.lastPage != null 
    && meta.currentPage < meta.lastPage;
}
```

### 6.9 Option Key Resolution (Flexible API)

The API may return options in multiple formats. The client normalizes everything:

```
1. Standard: { options: [{ key: "option1", label: "..." }] }
2. Map format: { options: { "a": "...", "b": "..." } }
3. Flat fields: { option1: "...", option2: "...", "a": "...", "b": "..." }
4. Correct answer reference: correctOption / correctAnswer / answerKey / answer / solutionKey
```

Option keys like `"a"`, `"option_a"`, `"choice-a"`, `"answera"` all normalize to the same canonical key.

### 6.10 Solution Display Logic

Correct answer resolution (in order of priority):
1. `solution.correctOptionKey` — explicit key from API
2. `question.options[].isCorrect === true` — option marked correct in question data
3. Text match: `solution.correctAnswerText` matched against option labels
4. Reverse lookup: find option label from `correctKey`

`isCorrect` for display (when not in API):
- Normalize both `selectedText` and `correctText` (trim, collapse whitespace, lowercase)
- `isCorrect = normalize(selectedText) === normalize(correctText)`

---

## 7. User Interaction Flow

### 7.1 Exams Tab Flow

```
User opens Exams tab (Tab 3)
  → loadExams(page: 1, status: 'Active') on first render
  → Shows exam card list

User types in search
  → 400ms debounce → loadExams(page: 1, search: query, append: false)

User scrolls to 200px from bottom
  → loadExams(page: current + 1, append: true)

User pull-to-refreshes
  → notifier.refresh() → re-fetches page 1

User taps an exam card
  → ExamDetailPage(examId)
  → loadExamDetail(examId) on init
  → CancelToken used — previous request cancelled if examId changes

User taps a course within exam detail
  → EnrolledCourseDetailsPage(courseId)
```

### 7.2 Mock Test Flow

```
User opens TestPage
  → loadHistory() on init
  → loadCourses(force: true) if courses empty
    → auto-selects first course
    → loadMockTests(courseId) for selected course

User selects a different course from dropdown
  → selectCourse(courseId) → clears tests → loadMockTests(courseId)

User taps "Manage Courses" (edit icon)
  → TestSelectCourse page (browse/select enrolled courses)

User taps a test card (canTakeTest: false or to see details)
  → TestDetailsPage(initialTest)
  → loadMockTestDetail(test.id) on init (loads from cache or API)

User taps "Start Test" in TestDetailsPage or TestPage
  → if canTakeTest: startTest(test.id)
    → POST /test-sessions/start { mockTestId }
    → persist sessionId to SharedPreferences
    → QuizPage(sessionId)
  → if !canTakeTest: navigate to TestDetailsPage

User is in QuizPage
  → selects option → submitAnswer(questionIndex, optionKey)
    → PATCH /test-sessions/{id}/answer
    → GET /test-sessions/{id} (refresh session)
  → taps Previous → navigateQuestion(index - 1)
    → PATCH /test-sessions/{id}/navigate
    → GET /test-sessions/{id}
  → taps Next on last question → showSubmitDialog()
    → on confirm: submitTest()
      → POST /test-sessions/{id}/submit
      → hydrate result locally
      → navigate to ResultPage

User apps out during test (>10s)
  → auto-submitTest() on return
  → navigate to ResultPage

User in ResultPage
  → fetch(sessionId, force: true) on init → GET /test-sessions/{id}/result
  → taps "View Solutions" → fetch solutions → SolutionsPage
  → taps "Done" → popUntil(isFirst)

User in TestHistory tab
  → loadHistory(force: true) on init → GET /test-sessions/history/me
  → taps history item → loadSession(historyItem.sessionId)
    → GET /test-sessions/{id}
    → ResultPage(showDoneButton: false)
    → taps "View Solutions" → GET /test-sessions/{id}/solutions

User taps "Buy Test"
  → opens external browser: /payment/checkout?type=test_purchase&referenceId=...
  → returns to app after payment
  → updateTestAccess(testId, { canTakeTest: true, isPurchased: true }) if webhook confirms
```

---

## 8. Navigation Flow

```
Dashboard
  └── Tab 3: ExamListPage
        └── [exam card] → ExamDetailPage(examId)
              └── [course tile] → EnrolledCourseDetailsPage(courseId)

Course Detail Page (EnrolledCourseDetailsPage)
  └── Tab 4: MockTestList (in-course)
        └── [test tap] → TestDetailsPage(initialTest)
              ├── [Start Test] → QuizPage(sessionId)
              │     └── [Submit] → ResultPage
              │           └── [View Solutions] → SolutionsPage
              └── [Buy Test] → external browser (payment URL)

TestPage (standalone mock test hub)
  ├── [course dropdown] → selectCourse(id) (in-page)
  ├── [edit icon] → TestSelectCourse
  ├── Tab 0: MockTestListView
  │     └── [test tap] → TestDetailsPage
  │           └── (same as above)
  └── Tab 1: TestHistory
        └── [history item] → ResultPage(showDoneButton: false)
              └── [View Solutions] → SolutionsPage
```

### Route Parameters

```typescript
interface ExamDetailRoute {
  examId: string;
}

interface TestDetailsRoute {
  initialTest: MockTest;   // pre-loaded from list (avoids extra API call)
}

interface QuizRoute {
  sessionId: string;
  readOnly?: boolean;   // default false — true for reviewing past sessions
}

interface ResultRoute {
  showDoneButton?: boolean;  // default true
}
// ResultPage and SolutionsPage read from providers — no direct props needed
```

---

## 9. Reusable Components

### ProgressCircle
Used in ResultPage.
```
Props: percentage (0–100, integer)
Layout: Custom painted circular arc
  - Background arc: gray color
  - Foreground arc: primary or success color
  - Center text: "XX%"
```

### DetailsCard
Used in ResultPage.
```
Props: totalQuestions, attempted, correct, incorrect
Layout: Card (elevation 0) with 4 key-value rows
  - "Total Questions" | N
  - "Attempted" | N
  - "Correct" | N
  - "Incorrect" | N
```

### OptionsList
Used in QuizPage.
```
Props:
  question: TestQuestion
  selectedOptionKey: string | null
  onOptionSelected: (option) => void
  readOnly: boolean

Layout: Vertical list of option rows
  - Each row: letter badge (A/B/C/D) + option text
  - Selected: blue[50] background
  - Disabled when readOnly = true
```

### MockTestListView
Used in TestPage Tab 0 and CoursesTab mock test section.
```
Props:
  tests: MockTest[]
  isLoading: boolean
  isLoadingMore: boolean
  errorMessage: string | null
  onRefresh: () => void
  onLoadMore: () => void
  onTestTap: (test) => void
  onStartTest: (test) => void

Filtering: only shows tests where remainingAttempts == null || remainingAttempts > 0

Button logic:
  canTakeTest:
    attemptsUsed == 0  → "Start Test"
    attemptsUsed > 0   → "Retake Test"
  !canTakeTest → "View Details" (navigates to TestDetailsPage)
```

### TestHistory
Used in TestPage Tab 1.
```
Props:
  sessions: TestHistoryItem[]
  isLoading: boolean
  errorMessage: string | null
  onRefresh: () => void
  onHistoryTap: (item) => void

Each row:
  - Test title / examTitle
  - Score percentage
  - Completed date formatted
  - Pass/fail badge (green/red)
```

### ExamCard (`_ExamCard` in ExamListPage)
```
Layout:
  - Card: elevation 1, radius 12
  - 60×60 thumbnail
  - Title (bodyLarge, weight 600)
  - Category chip (primary at 10%)
  - Status chip (success/gray500 at 10% based on status string)
  - Chevron icon
```

---

## 10. Next.js Implementation Notes

### 10.1 Project Structure Suggestion

```
app/
  exams/
    page.tsx              ← ExamListPage
    [examId]/
      page.tsx            ← ExamDetailPage

  tests/
    page.tsx              ← TestPage (mock test hub)
    [testId]/
      page.tsx            ← TestDetailsPage
    session/
      [sessionId]/
        quiz/page.tsx     ← QuizPage
        result/page.tsx   ← ResultPage
        solutions/page.tsx ← SolutionsPage

hooks/
  useExamList.ts          ← paginated exam list
  useExamDetail.ts        ← single exam detail with cancel
  useMockTests.ts         ← course selection + test list
  useTestSession.ts       ← FSM-based session management
  useTestResult.ts        ← result + solutions

lib/
  api/exam-service.ts
  api/mock-test-service.ts
  api/test-session-service.ts
  utils/test-session.ts   ← lifecycle logic, timer, normalization
```

### 10.2 Test Session FSM — React Implementation

```typescript
type TestSessionLifecycle = 
  'notStarted' | 'starting' | 'inProgress' | 'paused' | 
  'submitting' | 'submitted' | 'completed' | 'expired' | 'error';

interface TestSessionState {
  lifecycle: TestSessionLifecycle;
  sessionId: string | null;
  session: TestSession | null;
  lastError: string | null;
  recoveryLifecycle: TestSessionLifecycle | null;
}

// Zustand store
export const useTestSessionStore = create<TestSessionStore>((set, get) => ({
  ...initialState,
  
  startTest: async (mockTestId: string) => {
    set({ lifecycle: 'starting', session: null, sessionId: null });
    
    const result = await testSessionService.startSession(mockTestId);
    if ('error' in result) {
      set({ lifecycle: 'error', lastError: result.error, recoveryLifecycle: 'notStarted' });
      return null;
    }
    
    const session = normalizeSession(result.data);
    localStorage.setItem('active_test_session_id', session.sessionId);
    set({ lifecycle: 'inProgress', session, sessionId: session.sessionId });
    return session;
  },
  
  submitAnswer: async (questionIndex: number, selectedOption: string) => {
    const { sessionId, session } = get();
    if (!sessionId || !session) return;
    
    await testSessionService.submitAnswer(sessionId, { questionIndex, selectedAnswer: selectedOption });
    
    // Refresh session from backend
    const refreshed = await testSessionService.getSession(sessionId);
    if (!('error' in refreshed)) {
      set({ session: normalizeSession(refreshed.data) });
    }
  },
  
  submitTest: async () => {
    const { sessionId, session } = get();
    if (!sessionId || !session) return;
    
    set({ lifecycle: 'submitting' });
    const result = await testSessionService.submitTest(sessionId);
    
    if ('error' in result) {
      set({ lifecycle: 'error', lastError: result.error, recoveryLifecycle: 'inProgress' });
      return;
    }
    
    // Store result immediately
    useTestResultStore.getState().hydrate(result.data);
    localStorage.removeItem('active_test_session_id');
    set({ lifecycle: 'completed', session: { ...session, status: 'completed' } });
  },
}));
```

### 10.3 Timer Component

```tsx
function TestTimer({ endsAt }: { endsAt: Date }) {
  const [remaining, setRemaining] = useState(
    Math.max(0, endsAt.getTime() - Date.now())
  );
  
  useEffect(() => {
    const interval = setInterval(() => {
      const diff = endsAt.getTime() - Date.now();
      if (diff <= 0) {
        setRemaining(0);
        clearInterval(interval);
        // Auto-submit here
        useTestSessionStore.getState().submitTest();
      } else {
        setRemaining(diff);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [endsAt]);
  
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  
  const isWarning = remaining < 5 * 60 * 1000; // < 5 minutes
  
  return (
    <span className={isWarning ? 'text-red-600 font-bold' : 'text-gray-700'}>
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </span>
  );
}
```

### 10.4 Auto-submit on Browser Visibility

```typescript
// Web equivalent of AppLifecycle paused/resumed
useEffect(() => {
  let pausedAt: number | null = null;
  const THRESHOLD = 10 * 1000; // 10 seconds
  
  const handleVisibilityChange = async () => {
    if (document.hidden) {
      pausedAt = Date.now();
    } else {
      if (pausedAt !== null) {
        const offline = Date.now() - pausedAt;
        if (offline >= THRESHOLD || session?.isExpired) {
          await submitTest();
        }
        pausedAt = null;
      }
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, [session]);
```

### 10.5 Options Display in Quiz

```tsx
function OptionsList({ question, onSelect, readOnly }: OptionsListProps) {
  const LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];
  
  return (
    <div className="space-y-3">
      {question.options.map((option, index) => {
        const isSelected = question.selectedOptionKey === option.key;
        return (
          <button
            key={option.key}
            onClick={() => !readOnly && onSelect(option)}
            disabled={readOnly}
            className={`
              w-full flex items-start gap-3 p-4 rounded-xl border transition-colors
              ${isSelected 
                ? 'bg-blue-50 border-blue-300' 
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}
            `}
          >
            <span className="min-w-[32px] h-8 flex items-center justify-center 
                           bg-white border border-gray-300 rounded-lg text-sm font-medium">
              {LABELS[index] ?? option.key}
            </span>
            <span className="text-left text-sm text-gray-800">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
```

### 10.6 Solution Option Tile

```tsx
function SolutionOptionTile({ option, isCorrect, isSelected }: SolutionOptionProps) {
  return (
    <div className={`
      mb-3 p-4 rounded-xl border
      ${isCorrect 
        ? 'bg-green-50/50 border-green-300/60'
        : isSelected 
          ? 'bg-blue-50/50 border-blue-300/60'
          : 'bg-gray-50 border-transparent'}
    `}>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 flex items-center justify-center 
                       bg-white border border-gray-300 rounded-lg text-sm">
          {option.label}
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-800">{option.text}</p>
          {isCorrect && (
            <span className="mt-1 inline-block px-2 py-1 text-xs text-green-600 
                           bg-green-100 rounded-full border border-green-300">
              Correct Answer
            </span>
          )}
          {isSelected && !isCorrect && (
            <span className="mt-1 inline-block px-2 py-1 text-xs text-blue-600 
                           bg-blue-100 rounded-full border border-blue-300">
              Your Answer
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
```

### 10.7 Exam Status Badge Colors

```typescript
function getExamStatusStyle(status: string): { bg: string; text: string } {
  switch (status.toLowerCase()) {
    case 'active':
      return { bg: 'bg-green-100', text: 'text-green-700' };
    case 'inactive':
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-500' };
  }
}
```

### 10.8 Key Gotchas for Web Rebuild

1. **Two separate exam systems** — `lib/features/exams/` is only for browsing the exam catalogue. `lib/features/test/` is the actual test-taking engine. Don't confuse `ExamListItem` (test feature) with `ExamSummary` (exams feature) — they are different models.

2. **`canTakeTest` is server-controlled** — Never compute access locally. Always use the `canTakeTest` field from the API response. It accounts for enrollment, payment, attempt limits, and validity windows.

3. **No dedicated mock test detail endpoint** — `fetchMockTestDetail()` re-fetches the full list with `limit=200` and searches client-side. Optimize on web by caching the list response.

4. **Test matching is fuzzy** — A mock test can be identified by `id`, `extra.slug`, or `extra.mockTestId`. Always check all three when looking up a test by any ID.

5. **Session ID must be persisted** — Store in `localStorage` after start, remove after completion. This is the crash-recovery mechanism.

6. **Timer is server-driven** — Don't trust local elapsed time. Compute remaining time from `session.endsAt` on every tick.

7. **Answer submission refreshes session** — After `submitAnswer()`, the entire session is re-fetched to get updated question state. The answer state in questions is normalized from the `answers` map.

8. **Result page is stateless** — It reads from `testResultControllerProvider`. When navigating to result from history (not from quiz), call `fetch(sessionId)` rather than `hydrate()`.

9. **Solutions option keys are inconsistent** — Options may be keyed `option1`/`option2`, `a`/`b`, or `A`/`B`. The client resolves correct answers by:
   - Matching `correctOptionKey` (case-insensitive) against option keys
   - Falling back to text matching between `correctAnswerText` and option labels
   - Final fallback: `question.options[].isCorrect === true`

10. **HTML in descriptions** — `MockTest.description` and exam descriptions can contain raw HTML. Use `dangerouslySetInnerHTML` or a safe HTML renderer like `DOMPurify + dangerouslySetInnerHTML`.

11. **`isFree` field inconsistency** — Like `hasOffer` in courses, `isFree` may be boolean, `"true"`, or `1`. Always normalize before comparison.

12. **Payment opens external browser** — Do NOT try to handle payment in an iframe or embedded webview for the web. Open in new tab. Listen for return via URL params or a webhook-triggered state update.
