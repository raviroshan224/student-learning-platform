# Developer Notes & Potential Pitfalls

This document summarizes non-obvious details and architectural "gotchas" discovered within the Flutter 'Test' feature codebase.

## 1. No Dedicated Mock Test Detail API

As of the current implementation, there is no direct endpoint for `GET /mock-tests/{id}`.

- **Mobile Implementation:** Calls `fetchMockTests(courseId, limit: 200)` and manually iterates over the results to find a matching ID.
- **Next.js Recommendation:** Request a dedicated detail endpoint from the backend team. If not possible, cache the `mock-tests` list at the course level to avoid redundant, expensive full-fetch calls.
- **Reference:** [lib/features/test/service/mock_test_service.dart#L68](file:///C:/Users/shiwa/StudioProjects/olp_mobileapp/lib/features/test/service/mock_test_service.dart#L68)

---

## 2. Inconsistent Identification (ID vs Slug vs legacyId)

The backend responses for mock tests often contain overlapping ID fields in the `extra` metadata object.

- **Check Order:**
    1.  Root `id` field.
    2.  `extra['slug']`.
    3.  `extra['mockTestId']`.
- **Implementation:** [lib/features/test/service/mock_test_service.dart#L90-L105](file:///C:/Users/shiwa/StudioProjects/olp_mobileapp/lib/features/test/service/mock_test_service.dart#L90-L105)

---

## 3. Options Parsing Fallbacks

The backend occasionally returns "flattened" options (`option1`, `option2`, etc.) instead of a structured `options` list.

- **Safety Logic:** The mobile app includes a complex `_buildFallbackOptions` function that attempts to reconstruct the options list from arbitrary keys.
- **Web Recommendation:** Implement a similar defensive parsing layer in your API client or use the `TestQuestion` model provided in `Models.md` to normalize the data before it reaches the UI.
- **Reference:** [lib/features/test/models/test_session_models.dart#L728](file:///C:/Users/shiwa/StudioProjects/olp_mobileapp/lib/features/test/models/test_session_models.dart#L728)

---

## 4. UI TODOs & Suggestions

- **Screenshot Blocking:** The mobile app has code placeholders for `blockScreenshots()`. For the web, consider using the `onCopy` and `onContextMenu` event listeners to restrict basic copy-pasting of question paper content.
- **Time Sync:** Since local system clocks can be inaccurate, always use the relative difference from the first API response's `Date` header (or a dedicated sync-time endpoint) to adjust the `endsAt` timer in the `QuizPage`.
