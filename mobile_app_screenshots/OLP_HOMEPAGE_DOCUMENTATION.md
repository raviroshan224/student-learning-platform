# OLP Home Page — Complete Technical Documentation

> **Purpose:** Full technical breakdown of the Home Page so the same page can be built precisely in Next.js.  
> **Source:** Deep analysis of `lib/features/home/` — all pages, widgets, view models, services, and models.

---

## Table of Contents

1. [Home Page Overview](#1-home-page-overview)
2. [UI Component Breakdown](#2-ui-component-breakdown)
3. [API Integrations](#3-api-integrations)
4. [Data Models](#4-data-models)
5. [State Management](#5-state-management)
6. [Application Logic](#6-application-logic)
7. [User Interaction Flow](#7-user-interaction-flow)
8. [Navigation Flow](#8-navigation-flow)
9. [Components & Reusable UI](#9-components--reusable-ui)
10. [Implementation Notes for Web Version](#10-implementation-notes-for-web-version)

---

## 1. Home Page Overview

The Home Page is the **first tab (index 0)** of the main Dashboard. It is a personalized, data-rich feed screen that serves as the central hub for a logged-in student.

### Key Characteristics

| Property | Value |
|---|---|
| **File** | `lib/features/home/presentation/pages/home_page.dart` |
| **Widget type** | `ConsumerStatefulWidget` (Riverpod-aware, has state) |
| **Layout** | `SafeArea` → `Stack` → `RefreshIndicator` → `SingleChildScrollView` → `Column` |
| **Background color** | `AppColors.white` (#FFFFFF) |
| **Global padding** | `left: 16, right: 16, top: 12, bottom: 12` |
| **Scroll physics** | `AlwaysScrollableScrollPhysics` (always scrollable for pull-to-refresh) |
| **Loading state** | Full-screen Shimmer skeleton (whole page replaced) |
| **Empty/Error** | Inline error banner at top with Retry button |

### Sections (top to bottom order)

1. Error Banner _(conditional — only if API failed)_
2. Header — Avatar + Greeting + Subtitle
3. Search Bar _(tappable, navigates to SearchPage)_
4. Banner Slider _(auto-play carousel from bannerCourses)_
5. Recommended Courses _(horizontal scrollable cards)_
6. Latest Ongoing Course _(continue learning card)_
7. Upcoming Classes _(upcoming live class list)_
8. Live Classes _(currently live/joinable classes)_
9. Upcoming Exams _(single exam card with countdown)_
10. Preferred Categories _(horizontal category chips)_
11. Grab the Deals _(top category's discounted courses)_

---

## 2. UI Component Breakdown

### Section 1 — Error Banner
**Widget:** `_ErrorBanner` (private inline class)  
**Visible when:** `state.error != null` (API failed)  
**Layout:**
```
┌─────────────────────────────────────────┐
│ [error message text]         [Retry →]  │ ← red-tinted container
└─────────────────────────────────────────┘
```
**Styling:**
- Background: `AppColors.failure.withOpacity(0.1)` — very light red
- Border: `AppColors.failure.withOpacity(0.4)`
- Border radius: 12px
- Padding: 12px all sides
- Margin bottom: 16px
- Error text: `TextType.bodySmall`, color `AppColors.failure`
- Retry button: `TextButton`, color `AppColors.secondary`

**Interaction:** Tapping "Retry" calls `notifier.getHomepageData(forceRefresh: true)`

---

### Section 2 — Header
**Widget:** Inline `Row` in `_buildNormalBody`  
**Layout:**
```
[Avatar 56×56]  [Hey, {firstName}]
                [Find a course you are interested in]
```
**Details:**
- Avatar: `CircleAvatar`, radius 28px
  - Source: `profilePhotoUrl` (resolved from `state.userProfile?.photo`)
  - Fallback: `AppAssets.loginBg` (local asset)
  - Tappable → navigates to `ProfilePage`
- Greeting text: `"Hey, {firstName}"` — only shows first word of fullName
  - Style: `TextType.headlineSmall`, bold, color `AppColors.black`
- Subtitle text: `"Find a course you are interested in"`
  - Style: `TextType.bodySmall`, color `AppColors.gray600`
- Gap between avatar and text column: 12px

**Data used:** `state.userProfile?.fullName`, `state.userProfile?.photo`

**Image URL normalization:** If `photo` is a bare filename (not starting with `http`), it is prefixed with `https://olp-uploads.s3.us-east-1.amazonaws.com/`

---

### Section 3 — Search Bar
**Widget:** `GestureDetector` wrapping `AbsorbPointer` wrapping `CustTextField`  
**Layout:**
```
┌─────────────────────────────────────────┐
│  🔍  Search courses or mock tests        │  ← full-width field, NOT editable
└─────────────────────────────────────────┘
```
**Details:**
- The field is NOT interactive here (AbsorbPointer absorbs all touches)
- The GestureDetector captures the tap and navigates to `SearchPage`
- Icon: SVG from `AppAssets.searchIcon`, padded 12px
- Hint: `"Search courses or mock tests"`, color `AppColors.gray400`
- Border radius: 8px
- Background: white
- Border: 1px `AppColors.border` (#D8E1E9)

**Purpose:** Acts as a navigation button, not an actual input field.

---

### Section 4 — Banner Slider (HomeSliders)
**Widget:** `HomeSliders` (ConsumerWidget)  
**File:** `lib/features/home/presentation/widgets/slider/home_slider.dart`

**Layout:**
```
┌─────────────────────────────────────────┐
│                                         │
│          [Course Image 16:9]            │  ← auto-playing carousel
│                                         │
│         ●  ○  ○  ○                     │  ← dot indicators (bottom)
└─────────────────────────────────────────┘
```

**Data source:** `state.bannerCourses` (list of `Course` objects from homepage API)  
**Fallback:** If `bannerCourses` is empty, uses `state.recommendedCourses` images  
**If still empty:** Returns `SizedBox.shrink()` (section hidden completely)

**Carousel behavior:**
- Package: `carousel_slider`
- Aspect ratio: `16:9`
- Auto-play: `true`
- Infinite scroll: `true`
- `viewportFraction: 1.0` (full width, no peeking)
- `padEnds: true`

**Dot indicators (custom):**
- Active dot: width 16px, height 8px, color `AppColors.primary` (#1C3B5A)
- Inactive dot: width 8px, height 8px, color `AppColors.gray300`
- Border radius: 8px (pill shape)
- Positioned bottom-center (12px from bottom)
- Tappable to jump to that slide

**State:** `currentSlideIndexProvider` (StateProvider<int>) tracks active dot

**Each slide:**
- ClipRRect with 12px border radius
- 8px padding around image
- BoxFit.cover
- Tappable → navigates to `EnrolledCourseDetailsPage(courseId: course.id)`

---

### Section 5 — Recommended Courses
**Widget:** `RecommendedCourse` → `CourseCard` → `HomeCourseCard`  
**Files:**
- `lib/features/home/presentation/widgets/recommended_course.dart`
- `lib/features/home/presentation/widgets/home_course_card.dart`

**Section header:** `TitleTextRow("Recommended Courses", showSubTitle: true)`  
- "See All" button → navigates to `ExplorePage`

**Visibility rule:** Hidden only if `state.hasData == true` AND `recommendedCourses.isEmpty`  
_(Shows shimmer while loading, shows section once data arrives even if empty-ish)_

**Layout:**
```
Recommended Courses          [See All →]
┌──────────┐ ┌──────────┐ ┌──────────┐
│  [img]   │ │  [img]   │ │  [img]   │  ← horizontal scroll
│  Title   │ │  Title   │ │  Title   │
│  2h •FREE│ │ 3h • Rs X│ │  4h      │
└──────────┘ └──────────┘ └──────────┘
     ← swipe →
```

**Card dimensions (HomeCourseCard):**
- Fixed width: 160px
- Fixed height: 256px
- Image: 140px height, full-width, top rounded corners (12px)
- Content: 10px all padding

**Course card internal structure:**
```
┌───────────────────────┐
│  [Course Image 140px] │
│  ┌──────────────────┐ │
│  │ [% OFF] badge    │ │  ← top-left badge (red for discount, green for FREE)
│  └──────────────────┘ │
│  [🔖 bookmark icon]   │  ← top-right, white circle bg
│                       │
│  Course Title (2 ln)  │
│  🕐 Xh content        │
│  Rs X,XXX  ~~Rs X~~   │  ← price or "Free"
└───────────────────────┘
```

**Badge logic:**
- `FREE` (green #0F9D58): `enrollmentCost == 0`
- `X% OFF` (red #EA4335): `hasOffer == true && enrollmentCost > discountedPrice`
- Discount % formula: `((original - discounted) / original * 100).round()`

**Price display logic:**
```
if isFree → "Free" (green, 16px bold)
else if hasValidDiscount → "Rs {discounted}" + "~~Rs {original}~~" (strikethrough)
else if enrollmentCost != null → "Rs {enrollmentCost}"
else → nothing
```

**Number format:** Indian locale `#,##,###` (e.g., 1,999 or 12,999)

**Bookmark (save) icon:**
- `Icons.bookmark` (filled, primary color) if saved
- `Icons.bookmark_border` (gray600) if not saved
- Tap calls `coursesViewModelProvider.notifier.toggleSave(courseId, currentlySaved)`

**Image resolution:** `courseIconUrl` preferred over `courseImageUrl`

**Data mapping** (in `home_page.dart`):
```dart
CourseCardData(
  title: course.courseTitle,
  subtitle: "${durationHours}h content • ${validityDays}d access",
  imageUrl: courseIconUrl ?? courseImageUrl,
  courseId: course.id,
  isSaved: course.isSaved,
  enrollmentCost: course.enrollmentCost,
  discountedPrice: course.discountedPrice,
  hasOffer: course.hasOffer,
  durationHours: course.durationHours,
  validityDays: course.validityDays,
)
```

---

### Section 6 — Latest Ongoing Course (Continue Learning)
**Widget:** `CourseTrackCard`  
**File:** `lib/features/home/presentation/widgets/course_track_card.dart`

**Section header:** `TitleTextRow("Latest Ongoing Course", showSubTitle: false)`  
**Visibility rule:** Hidden only if `state.hasData == true` AND `state.latestOngoingCourse == null`

**Layout (170px height card):**
```
┌─────────────────────────────────────────────────┐
│  [blurred bg image — full card]                  │
│  [dark gradient overlay]                         │
│  ┌──────────────┐  Course Title               │
│  │              │  Last lecture title          │
│  │  [thumbnail] │  [5/20] ████████░░ 45%       │
│  │  [▶ play]    │                              │
│  │  110×110     │  Resume Watching             │
│  └──────────────┘                              │
└─────────────────────────────────────────────────┘
```

**Background:**
- Blurred version of `lastAccessedLectureThumbnail` or `courseImageUrl` (sigmaX: 2.0, sigmaY: 2.0)
- Fallback: purple-blue gradient (`#6A11CB → #2575FC`)
- Dark gradient overlay: `rgba(0,0,0,0.35) → rgba(0,0,0,0.20)` top to bottom

**Thumbnail (110×110px):**
- Shows lecture thumbnail or course image
- If has lecture: shows Play icon overlay (`Icons.play_circle_fill`, 40px, white)
- Border radius: 12px

**Progress row:**
- Completed/total lectures chip: white-tinted container (`rgba(255,255,255,0.12)`)
- `LinearProgressIndicator`: value = `progressPercentage / 100`
  - Background: `rgba(255,255,255,0.15)`
  - Active: `AppColors.primary` (#1C3B5A)
  - Height: 8px
- Percentage text: white

**Empty state (when `course == null`):**
- Gray-100 container, 140px height, center-aligned text
- Text: `"No ongoing course yet. Start learning to see progress here."`

**Tap behavior:**
1. If `lastAccessedLectureId` is present: calls `courseService.watchLecture(lectureId)` → navigates to `VideoPlayerPage`
2. If API fails or no lecture: navigates to `EnrolledCourseDetailsPage`

**Data fields used:**
- `progressPercentage` → progress bar
- `completedLectures`, `totalLectures` → "X/Y" counter
- `lastAccessedLectureTitle` → subtitle under course title
- `lastAccessedLectureThumbnail` → thumbnail image
- `lastAccessedLectureId` → determines if "Resume" is available
- `lastWatchedPositionSeconds` → _(passed to VideoPlayer for seek position)_

---

### Section 7 — Upcoming Classes
**Widget:** `LiveClasses` (with `isUpcoming: true`)  
**File:** `lib/features/home/presentation/widgets/live_classes.dart`

**Section header:** `TitleTextRow("Upcoming Classes", showSubTitle: true)`
- "See All" → navigates to `UpcomingLiveClassesPage`

**Visibility rule:** Hidden if `state.hasData == true` AND `state.upcomingLiveClasses.isEmpty`

**Layout (each item):**
```
┌─────────────────────────────────────────────────┐
│  [thumbnail]  Class Title               [Upcoming]│
│   60×60       Scheduled: Jan 15, 2:00 PM         │ ← disabled gray button
└─────────────────────────────────────────────────┘
```

**Card styling:**
- White background
- Border: 1px `AppColors.gray200`
- Border radius: 12px
- Padding: 12px

**Upcoming class button:**
- Label: `"Upcoming"` (not `"Join Now"`)
- Background: `AppColors.gray300` (disabled, not clickable)
- `onPressed: null` (disabled)

**Date formatting:**
- Uses `DateTimeHelper.formatForUI(scheduledAt.toLocal())`
- Falls back to `"Schedule to be announced"` if null

**Data source:** `state.upcomingLiveClasses` (from **separate API call** to `/live-classes/my-classes?status=upcoming`)

---

### Section 8 — Live Classes
**Widget:** `LiveClasses` (with `isUpcoming: false`)

**Section header:** `TitleTextRow("Live Classes", showSubTitle: false)`  
**Visibility rule:** Hidden if `state.hasData == true` AND `state.liveClasses.isEmpty`

**Layout:** Same as Upcoming Classes but with active "Join Now" button

**Live class button:**
- Label: `"Join Now"`
- Background: `AppColors.secondary` (#2A5D9F, enabled)
- Tap: calls `liveClassJoinViewModelProvider.notifier.joinLiveClass(classId)`
  - Fetches Zoom join token via `POST /live-classes/{id}/join-token`
  - On success: navigates to `MeetingPageV2(token, classId)`
  - After returning from meeting: calls `notifier.reset()`

**Data source:** `state.liveClasses` (from homepage API `liveClasses` field)

---

### Section 9 — Upcoming Exams
**Widget:** Inline `Container` in `_buildNormalBody`

**Section header:** `TitleTextRow("Upcoming Exams", showSubTitle: true)`
- "See All" → navigates to `ExamListPage`

**Visibility rule:** Hidden if `state.hasData == true` AND `upcomingExam == null`

**Layout (single exam card):**
```
┌─────────────────────────────────────────┐
│  [Exam Banner Image — AspectRatio 2.5]  │
├─────────────────────────────────────────┤
│  Exam Title (2 lines max)               │
│  "Exam Date: Jun 15, 2024"              │
│    OR  "45 days remaining"              │
└─────────────────────────────────────────┘
```

**Date display priority:**
1. If `examDate != null` → `"Exam Date: {MMM d, yyyy}"`  (formatted with `DateFormat('MMM d, yyyy')`)
2. Else if `daysUntilExam != null` → `"{N} days remaining"`
3. Else → `"Stay tuned for the exam schedule."`

**Card styling:**
- White background
- Border radius: 12px
- Box shadow: `rgba(0,0,0,0.06)` blur 8px, offset (0,2)
- Image: `AspectRatio(2.5)`, top corners rounded, `BoxFit.cover`
- Info padding: 12px all

**Tap:** navigates to `ExamDetailPage(examId: upcomingExam.id)`
- If `id == null`: shows snackbar error `"Exam information is incomplete."`

---

### Section 10 — Preferred Categories
**Widget:** `PreferredCategoryList`  
**File:** `lib/features/home/presentation/widgets/preferred_category_list.dart`

**Section header:** `TitleTextRow("Preferred Categories", showSubTitle: false)`  
**Visibility rule:** Hidden if `state.hasData == true` AND `state.preferredCategories.isEmpty`

**Category update loading indicator:** `LinearProgressIndicator` shown above list while `state.updatingCategory == true`  
**Category update error:** Error text shown if `state.updateError != null`

**Layout (horizontal scroll, height 130px):**
```
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│  [icon] │ │  [icon] │ │  [icon] │ │  [icon] │  ← horizontal scroll
│  Civil  │ │Computer │ │ Mech.   │ │ Banking │
└─────────┘ └─────────┘ └─────────┘ └─────────┘
```

**Category card (100px wide):**
```
┌─────────────────┐
│  [Category      │  ← category image, contain fit, 12px padding
│   icon/image]   │
│─────────────────│
│  Category Name  │  ← gray-100 bg, 12px font, w600, 2 lines max
└─────────────────┘
```

- Border radius: 16px
- White background + shadow
- Border: 1px `AppColors.gray100`
- Text section: `AppColors.gray100` background, bottom radius 16px
- Press animation: ScaleTransition from 1.0 → 0.97 (150ms `easeInOut`)

**Tap:** navigates to `ExplorePage(initialCategoryId: category.id)`

---

### Section 11 — Grab the Deals
**Widget:** `GrabTheDealList`  
**File:** `lib/features/home/presentation/widgets/grab_the_deal.dart`

**Section header:** `TitleTextRow("Grab the Deals", showSubTitle: false)`  
**Visibility rule:** Hidden if `topCategory == null || topCategory.courses.isEmpty`

**Layout (vertical list of deal items):**
```
┌────────────────────────────────────────────┐
│  ┌────────┐  Course Title (2 lines)        │
│  │ [img]  │  Category Name                 │
│  │ 80×80  │  Rs 1,999  ~~Rs 2,999~~  12d   │
│  │[% OFF] │                                │
│  └────────┘                                │
└────────────────────────────────────────────┘
```

**Card styling:**
- White background
- Border: 1px `AppColors.gray200`
- Border radius: 12px
- Padding: 12px
- Gap between items: 12px

**Image:**
- 80×80px, border radius 8px
- Badge overlaid: same "FREE" and "% OFF" badge logic as course cards
- Badge position: top-left, with bottom-right corner also rounded (asymmetric)

**Price display:** Same logic as `HomeCourseCard` but:
- Discounted price: 14px, bold, `AppColors.primary`
- Original strikethrough: 11px, `AppColors.gray500`
- Free badge: small green container pill

**Validity display:** `"Xd access"` with `Icons.access_time` (14px, gray500) — right-aligned

**Tap:** navigates to `EnrolledCourseDetailsPage(courseId: course.id)`

---

### Section 12 — Loading State (Full Shimmer)
**Widget:** `_buildShimmerPlaceholder()`

When `state.loading == true` (initial load), the **entire page** is replaced with a shimmer skeleton:
- Package: `shimmer`
- Base color: `Colors.grey.shade300`
- Highlight color: `Colors.grey.shade100`
- Contains placeholder shapes for every section (header, search, slider, sections...)
- `NeverScrollableScrollPhysics` during shimmer (user can't scroll)

**Per-section shimmer (after first load):**
- `_SectionShimmer.list(height: N)` — horizontal list placeholder
- `_SectionShimmer.card(height: N)` — full-width card placeholder
- These show for individual sections while `!state.hasData` (initial state before first API response)

---

## 3. API Integrations

### API 1 — GET /homepage

**Primary data source for the entire Home Page.**

```
API Name:       Homepage Data
Endpoint:       GET /homepage
Full URL:       https://scholargyan.onecloudlab.com/api/v1/homepage
Method:         GET
Auth:           Required — Authorization: Bearer {token}
Called by:      HomepageViewModel.getHomepageData()
Called when:    Provider initialized (auto on mount) + pull-to-refresh
Used in:        All sections (Header, Slider, Recommended, Ongoing, Live, Exam, Categories, Deals)
```

**Request:** No body, no query parameters

**Response structure:**
```json
{
  "userProfile": {
    "fullName": "Ram Sharma",
    "photo": "https://olp-uploads.s3.../avatar.jpg"
  },
  "preferredCategories": [
    {
      "id": "cat_uuid",
      "categoryName": "Civil Engineering",
      "categoryImageUrl": "civil.svg"
    }
  ],
  "recommendedExams": [
    {
      "id": "exam_uuid",
      "title": "Loksewa 2024",
      "examImageUrl": "loksewa.jpg",
      "category": "Civil Service",
      "validityDays": 365,
      "daysUntilExam": 45,
      "examDate": "2024-06-15T00:00:00.000Z"
    }
  ],
  "recommendedCourses": [
    {
      "id": "course_uuid",
      "courseTitle": "Civil Engineering Complete",
      "courseImageUrl": "civil_banner.jpg",
      "courseIconUrl": "civil_icon.png",
      "categoryName": "Civil Engineering",
      "enrollmentCost": 2999,
      "discountedPrice": 1999,
      "hasOffer": true,
      "durationHours": 120,
      "validityDays": 365,
      "isSaved": false
    }
  ],
  "bannerCourses": [
    {
      "id": "course_uuid",
      "courseTitle": "...",
      "courseImageUrl": "banner.jpg"
    }
  ],
  "latestOngoingCourse": {
    "id": "course_uuid",
    "courseTitle": "Civil Engineering Complete",
    "courseImageUrl": "civil_banner.jpg",
    "progressPercentage": 45.5,
    "completedLectures": 9,
    "totalLectures": 20,
    "lastAccessedLectureId": "lecture_uuid",
    "lastAccessedLectureTitle": "Lecture 9: Soil Mechanics",
    "lastAccessedLectureThumbnail": "thumb.jpg",
    "lastWatchedPositionSeconds": 300
  },
  "liveClasses": [
    {
      "id": "class_uuid",
      "title": "Structural Analysis Class",
      "scheduledAt": "2024-06-01T10:00:00.000Z",
      "thumbnailUrl": "class_thumb.jpg"
    }
  ],
  "upcomingExam": {
    "id": "exam_uuid",
    "title": "Loksewa Aayog 2024",
    "examImageUrl": "loksewa.jpg",
    "examDate": "2024-06-15T00:00:00.000Z",
    "daysUntilExam": 45
  },
  "topCategoryWithCourses": {
    "categoryId": "cat_uuid",
    "categoryName": "Engineering",
    "categoryImageUrl": "eng.svg",
    "courses": [
      {
        "id": "course_uuid",
        "courseTitle": "...",
        "courseImageUrl": "...",
        "enrollmentCost": 1999,
        "discountedPrice": 999,
        "hasOffer": true,
        "validityDays": 180,
        "categoryName": "Civil Engineering"
      }
    ]
  }
}
```

---

### API 2 — GET /live-classes/my-classes

**Fetches upcoming live classes separately from the homepage API.**

```
API Name:       Upcoming Live Classes
Endpoint:       GET /live-classes/my-classes
Full URL:       https://scholargyan.onecloudlab.com/api/v1/live-classes/my-classes
Method:         GET
Auth:           Required
Called by:      HomepageViewModel.getHomepageData() — AFTER homepage API succeeds
Used in:        "Upcoming Classes" section
```

**Query parameters:**
```
status=upcoming
page=1
limit=5
```

**Response:** Array or object with `data` array of `LiveClassModel`
```json
[
  {
    "id": "class_uuid",
    "title": "Structural Analysis Class",
    "status": "upcoming",
    "startTime": "2024-06-05T10:00:00.000Z",
    "endTime": "2024-06-05T11:30:00.000Z",
    "durationMinutes": 90,
    "courseId": "course_uuid",
    "courseTitle": "Civil Engineering",
    "subjectName": "Structural Engineering",
    "lecturerName": "Prof. Ram Sharma",
    "lecturerImageUrl": "...",
    "bannerImageUrl": "class_banner.jpg"
  }
]
```

**Dependency:** This call only runs if the `/homepage` call succeeds (`result.isRight`).

---

### API 3 — GET /homepage/search

**Used in `SearchPage` (opened from Home Page search bar).**

```
API Name:       Homepage Search
Endpoint:       GET /homepage/search
Full URL:       https://scholargyan.onecloudlab.com/api/v1/homepage/search
Method:         GET
Auth:           Required
Called by:      HomeSearchViewModel._performSearch()
Used in:        SearchPage — courses and mock tests results
```

**Query parameters:**
```
q={searchTerm}    (minimum 2 characters)
limit=10
```

**Debounce:** 300ms after last keystroke  
**Cancel token:** Previous request cancelled if new query typed

**Response:**
```json
{
  "courses": [
    {
      "id": "...",
      "courseTitle": "Civil Engineering",
      "courseImageUrl": "...",
      "categoryName": "Engineering",
      "enrollmentCost": 2999,
      "discountedPrice": 1999,
      "hasOffer": true,
      "durationHours": 120,
      "relevanceScore": 0.95
    }
  ],
  "mockTests": [
    {
      "id": "...",
      "courseId": "...",
      "title": "Full Mock Test 1",
      "description": "100 questions",
      "cost": 0,
      "durationMinutes": 120,
      "relevanceScore": 0.87
    }
  ],
  "totalCourses": 5,
  "totalMockTests": 3
}
```

---

### API 4 — PUT /homepage/latest-category

**Updates the user's selected "Grab the Deals" category.**

```
API Name:       Update Latest Category
Endpoint:       PUT /homepage/latest-category
Full URL:       https://scholargyan.onecloudlab.com/api/v1/homepage/latest-category
Method:         PUT
Auth:           Required
Called by:      HomepageViewModel.updateLatestCategory(categoryId)
Used in:        Preferred Categories section (when user changes preferred category)
```

**Request body:**
```json
{ "categoryId": "category_uuid" }
```

**Response:**
```json
{
  "message": "Category updated successfully",
  "categoryId": "category_uuid"
}
```

**After success:** Calls `getHomepageData(forceRefresh: true)` to refresh homepage content.

---

### API 5 — POST /live-classes/{id}/join-token

**Gets Zoom SDK JWT token to join a live class.**

```
API Name:       Live Class Join Token
Endpoint:       POST /live-classes/{id}/join-token
Method:         POST
Auth:           Required
Called by:      LiveClassJoinViewModel.joinLiveClass(classId)
Used in:        "Join Now" button in Live Classes section
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "sessionName": "Structural Analysis Class",
  "userName": "Ram Sharma",
  "meetingId": "meeting123",
  "password": null
}
```

---

### API 6 — GET /lectures/{id} (Watch)

**Gets video playback URL when user taps "Resume Watching".**

```
API Name:       Watch Lecture
Endpoint:       GET /lectures/{id} (with watch endpoint)
Called by:      CourseTrackCard._handleTap() via courseService.watchLecture(lectureId)
Used in:        "Latest Ongoing Course" → tap to resume
```

**Response:** Object with video URL keys tried in order: `url`, `videoUrl`, `signedUrl`, `playbackUrl`, `streamUrl`

---

## 4. Data Models

### HomepageResponse

Top-level response from `GET /homepage`:

```typescript
interface HomepageResponse {
  userProfile?: UserProfile;
  preferredCategories: Category[];
  recommendedExams: Exam[];
  recommendedCourses: Course[];
  bannerCourses: Course[];
  latestOngoingCourse?: LatestOngoingCourse;
  liveClasses: LiveClass[];         // Currently active/ongoing
  upcomingExam?: UpcomingExam;
  topCategoryWithCourses?: TopCategoryWithCourses;
}
```

---

### UserProfile (homepage subset)

```typescript
interface UserProfile {
  fullName?: string;
  photo?: string;    // May be filename only — requires CDN prefix resolution
}
```

**Photo resolution logic:**
```typescript
function resolvePhotoUrl(photo: any): string | null {
  if (!photo) return null;
  if (typeof photo === 'string') return toAbsoluteUrl(photo);
  // If object, try these keys in order:
  return photo.url || photo.path || photo.photoUrl || photo.secure_url || null;
}

function toAbsoluteUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return 'https://olp-uploads.s3.us-east-1.amazonaws.com/' + url;
}
```

---

### Course (homepage list item)

```typescript
interface Course {
  id?: string;
  courseTitle?: string;
  courseImageUrl?: string;     // May need CDN prefix
  courseIconUrl?: string;      // Preferred over courseImageUrl for thumbnails
  enrollmentCost?: number;     // NPR — 0 means free
  discountedPrice?: number;
  hasOffer?: boolean;
  durationHours?: number;
  validityDays?: number;
  isSaved?: boolean;
  categoryName?: string;
}
```

**Price logic:**
```typescript
const isFree = enrollmentCost === 0;
const hasValidDiscount = hasOffer === true
  && enrollmentCost != null
  && discountedPrice != null
  && enrollmentCost > discountedPrice;
const discountPercent = hasValidDiscount
  ? Math.round(((enrollmentCost - discountedPrice) / enrollmentCost) * 100)
  : 0;
```

---

### LatestOngoingCourse

```typescript
interface LatestOngoingCourse {
  id?: string;
  courseTitle?: string;
  courseImageUrl?: string;
  progressPercentage?: number;              // 0.0–100.0
  completedLectures?: number;
  totalLectures?: number;
  lastAccessedLectureId?: string;           // If present: show Resume Watching
  lastAccessedLectureTitle?: string;
  lastAccessedLectureThumbnail?: string;
  lastWatchedPositionSeconds?: number;      // Seek position for video player
}
```

**Derived:**
```typescript
const progress = Math.min(100, Math.max(0, Math.round(progressPercentage)));
const hasLecture = !!lastAccessedLectureId && lastAccessedLectureId.length > 0;
const coverImage = lastAccessedLectureThumbnail || courseImageUrl;
```

---

### LiveClass (homepage subset)

```typescript
// From homepage API liveClasses array
interface LiveClass {
  id?: string;
  title?: string;
  scheduledAt?: string;    // ISO8601
  thumbnailUrl?: string;
}

// From /live-classes/my-classes (full model)
interface LiveClassModel {
  id: string;
  title: string;
  description?: string;
  status?: string;                // Not reliable — compute from times
  startTime?: string;             // ISO8601
  endTime?: string;
  durationMinutes?: number;
  courseId?: string;
  courseTitle?: string;
  subjectName?: string;
  lecturerName?: string;
  lecturerImageUrl?: string;
  bannerImageUrl?: string;
  joinUrl?: string;
}
```

**Status computation (do NOT trust `status` from backend):**
```typescript
function computeStatus(startTime: string, endTime?: string, durationMinutes?: number): 'upcoming' | 'ongoing' | 'ended' {
  const now = new Date();
  const start = new Date(startTime);
  
  let end: Date;
  if (endTime) {
    end = new Date(endTime);
  } else if (durationMinutes) {
    end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  } else {
    end = new Date(start.getTime() + 60 * 60 * 1000); // default 60 min
  }
  
  if (now < start) return 'upcoming';
  if (now > end) return 'ended';
  return 'ongoing';
}
```

---

### UpcomingExam

```typescript
interface UpcomingExam {
  id?: string;
  title?: string;
  examImageUrl?: string;
  examDate?: string;           // ISO8601
  daysUntilExam?: number;
}
```

---

### Category (homepage preferred list)

```typescript
interface Category {
  id?: string;
  categoryName?: string;
  categoryImageUrl?: string;   // May need CDN prefix
}
```

---

### TopCategoryWithCourses

```typescript
interface TopCategoryWithCourses {
  categoryId?: string;
  categoryName?: string;
  categoryImageUrl?: string;
  courses: Course[];
}
```

---

### CourseCardData (UI-layer DTO)

```typescript
interface CourseCardData {
  title: string;
  subtitle?: string;           // "{X}h content • {Y}d access"
  imageUrl?: string;
  courseId?: string;
  isSaved: boolean;
  enrollmentCost?: number;
  discountedPrice?: number;
  hasOffer?: boolean;
  durationHours?: number;
  validityDays?: number;
  categoryId?: string;
}
```

**Subtitle generation:**
```typescript
function formatSubtitle(course: Course): string {
  const parts: string[] = [];
  if (course.durationHours && course.durationHours > 0) {
    parts.push(`${course.durationHours}h content`);
  }
  if (course.validityDays && course.validityDays > 0) {
    parts.push(`${course.validityDays}d access`);
  }
  if (parts.length === 0 && course.categoryName) {
    parts.push(course.categoryName);
  }
  return parts.length === 0 ? 'View details' : parts.join(' • ');
}
```

---

### HomeSearchResponse

```typescript
interface HomeSearchResponse {
  courses: SearchCourse[];
  mockTests: SearchMockTest[];
  totalCourses: number;
  totalMockTests: number;
}

interface SearchCourse {
  id?: string;
  courseTitle?: string;
  courseImageUrl?: string;
  categoryName?: string;
  enrollmentCost?: number;
  discountedPrice?: number;
  hasOffer?: boolean;
  durationHours?: number;
  relevanceScore?: number;
}

interface SearchMockTest {
  id?: string;
  courseId?: string;
  title?: string;
  description?: string;
  cost?: number;              // 0 = free
  durationMinutes?: number;
  relevanceScore?: number;
}
```

---

## 5. State Management

### HomepageState

**Provider:** `homepageViewModelProvider` (Riverpod `StateNotifierProvider`)

```typescript
interface HomepageState {
  loading: boolean;                    // Initial full-page loading
  error?: Failure;                     // API failure (show error banner)
  data?: HomepageResponse;             // Main data blob
  updatingCategory: boolean;           // Category change in progress
  updateError?: Failure;               // Category update failed
  latestSelectedCategoryId?: string;   // Tracks active category for "Grab the Deals"
  upcomingLiveClasses: LiveClassModel[];
  isUpcomingLiveClassesLoading: boolean;
  upcomingLiveClassesError?: Failure;
}
```

**Derived getters (computed from `data`):**
```typescript
// These are getters on the state class — not stored separately
preferredCategories  = data?.preferredCategories ?? []
recommendedCourses   = data?.recommendedCourses ?? []
bannerCourses        = data?.bannerCourses ?? []
recommendedExams     = data?.recommendedExams ?? []
latestOngoingCourse  = data?.latestOngoingCourse ?? null
liveClasses          = data?.liveClasses ?? []
upcomingExam         = data?.upcomingExam ?? null
topCategoryWithCourses = data?.topCategoryWithCourses ?? null
userProfile          = data?.userProfile ?? null
hasError             = error != null
hasData              = data != null
```

### HomepageViewModel methods

| Method | Description |
|---|---|
| `getHomepageData()` | Fetches `/homepage`. Skips if already loading (unless `forceRefresh: true`). After success, also fetches upcoming classes. |
| `updateLatestCategory(categoryId)` | Calls `PUT /homepage/latest-category`. On success, refreshes homepage. Optimistic update (updates ID immediately, reverts on failure). |

### Provider initialization

```dart
// The provider AUTOMATICALLY calls getHomepageData() when first accessed
final homepageViewModelProvider = StateNotifierProvider((ref) {
  final notifier = HomepageViewModel(service, liveClassService);
  notifier.getHomepageData();  // ← auto-fetch on mount
  return notifier;
});
```

This means the API call starts **the moment the Dashboard widget tree is first built**, not when the user navigates to the Home tab.

### HomeSearchState

**Provider:** `homeSearchViewModelProvider` (separate from homepage)

```typescript
interface HomeSearchState {
  loading: boolean;
  error?: Failure;
  results?: HomeSearchResponse;
  query: string;
}
```

**Cleared** when `SearchPage` is popped (in `dispose()`).

### Slider State

**Provider:** `currentSlideIndexProvider` (StateProvider<int>)  
Simple integer tracking which carousel slide is active. Shared between `HomeSliders` and the dot indicators.

---

## 6. Application Logic

### 6.1 Initial Load Sequence

```
1. Dashboard widget builds → IndexedStack renders all 5 tabs
2. homepageViewModelProvider is first accessed by HomePage
3. Provider auto-calls notifier.getHomepageData()
4. State: { loading: true, hasData: false }
5. UI: full-screen Shimmer skeleton shown
6. API call: GET /homepage (with Bearer token)
7.a SUCCESS:
    - State: { loading: false, data: HomepageResponse, hasData: true }
    - UI: renders all sections from data
    - Then: GET /live-classes/my-classes?status=upcoming&limit=5
    - State: { upcomingLiveClasses: [...] }
    - UI: "Upcoming Classes" section updates
7.b FAILURE:
    - State: { loading: false, error: Failure, hasData: false }
    - UI: shimmer disappears, error banner shown at top
    - User can tap "Retry"
```

### 6.2 Guard: Section visibility

Each section uses a dual condition for visibility:
```dart
if (!state.hasData || sectionData.isNotEmpty)
```
This means:
- While loading (`!hasData`): section IS shown (with shimmer)
- After data loaded: section shown ONLY if has content
- This prevents blank sections from appearing after load

### 6.3 Pull-to-Refresh

```dart
RefreshIndicator(
  onRefresh: () => notifier.getHomepageData(forceRefresh: true),
  ...
)
```

- `forceRefresh: true` bypasses the `if (state.loading) return` guard
- Refreshes both homepage data AND upcoming classes
- Shows native pull-to-refresh spinner (not shimmer)

### 6.4 Category Update Logic

When user changes preferred category (via `updateLatestCategory`):

```
1. Immediately update latestSelectedCategoryId (optimistic UI)
2. Set updatingCategory: true (shows LinearProgressIndicator above categories)
3. Call PUT /homepage/latest-category
4.a SUCCESS: clear loading, then call getHomepageData(forceRefresh: true)
    → "Grab the Deals" section updates with new category's courses
4.b FAILURE: revert latestSelectedCategoryId to previous value, show updateError
```

### 6.5 First-Time vs Returning User (Homepage perspective)

The Home Page itself does **not** check `hasSelectedCategories`. That check happens at the app root level (`_resolveHome()` in `main.dart`).

By the time the user reaches HomePage:
- They are always authenticated
- They have always completed category selection
- The homepage API returns `preferredCategories` based on their saved categories

**First-time vs returning:** Identical homepage experience. No difference in home page behavior.

### 6.6 Error Handling

| Error type | Behavior |
|---|---|
| Homepage API fails | Error banner at top, all sections show shimmer, retry button |
| Upcoming classes API fails | Section shows empty state ("No live classes scheduled") |
| Category update fails | Revert category ID, show inline error text above categories list |
| Exam tap with no ID | Snackbar: "Exam information is incomplete." |
| Video resume fetch fails | Snackbar with message, then navigate to course detail instead |
| Live class join fails | (handled by `liveClassJoinViewModelProvider`) |

### 6.7 Image URL Resolution

Applied to ALL image URLs before display:
```typescript
function resolveImageUrl(url?: string): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  const lower = trimmed.toLowerCase();
  if (lower.startsWith('http://') || lower.startsWith('https://')) return trimmed;
  return 'https://olp-uploads.s3.us-east-1.amazonaws.com/' + trimmed;
}
```

---

## 7. User Interaction Flow

### 7.1 Opens Home Page

```
User switches to Home tab (or app opens to home)
    │
    ▼
If provider not yet initialized → getHomepageData() called automatically
    │
    ├── Loading → Full shimmer shown
    │
    └── Loaded → All sections rendered
```

### 7.2 Taps Course Card (Recommended Courses)

```
Tap HomeCourseCard
    │
    ▼
Navigate to EnrolledCourseDetailsPage(courseId: item.courseId)
    │
    ├── User not enrolled → shows enroll/pay button
    └── User enrolled → shows progress and lessons
```

### 7.3 Taps Save/Bookmark Icon on Course Card

```
Tap bookmark icon on HomeCourseCard
    │
    ▼
coursesViewModelProvider.notifier.toggleSave(courseId, currentlySaved)
    │
    ├── Was saved → DELETE /courses/{id}/save → icon updates to unfilled
    └── Was not saved → POST /courses/{id}/save → icon updates to filled
```

### 7.4 Taps Banner Slide

```
Tap ImageSlider
    │
    ▼
Navigate to EnrolledCourseDetailsPage(courseId: course.id from bannerCourses)
```

### 7.5 Taps "Continue Learning" Card

```
Tap CourseTrackCard
    │
    ├── If lastAccessedLectureId exists:
    │       │
    │       ▼
    │   GET lecture watch URL (courseService.watchLecture)
    │       │
    │       ├── Success → Navigate to VideoPlayerPage(url, title, lectureId, thumbnailUrl)
    │       └── Failure → Snackbar error + Navigate to EnrolledCourseDetailsPage
    │
    └── If no lectureId:
            │
            ▼
        Navigate to EnrolledCourseDetailsPage(courseId)
```

### 7.6 Taps "Join Now" on Live Class

```
Tap Join Now button
    │
    ▼
liveClassJoinViewModelProvider.notifier.joinLiveClass(classId)
    │
    ▼
POST /live-classes/{id}/join-token
    │
    ├── Success → Navigate to MeetingPageV2(token, classId) (Zoom meeting)
    │       └── On return → notifier.reset()
    └── Failure → (error handling in join view model)
```

### 7.7 Taps Upcoming Exam Card

```
Tap Container (whole exam card)
    │
    ├── upcomingExam.id exists → Navigate to ExamDetailPage(examId)
    └── id is null → Show snackbar "Exam information is incomplete."
```

### 7.8 Taps Category Chip

```
Tap _CategoryCard
    │
    ├── Scale animation (0.97 on press, 1.0 on release)
    │
    └── Navigate to ExplorePage(initialCategoryId: category.id)
```

### 7.9 Taps Search Bar

```
Tap GestureDetector on search bar (any part of the field)
    │
    ▼
Navigate to SearchPage (full-screen)
    │
    ├── Auto-focuses keyboard
    ├── User types (minimum 2 chars)
    │       │
    │       ▼
    │   Debounce 300ms → GET /homepage/search?q={query}&limit=10
    │       │
    │       ├── Shows courses grouped by type
    │       └── Shows mock tests grouped by type
    │
    └── User pops back → search state cleared
```

### 7.10 Taps Avatar / Profile Photo

```
Tap CircleAvatar in header
    │
    ▼
Navigate to ProfilePage
```

### 7.11 Taps "See All" on Recommended Courses

```
Tap subtitle arrow on TitleTextRow
    │
    ▼
Navigate to ExplorePage (full course list)
```

### 7.12 Taps "See All" on Upcoming Classes

```
Tap subtitle arrow on TitleTextRow
    │
    ▼
Navigate to UpcomingLiveClassesPage
```

### 7.13 Taps "See All" on Upcoming Exams

```
Tap subtitle arrow on TitleTextRow
    │
    ▼
Navigate to ExamListPage
```

### 7.14 Pull-to-Refresh

```
Drag down on scroll view
    │
    ▼
RefreshIndicator shows spinner
    │
    ▼
getHomepageData(forceRefresh: true)
    │
    ▼
Both APIs refreshed (homepage + upcoming classes)
    │
    ▼
All sections updated
```

---

## 8. Navigation Flow

### Outgoing Navigation from Home Page

| User action | Destination | Navigation method |
|---|---|---|
| Tap avatar | `ProfilePage` | `Navigator.push` (MaterialPageRoute) |
| Tap search bar | `SearchPage` | `Navigator.push` |
| Tap banner slide | `EnrolledCourseDetailsPage(courseId)` | `Navigator.push` |
| Tap recommended course card | `EnrolledCourseDetailsPage(courseId)` | `Navigator.push` |
| Tap "See All" (Recommended) | `ExplorePage()` | `Navigator.push` |
| Tap "Continue Learning" (with lecture) | `VideoPlayerPage(url, lectureId)` | `Navigator.push` |
| Tap "Continue Learning" (no lecture) | `EnrolledCourseDetailsPage(courseId)` | `Navigator.push` |
| Tap "See All" (Upcoming Classes) | `UpcomingLiveClassesPage` | `Navigator.push` |
| Tap "Join Now" (live class) | `MeetingPageV2(token, classId)` | `Navigator.push` |
| Tap upcoming exam card | `ExamDetailPage(examId)` | `Navigator.push` |
| Tap "See All" (Exams) | `ExamListPage` | `Navigator.push` |
| Tap category chip | `ExplorePage(initialCategoryId)` | `Navigator.push` |
| Tap deal course row | `EnrolledCourseDetailsPage(courseId)` | `Navigator.push` |

### Navigation type: `push` (not `replace`)

The home page remains in the navigation stack. User can press back to return. The `IndexedStack` means the Home tab state is **preserved** (same scroll position, same data) when user switches tabs and comes back.

---

## 9. Components & Reusable UI

### Component Inventory

| Component | File | Props | Purpose |
|---|---|---|---|
| `HomeSliders` | `widgets/slider/home_slider.dart` | none (reads from state) | Auto-play banner carousel |
| `ImageSlider` | `widgets/slider/image_slider.dart` | `imageName`, `propId`, `onTap`, `fit` | Single slide with tap handler |
| `RecommendedCourse` | `widgets/recommended_course.dart` | `items: CourseCardData[]`, `isLoading`, `onItemTap` | Horizontal scrollable course list |
| `CourseCard` | `widgets/recommended_course.dart` | `items`, `onItemTap` | Inner horizontal ListView |
| `HomeCourseCard` | `widgets/home_course_card.dart` | `title`, `subtitle`, `imagePath`, `courseId`, `isSaved`, `enrollmentCost`, `discountedPrice`, `hasOffer`, `durationHours` | Single 160×256 course card |
| `CourseTrackCard` | `widgets/course_track_card.dart` | `course: LatestOngoingCourse?`, `isLoading` | "Continue learning" card with blurred bg + progress bar |
| `LiveClasses` | `widgets/live_classes.dart` | `liveClasses`, `isLoading`, `isUpcoming` | Vertical list of live class rows |
| `PreferredCategoryList` | `widgets/preferred_category_list.dart` | `categories`, `isLoading` | Horizontal scrollable category cards |
| `GrabTheDealList` | `widgets/grab_the_deal.dart` | `topCategory`, `isLoading` | Vertical list of discounted courses |
| `TitleTextRow` | _(core widget)_ | `cardTitle`, `showSubTitle`, `onClick` | Section header with optional "See All" |
| `CustTextField` | _(core widget)_ | `hintText`, `controller`, `prefixIcon`, etc. | Styled text input |
| `CustomCachedNetworkImage` | _(core widget)_ | `imageUrl`, `fitStatus`, `size`, `errorImage` | Cached network image with error fallback |
| `CText` | _(core widget)_ | `text`, `type: TextType`, `color`, `fontWeight` | Design-system text with type scale |
| `AppSpacing` | _(core)_ | `verticalSpaceSmall/Medium/Large/Tiny/Average` | Consistent spacing constants |
| `_SectionShimmer` | inline (home_page.dart) | `height` | Per-section shimmer placeholder |
| `_ErrorBanner` | inline (home_page.dart) | `message`, `onRetry` | Top-of-page error banner |

---

## 10. Implementation Notes for Web Version

### 10.1 Page Structure (Next.js)

```tsx
// app/(dashboard)/home/page.tsx
export default async function HomePage() {
  // Server-side fetch for initial data
  const homepageData = await getHomepageData();   // GET /homepage
  const upcomingClasses = await getUpcomingClasses(); // GET /live-classes/my-classes?status=upcoming
  
  return (
    <main className="bg-white min-h-screen px-4 py-3">
      <ErrorBanner />            {/* Conditional */}
      <Header />                 {/* Avatar + Greeting */}
      <SearchBar />              {/* Links to /search */}
      <BannerSlider />           {/* bannerCourses carousel */}
      <RecommendedCourses />     {/* recommendedCourses */}
      <ContinueLearning />       {/* latestOngoingCourse */}
      <UpcomingClasses />        {/* from separate API call */}
      <LiveClasses />            {/* liveClasses from homepage */}
      <UpcomingExam />           {/* upcomingExam */}
      <PreferredCategories />    {/* preferredCategories */}
      <GrabTheDeals />           {/* topCategoryWithCourses */}
    </main>
  );
}
```

### 10.2 Data Fetching Strategy

**Recommended approach:** Server Components + React Query for client interactions

```tsx
// Server Component (initial load, SEO-friendly)
const data = await fetch(`${API_BASE}/homepage`, {
  headers: { Authorization: `Bearer ${token}` },
  next: { revalidate: 60 }  // ISR — cache for 60 seconds
});

// Client Component (pull-to-refresh, category updates)
const { data, refetch } = useQuery({
  queryKey: ['homepage'],
  queryFn: () => fetchHomepage(),
  staleTime: 60_000,
});
```

### 10.3 Loading States

**Initial load:** Show skeleton loader for each section
```tsx
// Use loading.tsx in App Router for automatic skeleton
// Or use Suspense boundaries per section
<Suspense fallback={<SectionSkeleton />}>
  <RecommendedCourses />
</Suspense>
```

**Per-section skeleton heights:**
- Header: 56px avatar + 2 text lines
- Search: 50px
- Banner: 16:9 ratio container
- Recommended courses: 256px horizontal scroll with 3 card placeholders (160px each)
- Continue learning: 170px card
- Classes list: 84px rows × 3
- Upcoming exam: ~200px card
- Categories: 130px horizontal with 4 card placeholders
- Deals: 100px rows × 3

### 10.4 Banner Slider

```tsx
// Use embla-carousel or swiper.js for web
<Carousel
  autoplay={{ delay: 3000 }}
  loop
  className="aspect-video w-full rounded-xl"
>
  {bannerCourses.map((course) => (
    <CarouselItem key={course.id}>
      <Link href={`/courses/${course.id}`}>
        <img
          src={resolveImageUrl(course.courseImageUrl)}
          alt={course.courseTitle}
          className="w-full h-full object-cover rounded-xl"
        />
      </Link>
    </CarouselItem>
  ))}
</Carousel>
// Custom dot indicators below
```

### 10.5 Course Card

```tsx
// HomeCourseCard equivalent
function CourseCard({ course }: { course: CourseCardData }) {
  const isFree = course.enrollmentCost === 0;
  const hasDiscount = course.hasOffer && 
    course.enrollmentCost > course.discountedPrice;
  const discountPct = hasDiscount 
    ? Math.round(((course.enrollmentCost - course.discountedPrice) / course.enrollmentCost) * 100)
    : 0;

  return (
    <div className="w-40 h-64 rounded-xl border border-gray-100 bg-white flex-shrink-0">
      {/* Image */}
      <div className="relative h-36">
        <img src={resolveImageUrl(course.imageUrl)} className="w-full h-full object-cover rounded-t-xl" />
        {isFree && <Badge color="green">FREE</Badge>}
        {hasDiscount && <Badge color="red">{discountPct}% OFF</Badge>}
        <BookmarkButton courseId={course.courseId} isSaved={course.isSaved} />
      </div>
      {/* Content */}
      <div className="p-2.5">
        <p className="text-sm font-semibold line-clamp-2">{course.title}</p>
        <div className="flex items-center gap-1 mt-1.5 text-xs">
          <ClockIcon className="w-3 h-3" />
          <span>{course.durationHours}h</span>
        </div>
        <PriceDisplay 
          isFree={isFree}
          hasDiscount={hasDiscount}
          enrollmentCost={course.enrollmentCost}
          discountedPrice={course.discountedPrice}
        />
      </div>
    </div>
  );
}
```

### 10.6 Continue Learning Card

```tsx
function ContinueLearningCard({ course }: { course: LatestOngoingCourse }) {
  const progress = Math.min(100, Math.round(course.progressPercentage ?? 0));
  const coverImage = course.lastAccessedLectureThumbnail || course.courseImageUrl;
  const hasLecture = !!course.lastAccessedLectureId;

  return (
    <Link href={hasLecture ? `/courses/${course.id}/lectures/${course.lastAccessedLectureId}` : `/courses/${course.id}`}>
      <div
        className="relative h-[170px] rounded-2xl overflow-hidden cursor-pointer"
        style={{
          background: coverImage ? `url(${resolveImageUrl(coverImage)})` : 'linear-gradient(to top right, #6A11CB, #2575FC)',
          backgroundSize: 'cover',
          filter: 'blur(2px)',   // blurred background
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/35" />
        {/* Content */}
        <div className="absolute inset-0 flex items-center p-3 gap-3">
          {/* Thumbnail */}
          <div className="relative w-[110px] h-[110px] rounded-xl overflow-hidden flex-shrink-0">
            <img src={resolveImageUrl(coverImage)} className="w-full h-full object-cover" />
            {hasLecture && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <PlayCircleIcon className="w-10 h-10 text-white" />
              </div>
            )}
          </div>
          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-base truncate">{course.courseTitle}</p>
            {course.lastAccessedLectureTitle && (
              <p className="text-white/85 text-xs truncate mt-0.5">{course.lastAccessedLectureTitle}</p>
            )}
            {/* Progress */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-white text-xs bg-white/10 px-2 py-1 rounded">
                {course.completedLectures}/{course.totalLectures}
              </span>
              <div className="flex-1 h-2 bg-white/15 rounded-full">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-white text-xs">{progress}%</span>
            </div>
            <p className="text-white/90 text-xs mt-2 font-semibold">
              {hasLecture ? 'Resume Watching' : 'Continue where you left off.'}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
```

### 10.7 Live Class Row

```tsx
function LiveClassRow({ cls, isUpcoming }: { cls: LiveClass, isUpcoming: boolean }) {
  return (
    <div className="flex items-center p-3 bg-white border border-gray-200 rounded-xl gap-3">
      <img
        src={resolveImageUrl(cls.thumbnailUrl)}
        className="w-15 h-15 rounded-lg object-cover flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-black line-clamp-2">{cls.title}</p>
        <p className="text-xs text-gray-500 mt-1">
          {cls.scheduledAt ? formatDate(cls.scheduledAt) : 'Schedule to be announced'}
        </p>
      </div>
      <button
        disabled={isUpcoming}
        className={isUpcoming
          ? "px-4 py-2 rounded-lg bg-gray-300 text-white text-xs font-semibold"
          : "px-4 py-2 rounded-lg bg-secondary text-white text-xs font-semibold"
        }
        onClick={!isUpcoming ? () => joinLiveClass(cls.id) : undefined}
      >
        {isUpcoming ? 'Upcoming' : 'Join Now'}
      </button>
    </div>
  );
}
```

### 10.8 Search Implementation

```tsx
// app/(dashboard)/search/page.tsx  (or a modal/drawer)
'use client';

function SearchPage() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  
  const { data, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchHomepage(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
  });

  return (
    <div>
      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search courses or mock tests"
      />
      {/* Results */}
      {data?.courses.map((c) => <CourseSearchCard key={c.id} course={c} />)}
      {data?.mockTests.map((t) => <MockTestSearchCard key={t.id} test={t} />)}
    </div>
  );
}
```

### 10.9 Pull-to-Refresh (Web equivalent)

On web, replace pull-to-refresh with a **"Refresh" button** or **auto-revalidate on focus**:

```tsx
// React Query: refetch on window focus
useQuery({
  queryKey: ['homepage'],
  queryFn: fetchHomepage,
  refetchOnWindowFocus: true,   // Refresh when user returns to tab
});

// Or manual refresh button in header
<button onClick={() => queryClient.invalidateQueries(['homepage'])}>
  Refresh
</button>
```

### 10.10 Category Card

```tsx
function CategoryCard({ category, index }: { category: Category, index: number }) {
  return (
    <Link
      href={`/explore?categoryId=${category.id}`}
      className="flex-shrink-0 w-25 rounded-2xl bg-white border border-gray-100 shadow-sm 
                 hover:scale-95 transition-transform duration-150 overflow-hidden"
    >
      {/* Image area */}
      <div className="p-3 flex items-center justify-center h-20">
        <img
          src={resolveImageUrl(category.categoryImageUrl)}
          className="max-h-full object-contain"
        />
      </div>
      {/* Name area */}
      <div className="bg-gray-100 p-2 rounded-b-2xl text-center">
        <p className="text-xs font-semibold text-black line-clamp-2 leading-tight">
          {category.categoryName}
        </p>
      </div>
    </Link>
  );
}
```

### 10.11 Live Class Status Logic

```typescript
// CRITICAL: Do NOT trust the 'status' field from the API
// Always compute it from timestamps
function getLiveClassStatus(cls: LiveClassModel): 'upcoming' | 'ongoing' | 'ended' {
  if (!cls.startTime) return cls.status as any || 'upcoming';
  
  const now = new Date();
  const start = new Date(cls.startTime);
  const durationMs = (cls.durationMinutes ?? 60) * 60 * 1000;
  const end = cls.endTime ? new Date(cls.endTime) : new Date(start.getTime() + durationMs);
  
  if (now < start) return 'upcoming';
  if (now > end) return 'ended';
  return 'ongoing';
}
```

### 10.12 Section Visibility Rules

```tsx
// Each section: show if data not yet loaded OR if data has content
const showSection = !hasData || sectionData.length > 0;

// Example for Recommended Courses:
{(!hasData || recommendedCourses.length > 0) && (
  <section>
    <SectionHeader title="Recommended Courses" href="/explore" showSeeAll />
    {!hasData ? <CourseListSkeleton /> : <RecommendedCourseList courses={recommendedCourses} />}
  </section>
)}
```

### 10.13 Number Formatting (NPR Currency)

```typescript
// Indian locale formatting: 1,999 / 12,999 / 1,23,456
const formatNPR = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'NPR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  // Output: "NPR 1,999"
  
  // Or simple format matching mobile: "Rs 1,999"
  return `Rs ${new Intl.NumberFormat('en-IN').format(amount)}`;
};
```

### 10.14 CSS Variables for Homepage

```css
/* Use these exact values from the mobile app's AppColors */
:root {
  --primary: #1C3B5A;
  --secondary: #2A5D9F;
  --gray-600: #556575;
  --gray-400: #A3AEB9;
  --gray-300: #CFD6DE;
  --gray-200: #E2E8ED;
  --gray-100: #F0F4F8;
  --border: #D8E1E9;
  --success: #2E7D32;
  --failure: #D32F2F;
  
  --course-card-width: 160px;
  --course-card-height: 256px;
  --course-card-image-height: 140px;
  --category-card-width: 100px;
  --category-card-height: 130px;
  --live-class-thumbnail: 60px;
  --deal-course-thumbnail: 80px;
}
```

### 10.15 Complete Route Mapping

| Interaction | Mobile destination | Web route |
|---|---|---|
| Avatar tap | `ProfilePage` | `/profile` |
| Search tap | `SearchPage` | `/search` (or modal) |
| Banner slide tap | `EnrolledCourseDetailsPage(id)` | `/courses/{id}` |
| Recommended course tap | `EnrolledCourseDetailsPage(id)` | `/courses/{id}` |
| "See All" Recommended | `ExplorePage()` | `/explore` |
| "Resume Watching" tap | `VideoPlayerPage(url, lectureId)` | `/courses/{id}/lectures/{lectureId}` |
| "See All" Upcoming Classes | `UpcomingLiveClassesPage` | `/courses?tab=live` |
| "Join Now" live class | `MeetingPageV2(token)` | Open Zoom Web SDK in same page or new tab |
| Upcoming exam tap | `ExamDetailPage(examId)` | `/exams/{id}` |
| "See All" Exams | `ExamListPage` | `/exams` |
| Category chip tap | `ExplorePage(categoryId)` | `/explore?categoryId={id}` |
| Deal course tap | `EnrolledCourseDetailsPage(id)` | `/courses/{id}` |

---

*This document describes the complete Home Page implementation as built in the Flutter mobile app.*  
*Use it as the specification to build the identical page in Next.js.*
