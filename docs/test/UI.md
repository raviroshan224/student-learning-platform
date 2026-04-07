# Test Feature UI & Screens

This document maps each screen of the "Test" feature to its relative Flutter source file and specifies the state and props required for its reimplementation in Next.js.

## 1. Screen Mapping

| Screen | Purpose | Source File | Route |
|--------|---------|-------------|-------|
| `TestsPage` | User's test history and enrollment summary. | [lib/features/test/presentation/pages/test_page.dart](file:///C:/Users/shiwa/StudioProjects/olp_mobileapp/lib/features/test/presentation/pages/test_page.dart) | `/tests` |
| `TestDetailsPage` | Description, instructions, and test metadata. | [lib/features/test/presentation/pages/detail_pages/test_details.dart](file:///C:/Users/shiwa/StudioProjects/olp_mobileapp/lib/features/test/presentation/pages/detail_pages/test_details.dart) | `/tests/:testId` |
| `QuizPage` | Active test engine: questions, options, and timer. | [lib/features/test/presentation/pages/detail_pages/quiz_page.dart](file:///C:/Users/shiwa/StudioProjects/olp_mobileapp/lib/features/test/presentation/pages/detail_pages/quiz_page.dart) | `/tests/session/:sessionId` |
| `ResultPage` | Final score, performance metrics, and feedback. | [lib/features/test/presentation/pages/detail_pages/result_page.dart](file:///C:/Users/shiwa/StudioProjects/olp_mobileapp/lib/features/test/presentation/pages/detail_pages/result_page.dart) | `/tests/session/:sessionId/result` |
| `SolutionPage` | Post-test review of correct answers and explanation. | [lib/features/test/presentation/pages/detail_pages/solution_page.dart](file:///C:/Users/shiwa/StudioProjects/olp_mobileapp/lib/features/test/presentation/pages/detail_pages/solution_page.dart) | `/tests/session/:sessionId/solutions` |

---

## 2. Navigation Flow

```mermaid
graph TD
    A[Home / History] -->|Select Test| B[Test Details]
    B -->|Start Test| C[Quiz Page]
    C -->|Submit| D[Confirm Dialog]
    D -->|Confirm| E[Result Page]
    E -->|View Solutions| F[Solution Page]
    C -->|Timer End| E
    C -->|Auto-Submit (10s Background)| E
```

---

## 3. Key Components & Props

### Quiz Engine (QuizPage)
- **Props:** `sessionId`, `isReadOnly` (bool).
- **State:** `TestSessionState` from `TestSessionViewModel`.
- **Key Widgets:**
    - `OptionsList`: [lib/features/test/presentation/widgets/option_list.dart] - Manages selection.
    - `SubmitDialog`: [lib/features/test/presentation/widgets/submit_dialog.dart] - Confirmation counts.

### Result View (ResultPage)
- **Props:** `sessionId`.
- **Key Sections:**
    - `PerformanceCard`: Score, rank, percentile.
    - `SummaryGrid`: Total vs Correct vs Skipped.
    - `ActionButtons`: Retake, Solutions, or Course Home.

---

## 4. Required Next.js Components

For a premium web experience, implement the following web equivalents:

1.  **QuestionNavigator**: A sidebar or grid of question numbers (1..N) with status colors (Attempted: Green, Marked: Purple, Current: Blue).
2.  **StickyTimer**: A fixed header component that stays visible even during long-question scrolls.
3.  **FloatingActions**: "Previous", "Mark for Review", and "Next/Submit" buttons pinned to the bottom of the viewport.
4.  **HtmlRenderer**: Since prompts and explanations often contain HTML (uses `flutter_html` in mobile), use `dangerouslySetInnerHTML` with a robust sanitizer.
