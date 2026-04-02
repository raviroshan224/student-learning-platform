# OLP Mobile App — Explore & Courses Technical Documentation

> Deep-dive reference for rebuilding the **Explore Page**, **Courses Page** (My Courses + Ongoing Classes), and **Enrolled Course Details Page** in a Next.js web application.
>
> Backend base URL: `https://scholargyan.onecloudlab.com/api/v1/`
> Image CDN base: `https://olp-uploads.s3.us-east-1.amazonaws.com/`

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

```
Dashboard (IndexedStack)
├── Tab 0 — Home Page
├── Tab 1 — Explore Page          ← Explore courses by category + search
├── Tab 2 — Courses Page          ← Enrolled courses + ongoing live classes
├── Tab 3 — Exams
└── Tab 4 — Profile
```

### 1.2 Three Key Screens

| Screen | Flutter File | Role |
|---|---|---|
| **ExplorePage** | `lib/features/explore/presentation/pages/explore_page.dart` | Browse all public courses by category / keyword |
| **CoursePage** | `lib/features/courses/presentation/pages/courses_page.dart` | View enrolled courses + join ongoing live classes |
| **EnrolledCourseDetailsPage** | `lib/features/courses/presentation/pages/enrolled_course_details_page.dart` | Full course detail: 6 tabs of content |

### 1.3 Shared Provider

Both Explore and Courses screens share `coursesViewModelProvider` (a single `StateNotifierProvider<CoursesViewModel, CoursesState>`). This means all state — public courses, enrollments, subjects, lectures, materials, live classes, etc. — lives in one provider and persists across tab switches inside `IndexedStack`.

---

## 2. UI Component Breakdown

### 2.1 Explore Page

**AppBar**
- Title: `"Explore Courses"` — bodyLarge, 700 weight
- Height: 48px
- Background: white, no elevation
- No back arrow (part of bottom nav)

**Search Bar**
- Full-width `TextField` (NOT a fake tap-to-navigate widget like on Home)
- Default border: 1px `gray300`, radius 8px
- Focused border: 2px `primary (#1C3B5A)`, animated over 200ms
- Hint: `"Search courses..."`, color `gray500`
- Prefix icon: `Icons.search`, color `gray500`
- Suffix: `Icons.close` (appears when query is non-empty, clears search)
- On value change: calls `fetch(page: 1, search: query)` — re-fetches with search term
- On clear: resets search to show all courses for current category tab

**Category Tab Bar**
- Horizontally scrollable chips (NOT a standard `TabBar` with underline)
- First chip always: `"All Courses"` (index 0, `categoryId: null`)
- Remaining chips: dynamic categories loaded from `GET /courses/categories`
- Category hierarchy is flattened: only **leaf/child** categories are shown as tabs
- Chip style:
  - **Selected**: background `primary (#1C3B5A)`, text white, shadow `rgba(28,59,90,0.2)` blur 8px
  - **Unselected**: background `primary` at 6% opacity, text `gray700`, no shadow
  - Padding: 12px vertical, 16px horizontal, radius 20px
- When `initialCategoryId` is passed (from Home page category tap), the corresponding tab is pre-selected
- `TabController` is **rebuilt** when categories are loaded (since `tabs.length = 1 + categories.length`)
- `_ignoreNextTabChange` flag prevents double-fetch on programmatic tab switches

**Course Grid (CoursesTab)**
- Each category tab renders a `CoursesTab()` widget inside `TabBarView` (with `NeverScrollableScrollPhysics`)
- 2-column `GridView.builder` with `SliverGridDelegateWithFixedCrossAxisCount`:
  - `crossAxisCount: 2`
  - `mainAxisSpacing: 12`, `crossAxisSpacing: 12`
  - `childAspectRatio: 0.58` (portrait card)
- Each cell: `HomeCourseCard` wrapped in `Hero(tag: 'course_${course.id}')`
- Infinite scroll: `NotificationListener<ScrollNotification>` triggers 120px before bottom → `loadNextPage()`
- Pull-to-refresh → `fetch(page: 1, forceRefresh: true)`

**Back Navigation (WillPopScope)**
- If search query is active OR a non-"All Courses" tab is selected: **clears filters, stays on page** (returns `false`)
- Otherwise: normal pop (returns `true`)

**Loading States**
- Initial load: shows 4 placeholder `Container(height: 200, color: gray200)` cards in the 2-column grid
- Paginating: shows `CircularProgressIndicator` centered below the last row
- No shimmer package used in CoursesTab; raw gray placeholder boxes

**Empty State**
- Icon: `Icons.school_outlined`, size 64, color `gray300`
- Message: `"No courses found"` — titleMedium, gray500
- Shown when `courses.isEmpty && !loading`

**Error State**
- Icon: `Icons.error_outline`, size 48, `AppColors.failure (#D32F2F)`
- Error message text
- `"Retry"` button → re-calls `fetch(page: 1)`

---

### 2.2 Courses Page (CoursePage)

**AppBar**
- Title: `"Courses Enrolled"`
- Standard `CustomAppBar` widget

**Two-Pill Tab Switcher** (custom, NOT Flutter's TabBar)
- Row with 2 `Expanded` children, each is an `AnimatedContainer`
- Labels: `"My Courses"` | `"Ongoing Classes"`
- **Selected**: background `#1E3A5F` (dark blue), text white, weight 600
- **Unselected**: background `gray200`, text `gray700`, normal weight
- Radius: 24px, margin between pills: 8px
- Animation: 200ms duration
- State: `selectedTabIndexProvider` (a simple `StateProvider<int>`)
- `IndexedStack` keeps both tabs alive/mounted

**My Courses Tab (MyCourses)**
- Vertical `ListView.separated` with 16px separators
- Each item: `_EnrollmentCourseCard`
  - Padding: 12px all sides
  - Border: 1px `gray200`, radius 12px, white background
  - Left side: 74×74 thumbnail (`courseIconUrl` → fallback `courseImageUrl`), radius 8px
  - Center: course title (bodyLarge, weight 600), enrollment date (`Enrolled: d MMM, yyyy`), expiry label
  - Right side: 60×60 circular progress indicator (only shown if progress > 0)
    - Progress value: `progressPercentage / 100`
    - Stroke width: 6px
    - Active color: `#1E3A5F`
    - Background: `gray300`
    - Center text: `"XX%"` bodySmall, weight 600
  - Expiry labels: `"Expires In: N Days"` / `"Expires Today"` / `"Expired"`, color `gray600`
- Empty state: school icon, `"You have not enrolled in any courses yet."`
- Pull-to-refresh → `fetchEnrollments(force: true)`

**Ongoing Classes Tab (OngoingClassList)**
- Vertical `ListView.builder`
- Each item: `_LiveClassCard`
  - 180px high banner image, `ClipRRect` radius 12px
  - Status badge (top-left over image): `"Live now"` / `"Starts soon"` / `"Completed"`, `primary` at 90% opacity, radius 20px
  - `"Join Now"` button (bottom-right over image): `secondary (#2A5D9F)`, radius 8px, padding 20h×12v
  - Below image: subject/category text (bodySmall, gray600), title (bodyLarge, weight 600, max 2 lines), schedule row with `Icons.access_time`, instructor row with 14px circle avatar
  - Schedule format: `"MMM d • hh:mm a"` or `"MMM d • hh:mm a - hh:mm a"` for same-day; full format for cross-day
- Bottom padding: 120px (accounts for bottom nav bar)
- Infinite scroll: 120px trigger → `loadMoreLiveClasses()`
- Pull-to-refresh → `fetchLiveClasses(force: true, status: 'ongoing')`
- On join → `POST /live-classes/{id}/join-token` → navigate to `MeetingPageV2`
- If join fails: SnackBar with error message, red background

---

### 2.3 Enrolled Course Details Page

**Header (200px Image Zone)**
- Full-width, 200px height
- Background: `CachedNetworkImage` with `BoxFit.cover`
- Dark gradient overlay: `LinearGradient` from `black.withOpacity(0.4)` to `transparent` (top-to-bottom)
- Over the image (Positioned):
  - Back arrow button (top-left, 8px from top/left)
  - Course title (bottom, 16px padding): headlineLarge, white, weight 700, max 2 lines

**Below Header (inside scrollable Column)**
- Course title again (displayed outside image for non-image fallback)
- Duration row: `Icons.schedule` + `"Xh content"` | `Icons.calendar_today_outlined` + `"Xd validity"` — bodySmall, gray600
- `ReadMoreText` description: bodyMedium, trimLines 10, `"Show more"` / `"Show less"` in primary color

**Enrollment Overview Section** (shows only when enrolled)
- Linear progress bar: `LinearProgressIndicator`, height 8, radius 4, primary foreground, gray200 background
- `"XX% Complete"` bodySmall to the right
- Status chip: `"Active"` (primary bg 12%), `"Completed"` (success bg 12%), `"Expired"` (failure bg 12%), radius 20px
- Certificate badge (if `certificate.issued == true`): green background, `Icons.card_membership`
- Enrolled date and expiry date labels

**Tab Bar (Custom `ExploreTabContainer` chips)**
- Horizontally scrollable (`isScrollable: true`, `tabAlignment: TabAlignment.start`)
- Same chip style as Explore's category tabs
- No underline indicator (`indicatorColor: Colors.transparent`, divider removed)
- 6 tabs: `Syllabus` | `Materials` | `Lectures` | `Live Classes` | `Mock Tests` | `Lecturers`
- Tab content rendered via `IndexedStack` (all tabs stay mounted)
- Pull-to-refresh refreshes both `getDetails(courseId)` and the currently active tab

**Bottom Navigation Bar (Enroll CTA)**
- Only shown when `details != null && !isEnrolled`
- White background, top-left + top-right radius 16px, box shadow `black.withOpacity(0.08)` blur 12px
- Left side: `"Enrollment Fee"` label + price
  - If `hasOffer && discountedPrice < enrollmentCost`: shows discounted price in headlineSmall bold, original in bodySmall with strikethrough
  - If no offer: shows enrollment cost or `"Free"`
- Right side:
  - If effective price ≤ 0: `"Enroll Now"` button (`secondary` color) → `handleFreeEnrollment()`
  - Else: `EnrollWithEsewaButton` widget → eSewa payment flow

---

### 2.4 Course Detail Tabs

#### Tab 0: Syllabus (SyllabusInfo)
- Vertical `ListView` of subject cards
- Each `_SubjectCard`:
  - Animated expand/collapse (300ms)
  - Collapsed border: 1px `gray200`; expanded border: 2px `primary` with shadow
  - Subject number badge: 24×24px circle, primary at 10% bg (collapsed) or solid primary (expanded)
  - Subject name: titleLarge, weight 700
  - Subject description: bodySmall, gray600, truncated to 2 lines when collapsed, 20 lines when expanded
  - Bottom row: chapter count chip (primary at 10%, icon `Icons.menu_book_rounded`) + mark weight chip (success at 10%, `Icons.star_rounded`)
  - Expand arrow: rotates 180° (RotationTransition, 300ms)
- Chapter list (inside expanded subject):
  - `ListView.separated` with divider `gray100` at indent 56
  - Each chapter: numbered badge (28×28, gray100 bg), chapter title (bodyMedium, gray800), right arrow
  - Tap → `DraggableScrollableSheet` bottom sheet (60% initial, 40–90% range) showing full chapter description

#### Tab 1: Materials (MaterialsInfo)
- Lists `CourseMaterialModel` items (requires enrollment)
- Download icon for each material
- Shows `fileExtension`, `fileSize`, `downloadCount`
- Tap → calls `POST /course-materials/{id}/download` → gets signed URL → opens in browser/viewer

#### Tab 2: Lectures (LecturesDetails)
- Requires enrollment — shows "Enroll to access lectures" if not enrolled
- Groups lectures by `subjectId` → `SubjectModel.subjectName`
- Lectures without a subject go into `"General Lectures"` group
- Each group = `ExpansionTile` (white bg, gray300 border, radius 8):
  - Group title: subject name (titleMedium)
  - Inside: 2-column `GridView` of `_LectureCard` (square aspect ratio 1:1)
- `_LectureCard`:
  - Top 60% (flex 3): `coverImageUrl` or `thumbnailUrl`; fallback: primary at 8% with `Icons.play_circle_fill`
  - Bottom 40% (flex 2): lecture name (bodySmall, weight 600, max 2 lines), lecturer row (10px circle avatar with initial, lecturer name, play/lock icon)
  - Lock icon (`gray400`) if not enrolled, play icon (`primary`) if enrolled
  - Tap → `LectureDetailsBottomSheet` → user confirms → `_openLecture()` → `POST /lectures/{id}/watch` → `VideoPlayerPage`

#### Tab 3: Live Classes (ClassesInfo)
- Lists live classes for the course
- Calls `GET /live-classes/my-classes` with `courseId` filter
- Similar card style to OngoingClassList but within course context
- `"Join Now"` → same join flow via `liveClassJoinViewModelProvider`

#### Tab 4: Mock Tests (MockTestList)
- Lists `MockTestModel` items for the course
- Shows: title, test type, question count (`resolvedQuestionCount`), duration (`durationLabel`), `attemptsAllowed`
- Tap → `ExamDetailPage` or inline test launch

#### Tab 5: Lecturers (LecturersInfo)
- Lists `LecturerModel` items
- Each item: circular profile image (radius 28), full name (titleMedium), subjects string (comma-separated), email if available

---

### 2.5 Video Player Page

**Layout**
- Full-screen landscape-optimized
- Uses `chewie` controller wrapping `VideoPlayerController`
- If `processingStatus != 'ready'`: shows loading spinner + `"Video is still processing..."` message
- If `_errorMessage` set: shows error message + retry button
- If player ready: shows `ChewiePlayer` widget

**Auto-complete logic**
- 80% watch progress → calls `POST /lectures/{id}/complete` (once per session, `_hasMarkedComplete` flag)
- Debounced — only marks if `!_hasMarkedComplete`

**Playback headers**
- Only adds `Authorization: Bearer <token>` if:
  1. `watchUrl` host matches API host (same domain)
  2. URL does NOT contain signature query params (`token`, `signature`, `x-amz-signature`, etc.)
- For S3 signed URLs: no auth header (pre-signed URLs carry their own auth)

**App lifecycle**
- `AppLifecycleState.paused` → pauses video
- `dispose()` → disposes both controllers

---

## 3. API Integrations

### 3.1 Explore Page APIs

| # | Method | Endpoint | Auth | Purpose |
|---|---|---|---|---|
| 1 | `GET` | `/courses` | No | Paginated course list with optional `search` + `categoryId` |
| 2 | `GET` | `/courses/categories` | No | All categories (hierarchical; flattened to leaf nodes client-side) |
| 3 | `GET` | `/courses/saved/mine` | Yes | User's saved/bookmarked courses |
| 4 | `POST` | `/courses/{id}/save` | Yes | Bookmark a course |
| 5 | `DELETE` | `/courses/{id}/save` | Yes | Remove bookmark |

#### GET /courses — Query Parameters
```
page        integer   default 1
limit       integer   default 10
search      string?   keyword search
categoryId  string?   filter by leaf category id
```

#### GET /courses Response
```json
{
  "data": [CourseModel],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

---

### 3.2 Courses Page APIs

| # | Method | Endpoint | Auth | Purpose |
|---|---|---|---|---|
| 6 | `GET` | `/enrollments/my-courses` | Yes | All enrollments for current user |
| 7 | `GET` | `/live-classes/my-classes` | Yes | Live classes with status/course filters |
| 8 | `POST` | `/live-classes/{id}/join-token` | Yes | Get Zoom join token for a live class |

#### GET /live-classes/my-classes — Query Parameters
```
status      string    'ongoing' | 'upcoming' | 'completed'
courseId    string?   filter by course
subjectId   string?   filter by subject
page        integer   default 1
limit       integer   default 10
```

---

### 3.3 Course Details APIs

| # | Method | Endpoint | Auth | Purpose |
|---|---|---|---|---|
| 9 | `GET` | `/courses/{id}/details` | Yes | Full course detail (isEnrolled, stats, etc.) |
| 10 | `GET` | `/subjects/by-course/{courseId}` | No | Subjects + chapters for syllabus |
| 11 | `GET` | `/course-materials/by-course/{courseId}` | Yes | All materials for enrolled user |
| 12 | `GET` | `/lectures/by-subject/{subjectId}` | Yes | Lectures for a subject |
| 13 | `POST` | `/lectures/{id}/watch` | Yes | Get playback URL for a lecture |
| 14 | `POST` | `/lectures/{id}/complete` | Yes | Mark lecture as completed |
| 15 | `POST` | `/course-materials/{id}/download` | Yes | Get signed download URL |
| 16 | `GET` | `/lecturers/by-course/{courseId}` | No | Lecturers teaching this course |
| 17 | `GET` | `/mock-tests/by-course/{courseId}/with-attempts` | Yes | Mock tests with attempt history |
| 18 | `POST` | `/enrollments/enroll-free` | Yes | Enroll in a free course |

#### POST /lectures/{id}/watch — Response
```json
{
  "url": "https://..." 
}
```
The `url` can be:
- A relative path on the API server (same host → add Bearer token)
- An S3 pre-signed URL (different host, has signature params → no extra auth header)

#### POST /enrollments/enroll-free — Body
```json
{ "courseId": "string" }
```

---

### 3.4 API Endpoint Constants (from code)

```dart
// Courses
static const courses = '/courses';
static const courseById = '/courses';
static const courseBySlug = '/courses/by-slug';
static const courseDetails = '/courses';     // appended: /{id}/details
static const courseSave = '/courses';        // appended: /{id}/save
static const courseIsSaved = '/courses';     // appended: /{id}/is-saved
static const courseSavedMine = '/courses/saved/mine';

// Subjects / Lectures / Materials
static const subjectsByCourse = '/subjects/by-course';
static const lecturesBySubject = '/lectures/by-subject';
static const lectures = '/lectures';
static const lecturesFree = '/lectures/free';
static const completeLecture = '/lectures/complete';
static const courseMaterialsByCourse = '/course-materials/by-course';
static const courseMaterialsBySubject = '/course-materials/by-subject';
static const courseMaterialsByChapter = '/course-materials/by-chapter';
static const courseMaterialById = '/course-materials';
static const courseMaterialDownload = '/course-materials';

// Lecturers
static const lecturersByCourse = '/lecturers/by-course';

// Mock Tests
static const mockTestsByCourse = '/mock-tests/by-course';

// Enrollments
static const enrollmentsMyCourses = '/enrollments/my-courses';
static const enrollmentsById = '/enrollments';
static const enrollFreeCourse = '/enrollments/enroll-free';

// Live Classes
static const liveClassesMyClasses = '/live-classes/my-classes';
```

---

## 4. Data Models (TypeScript)

### 4.1 Course Models

```typescript
interface PagedMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

interface CourseModel {
  id: string;
  courseTitle: string;
  courseDescription?: string;
  categoryId?: string;
  categoryName?: string;
  courseImageUrl?: string;    // may be bare filename — prepend CDN base
  courseIconUrl?: string;     // may be bare filename — prepend CDN base
  enrollmentCost?: number;    // 0 = free
  discountedPrice?: number;
  hasOffer?: boolean;         // NOTE: may be boolean OR "true"/"1" string
  durationHours?: number;
  validityDays?: number;
  slug: string;
  isPublished: boolean;
  displayOrder?: number;
  tags?: string[];
  isSaved: boolean;           // personalized field
}

interface PagedCourses {
  data: CourseModel[];
  meta: PagedMeta;
}
```

### 4.2 Category Models

```typescript
interface CategoryModel {
  id: string;
  categoryName: string;
  parentCategoryId?: string;  // null = top-level
  children?: CategoryModel[];
}
// Client-side flattening: only use categories without children as filter tabs
```

### 4.3 Enrollment Models

```typescript
interface EnrollmentProgress {
  completedLecturesCount: number;
  totalLectures: number;
  progressPercentage: number;   // 0–100
  lastAccessedAt?: string;
  lastAccessedLectureId?: string;
}

interface EnrollmentCertificate {
  issued: boolean;
  issuedAt?: string;
  certificateUrl?: string;
  certificateNumber?: string;
}

interface EnrollmentCourse {
  id: string;
  courseTitle: string;
  courseDescription?: string;
  courseImageUrl?: string;
  courseIconUrl?: string;
  enrollmentCost?: number;
  durationHours?: number;
  validityDays?: number;
  slug?: string;
  categoryName?: string;
  stats?: {
    totalLectures?: number;
    totalMaterials?: number;
    totalLecturers?: number;
    totalStudents?: number;
  };
}

interface EnrollmentModel {
  id: string;
  courseId: string;
  studentId: string;
  enrollmentDate?: string;   // ISO date string
  expiryDate?: string;       // ISO date string
  status?: 'active' | 'completed' | 'expired' | 'inactive';
  paymentId?: string;
  progress?: EnrollmentProgress;
  certificate?: EnrollmentCertificate;
  course?: EnrollmentCourse;
  createdAt?: string;
  updatedAt?: string;
}
```

### 4.4 Course Content Models

```typescript
interface ChapterModel {
  id: string;                   // uses '_id' or 'id' from API
  chapterNumber: number;
  chapterTitle: string;
  chapterDescription?: string;
  displayOrder?: number;
}

interface SubjectModel {
  id: string;
  courseId: string;
  subjectName: string;
  subjectDescription?: string;
  markWeight?: number;
  displayOrder?: number;
  isActive: boolean;
  chapters: ChapterModel[];
}

interface LectureModel {
  id: string;
  courseId: string;
  subjectId?: string;
  chapterId?: string;
  name: string;
  description?: string;
  thumbnailUrl?: string;
  coverImageUrl?: string;
  durationSeconds?: number;
  displayOrder?: number;
  isFree: boolean;
  isActive: boolean;
  processingStatus?: string;   // 'ready' | 'processing' | 'failed'
  viewCount?: number;
  lecturerIds: string[];
  lecturerName?: string;       // nested from lecturer.fullName
  lecturerProfileImageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface CourseMaterialModel {
  id: string;
  courseId: string;
  subjectId?: string;
  chapterId?: string;
  materialTitle: string;
  materialDescription?: string;
  materialType?: string;        // 'pdf' | 'doc' | 'video' | etc.
  downloadUrl?: string;         // also tries signedUrl, url
  fileUrl?: string;
  fileKey?: string;
  fileName?: string;
  fileSize?: number;            // bytes
  fileExtension?: string;
  downloadCount?: number;
  displayOrder?: number;
  isActive: boolean;
  uploadedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface LecturerModel {
  id: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  profileImageUrl?: string;     // may be bare filename — prepend CDN base
  subjectIds: string[];
  courseIds: string[];
  subjects?: string;            // comma-separated subject names
}

interface MockTestModel {
  id: string;
  courseId?: string;
  courseName?: string;
  title: string;
  description?: string;
  instructions?: string;
  testType?: string;
  subjectId?: string;
  subjectName?: string;
  numberOfQuestions?: number;
  durationMinutes?: number;
  cost?: number;
  attemptsAllowed?: number;
  status?: string;
  // Computed:
  resolvedQuestionCount: number | null;  // numberOfQuestions || sum(subjectDistribution) || questions.length
  durationLabel: string | null;          // raw durationText || '${durationMinutes} min'
  subjectDistribution: Array<{ subjectId: string; numberOfQuestions: number }>;
}
```

### 4.5 Live Class Models

```typescript
interface LiveClassModel {
  id: string;
  title: string;
  courseId?: string;
  courseTitle?: string;
  subjectId?: string;
  subjectName?: string;
  lecturerId?: string;
  lecturerName?: string;
  lecturerImageUrl?: string;
  bannerImageUrl?: string;
  startTime?: string;          // ISO datetime
  endTime?: string;            // ISO datetime
  durationMinutes?: number;
  durationLabel?: string;
  status?: string;             // WARNING: may be stale — compute from timestamps
  // Computed client-side:
  isJoinable: boolean;         // now >= startTime AND now <= endTime (+ buffer)
  isUpcoming: boolean;         // startTime > now
  hasEnded: boolean;           // endTime < now
}

interface LiveClassJoinToken {
  token: string;               // Zoom Video SDK JWT
  sessionName: string;
  userName: string;
}

interface PagedLiveClasses {
  data: LiveClassModel[];
  meta: PagedMeta;
}
```

### 4.6 Course Detail Response

```typescript
// GET /courses/{id}/details returns a flat Map, not a typed model
interface CourseDetailsResponse {
  id: string;
  courseTitle: string;
  courseDescription?: string;
  courseImageUrl?: string;
  courseIconUrl?: string;
  enrollmentCost?: number;
  discountedPrice?: number;
  hasOffer?: boolean;
  durationHours?: number;
  validityDays?: number;
  isEnrolled?: boolean;         // key flag for showing/hiding enroll CTA
  enrollmentDetails?: {
    status?: string;
    enrollmentDate?: string;
    expiryDate?: string;
    progress?: EnrollmentProgress;
    certificate?: EnrollmentCertificate;
  };
  stats?: {
    totalLectures?: number;
    totalMaterials?: number;
    totalLecturers?: number;
    totalStudents?: number;
  };
  tags?: string[];
  [key: string]: unknown;       // additional fields may be present
}
```

---

## 5. State Management

### 5.1 CoursesState Structure

`CoursesState` is a large immutable data class managed by `CoursesViewModel extends StateNotifier<CoursesState>`. It holds ALL data for both the Explore and Courses sections.

```typescript
// Conceptual TypeScript equivalent of CoursesState
interface CoursesState {
  // Public courses (Explore grid)
  publicCourses: CourseModel[];
  loadingCourses: boolean;
  coursesError: Failure | null;
  coursesPage: number;
  coursesMeta: PagedMeta | null;
  currentSearch: string;
  currentCategoryId: string | null;

  // Saved courses
  savedCourses: CourseModel[];
  loadingSaved: boolean;
  savedError: Failure | null;

  // Enrollments (My Courses tab)
  enrollments: EnrollmentModel[];
  loadingEnrollments: boolean;
  enrollmentsError: Failure | null;

  // Course categories
  categories: CategoryModel[];
  loadingCategories: boolean;
  categoriesError: Failure | null;

  // Course details (single active course)
  details: CourseDetailsResponse | null;
  detailsCourseId: string | null;
  loadingDetails: boolean;
  detailsError: Failure | null;

  // Subjects/syllabus for current course
  subjects: SubjectModel[];
  loadingSubjects: boolean;
  subjectsError: Failure | null;

  // Lectures for current course
  lectures: LectureModel[];
  loadingLectures: boolean;
  lecturesError: Failure | null;

  // Materials for current course
  materials: CourseMaterialModel[];
  loadingMaterials: boolean;
  materialsError: Failure | null;

  // Lecturers for current course
  lecturers: LecturerModel[];
  loadingLecturers: boolean;
  lecturersError: Failure | null;

  // Mock tests for current course
  mockTests: MockTestModel[];
  loadingMockTests: boolean;
  mockTestsError: Failure | null;

  // Live classes (Ongoing Classes tab)
  liveClasses: LiveClassModel[];
  loadingLiveClasses: boolean;
  liveClassesError: Failure | null;
  liveClassesPage: number;
  liveClassesMeta: PagedMeta | null;
}
```

### 5.2 Key Computed Property: isEnrolled

```dart
// Flutter source logic — replicate in web
bool get isEnrolled {
  final d = details;
  if (d == null) return false;
  // Prefer details['isEnrolled'] flag if present
  if (d['isEnrolled'] == true) return true;
  // Fall back to checking enrollmentDetails.status
  final enrollDetails = d['enrollmentDetails'] as Map?;
  if (enrollDetails != null) {
    final status = enrollDetails['status']?.toString().toLowerCase();
    return status == 'active' || status == 'completed';
  }
  return false;
}
```

### 5.3 Provider Dependencies

```
coursesViewModelProvider
  └── courseServiceProvider      (CourseService — reads/bookmarks public courses)
  └── enrollmentServiceProvider  (EnrollmentService — enrollments + live classes)

liveClassJoinViewModelProvider
  └── enrollmentServiceProvider  (POST /live-classes/{id}/join-token)

selectedTabIndexProvider         (CoursePage pill tab — simple StateProvider<int>)
```

### 5.4 Key State Methods

| Method | Trigger | What it does |
|---|---|---|
| `fetch(page, forceRefresh)` | Explore page init, tab change, search, pull-to-refresh | GET /courses with current search + categoryId |
| `loadNextPage()` | Scroll 120px from bottom | Appends next page to publicCourses |
| `fetchSaved(force)` | Explore init, after bookmark | GET /courses/saved/mine |
| `toggleSave(courseId)` | Bookmark icon tap | POST/DELETE /courses/{id}/save; optimistically updates isSaved |
| `loadCategories()` | Explore page init (once) | GET /courses/categories; flattens hierarchy |
| `fetchEnrollments(force)` | MyCourses init, pull-to-refresh | GET /enrollments/my-courses |
| `fetchLiveClasses(force, status)` | OngoingClassList init | GET /live-classes/my-classes?status=ongoing |
| `loadMoreLiveClasses()` | Scroll near bottom | Appends next page to liveClasses |
| `getDetails(courseId)` | EnrolledCourseDetailsPage init | GET /courses/{id}/details |
| `getSubjects(courseId)` | SyllabusInfo tab mount | GET /subjects/by-course/{id} |
| `getLectures(courseId)` | LecturesDetails tab mount | GET /lectures/by-subject/{subjectId} for each subject |
| `getMaterials(courseId)` | MaterialsInfo tab mount | GET /course-materials/by-course/{id} |
| `getLecturers(courseId)` | LecturersInfo tab mount | GET /lecturers/by-course/{id} |
| `getMockTests(courseId)` | MockTestList tab mount | GET /mock-tests/by-course/{id}/with-attempts |
| `lectureWatchLink(lectureId)` | Lecture card tap | POST /lectures/{id}/watch → returns url |
| `refreshMaterials/Lectures/Classes(courseId, force)` | Pull-to-refresh on course detail | Re-fetches the active tab's data |

---

## 6. Application Logic & Business Rules

### 6.1 Image URL Normalization
```typescript
const CDN_BASE = 'https://olp-uploads.s3.us-east-1.amazonaws.com/';

function resolveImageUrl(raw?: string | null): string | null {
  if (!raw) return null;
  if (raw.startsWith('http')) return raw;  // already absolute
  return CDN_BASE + raw;                   // bare filename — prepend CDN
}
```

### 6.2 Course Price Badge Logic
```typescript
function getCourseBadge(course: CourseModel): { type: 'FREE' | 'DISCOUNT' | 'NONE'; label?: string } {
  const isFree = (course.enrollmentCost ?? 0) === 0;
  if (isFree) return { type: 'FREE' };

  const hasValidDiscount =
    course.hasOffer === true &&
    course.discountedPrice != null &&
    course.enrollmentCost != null &&
    course.enrollmentCost > course.discountedPrice;

  if (hasValidDiscount) {
    const pct = Math.round(
      ((course.enrollmentCost! - course.discountedPrice!) / course.enrollmentCost!) * 100
    );
    return { type: 'DISCOUNT', label: `${pct}% OFF` };
  }

  return { type: 'NONE' };
}
```

### 6.3 `hasOffer` Field Normalization
The API may return `hasOffer` as a boolean (`true`/`false`), string (`"true"`/`"false"`), or integer (`1`/`0`). Always normalize:
```typescript
function normalizeHasOffer(raw: unknown): boolean {
  if (typeof raw === 'boolean') return raw;
  if (raw === 1 || raw === '1' || raw === 'true') return true;
  return false;
}
```

### 6.4 Live Class Status Computation
**NEVER trust the `status` field from the API** — it may be stale. Always compute from timestamps:
```typescript
function computeLiveClassStatus(cls: LiveClassModel): {
  isJoinable: boolean;
  isUpcoming: boolean;
  hasEnded: boolean;
  displayStatus: string;
} {
  const now = new Date();
  const start = cls.startTime ? new Date(cls.startTime) : null;
  const end = cls.endTime ? new Date(cls.endTime) : null;

  const isJoinable = start != null && end != null && now >= start && now <= end;
  const isUpcoming = start != null && start > now;
  const hasEnded = end != null && end < now;

  let displayStatus = 'Live now';
  if (isUpcoming) displayStatus = 'Starts soon';
  if (hasEnded) displayStatus = 'Completed';

  return { isJoinable, isUpcoming, hasEnded, displayStatus };
}
```

### 6.5 Category Hierarchy Flattening
The API returns categories with nested `children`. The Explore tab bar only shows **leaf categories** (no children):
```typescript
function flattenToLeafCategories(categories: CategoryModel[]): CategoryModel[] {
  const result: CategoryModel[] = [];
  function traverse(cats: CategoryModel[]) {
    for (const cat of cats) {
      if (!cat.children || cat.children.length === 0) {
        result.push(cat); // leaf node
      } else {
        traverse(cat.children);
      }
    }
  }
  traverse(categories);
  return result;
}
```

### 6.6 Enrollment Expiry Display
```typescript
function getExpiryLabel(expiryDate: string | null | undefined): string | null {
  if (!expiryDate) return null;
  const expiry = new Date(expiryDate);
  const now = new Date();
  const diffDays = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays > 0) return `Expires In: ${diffDays} Days`;
  if (diffDays === 0) return 'Expires Today';
  return 'Expired';
}
```

### 6.7 Lecture Grouping by Subject
```typescript
function groupLecturesBySubject(
  lectures: LectureModel[],
  subjects: SubjectModel[]
): Array<{ title: string; lectures: LectureModel[] }> {
  const grouped = new Map<string, LectureModel[]>();

  // Pre-create groups in subject order
  for (const s of subjects) grouped.set(s.id, []);

  for (const lec of lectures) {
    const key = lec.subjectId || '_uncategorized';
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(lec);
  }

  const result = [];
  // Subjects first (in order)
  for (const s of subjects) {
    const lecs = grouped.get(s.id) ?? [];
    if (lecs.length > 0) result.push({ title: s.subjectName, lectures: lecs });
  }
  // Then uncategorized
  const uncategorized = grouped.get('_uncategorized') ?? [];
  if (uncategorized.length > 0) result.push({ title: 'General Lectures', lectures: uncategorized });

  return result;
}
```

### 6.8 Lecture Duration Formatting
```typescript
function formatLectureDuration(seconds: number): string {
  if (seconds >= 3600) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  }
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  }
  return `${seconds}s`;
}
```

### 6.9 Enroll CTA Logic
```typescript
// Determines which CTA to show at the bottom of course detail
function getEnrollCTA(course: CourseDetailsResponse): 'FREE_ENROLL' | 'ESEWA_PAYMENT' | 'NONE' {
  if (!course || course.isEnrolled) return 'NONE';

  const effectivePrice = (course.hasOffer === true && course.discountedPrice != null)
    ? course.discountedPrice
    : (course.enrollmentCost ?? 0);

  return effectivePrice <= 0 ? 'FREE_ENROLL' : 'ESEWA_PAYMENT';
}
```

### 6.10 Video Playback Auth Headers
```typescript
function resolvePlaybackHeaders(
  watchUrl: string,
  apiBaseUrl: string,
  accessToken: string
): Record<string, string> | null {
  const playUri = new URL(watchUrl);
  const apiUri = new URL(apiBaseUrl);

  if (playUri.hostname !== apiUri.hostname) return null;  // external URL — no auth

  const signedKeys = ['token', 'signature', 'expires', 'x-amz-signature', 'x-amz-security-token'];
  const hasSignature = [...playUri.searchParams.keys()]
    .some(k => signedKeys.includes(k.toLowerCase()));

  if (hasSignature) return null;  // pre-signed URL — no extra auth

  return { Authorization: `Bearer ${accessToken}` };
}
```

---

## 7. User Interaction Flow

### 7.1 Explore Page Flow

```
User opens Explore tab
  → loadCategories() if not already loaded
  → fetch(page: 1) for "All Courses"
  → fetchSaved(force: true) to know which courses are bookmarked

User types in search box
  → fetch(page: 1, search: query) — re-fetches entire first page
  → "All Courses" tab stays selected; category filter still applies

User taps a category chip
  → fetch(page: 1, categoryId: category.id)
  → search query is preserved alongside category filter

User scrolls to near-bottom of grid
  → loadNextPage() → appends next page of results

User pull-to-refreshes
  → fetch(page: 1, forceRefresh: true)

User taps bookmark icon on a course card
  → optimistic UI update (toggle isSaved)
  → POST /courses/{id}/save or DELETE /courses/{id}/save
  → On failure: revert optimistic update + show SnackBar

User taps a course card
  → Hero animation → EnrolledCourseDetailsPage(courseId)

User taps hardware/swipe back
  → if search/filter active: clear filters, stay on page
  → else: pop to Dashboard
```

### 7.2 My Courses Flow

```
User opens Courses tab → My Courses pill selected by default
  → fetchEnrollments(force: true)
  → Shows list of enrolled courses with progress

User taps an enrollment card
  → EnrolledCourseDetailsPage(courseId, enrollment)

User pull-to-refreshes
  → fetchEnrollments(force: true)

User switches to Ongoing Classes pill
  → IndexedStack switches to OngoingClassList
  → fetchLiveClasses(force: true, status: 'ongoing') if not already loaded

User taps "Join Now" on a live class
  → POST /live-classes/{id}/join-token
  → On success: MeetingPageV2(token, classId)
  → On failure: SnackBar with error message
```

### 7.3 Course Detail Flow

```
User arrives at EnrolledCourseDetailsPage(courseId)
  → if detailsCourseId != courseId: getDetails(courseId)
  → getSubjects(courseId) always called

User views Syllabus tab (default tab 0)
  → subjects already loaded from getDetails
  → Taps a subject card → expands with animation → shows chapters
  → Taps a chapter → DraggableScrollableSheet with description

User switches to Materials tab
  → getMaterials(courseId) if not loaded
  → Taps a material → POST /course-materials/{id}/download → open URL

User switches to Lectures tab (requires enrollment)
  → getLectures(courseId) if not loaded
  → Subjects used to group lectures
  → Taps expansion tile → shows 2-column grid
  → Taps a lecture card → LectureDetailsBottomSheet
  → Taps "Watch" in bottom sheet → POST /lectures/{id}/watch
  → VideoPlayerPage(url, title, headers, lectureId)
  → 80% progress → POST /lectures/{id}/complete

User switches to Live Classes tab
  → fetchLiveClasses (courseId filter) if not loaded
  → Join flow same as Ongoing Classes tab

User switches to Mock Tests tab
  → getMockTests(courseId) if not loaded
  → Taps a test → exam/test launch flow

User switches to Lecturers tab
  → getLecturers(courseId) if not loaded
  → Static display of lecturer cards

Not enrolled user sees Enroll CTA at bottom:
  → Free course: "Enroll Now" button → POST /enrollments/enroll-free → show success dialog → reload details
  → Paid course: EnrollWithEsewaButton → eSewa payment → redirect back

User pull-to-refreshes course detail
  → getDetails(courseId) re-fetched
  → Active tab's data re-fetched
```

---

## 8. Navigation Flow

```
Dashboard
  └── Tab 1: ExplorePage
        ├── [category chip] ExplorePage (filter applied, same page)
        └── [course card tap] → EnrolledCourseDetailsPage
              ├── [Lectures tab > lecture tap] → VideoPlayerPage
              ├── [Live Classes tab > Join Now] → MeetingPageV2
              └── [Enroll → eSewa] → PaymentWebView → back to EnrolledCourseDetailsPage

  └── Tab 2: CoursePage
        ├── [My Courses pill]
        │     └── [enrollment card tap] → EnrolledCourseDetailsPage (with pre-loaded enrollment)
        └── [Ongoing Classes pill]
              └── [Join Now] → MeetingPageV2

Home Page
  └── [preferred category tap] → ExplorePage(initialCategoryId: id)
  └── [course card tap (any section)] → EnrolledCourseDetailsPage
  └── [course track card] → VideoPlayerPage (via lastAccessedLectureId) or EnrolledCourseDetailsPage
```

### Route Parameters

```typescript
// EnrolledCourseDetailsPage
interface CourseDetailRoute {
  courseId: string;
  initialTabIndex?: number;     // 0=Syllabus, 1=Materials, 2=Lectures, 3=Live, 4=Tests, 5=Lecturers
  enrollment?: EnrollmentModel; // pre-loaded enrollment (from My Courses); avoids extra API call
}

// VideoPlayerPage
interface VideoPlayerRoute {
  url: string;
  title?: string;
  lectureId?: string;
  thumbnailUrl?: string;
  processingStatus?: string;
  startPositionSeconds?: number;
}

// MeetingPageV2
interface MeetingRoute {
  token: string;    // Zoom Video SDK JWT
  classId: string;
}
```

---

## 9. Reusable Components

### HomeCourseCard
Used in both Explore grid and home page course sections.
```
Props:
  course: CourseModel
  onTap: () => void
  onBookmark: () => void

Layout (fixed 160px wide × 256px tall):
  - Top 140px: course image (BoxFit.cover)
  - Overlaid badges (top-right): "FREE" (green) or "X% OFF" (red)
  - Bookmark icon (top-right): filled=primary, outlined=gray
  - Bottom section: category name (bodySmall, gray600), title (bodyMedium, 600, max 2 lines), price row
  - Price row: 
    - Free: "Free" in green (success color)
    - Discounted: "Rs. X,XXX" + strikethrough original
    - Regular: "Rs. X,XXX"
```

### ExploreTabContainer
Used as category chip in Explore and as tab chip in Course Detail.
```
Props:
  text: string
  isSelected: boolean

Style:
  - Selected: primary bg, white text, shadow
  - Unselected: primary at 6%, gray700 text
  - Padding: 12px vertical, 16px horizontal, radius 20px
```

### CustomCachedNetworkImage
Wrapper around `cached_network_image` package.
```
Props:
  imageUrl: string | null
  size?: Size
  fitStatus?: BoxFit (default cover)
  
Behavior:
  - Shows placeholder (gray shimmer) while loading
  - Shows gray box with broken-image icon on error
  - Resolves image URL via resolveImageUrl() (CDN prefix logic)
```

### LiveClassCard (Ongoing Classes version)
```
Layout:
  - 180px banner image (cover fit, radius 12)
  - Status badge (top-left over image)
  - "Join Now" button (bottom-right over image)
  - Subject/category text below
  - Course title (max 2 lines)
  - Schedule row: clock icon + formatted time
  - Instructor row: 14px circle avatar + name
```

### EnrollmentCourseCard (My Courses version)
```
Layout (white card, 12px padding, gray200 border, radius 12):
  - Left: 74×74 thumbnail (radius 8)
  - Center: title, enrolled date, expiry label
  - Right: 60×60 circular progress (only if progress > 0)
    - Dark blue (#1E3A5F) stroke, gray300 background
    - Center: "XX%" percentage text
```

### SubjectCard (Syllabus tab)
```
Props:
  subject: SubjectModel
  index: number

States: expanded / collapsed
Animations:
  - Border color animated: gray200 → primary (2px), 300ms
  - Box shadow animated: black.06 → primary.12, 300ms
  - Arrow icon rotates 180° on expand, 300ms
  - Chapters list uses AnimatedSize for smooth height change

Chapter items: numbered badge, title, tap → DraggableScrollableSheet
```

### LectureCard (Lectures tab grid)
```
Layout (square aspect ratio):
  - Top 60% (flex 3): cover/thumbnail image; fallback = primary play icon
  - Bottom 40% (flex 2): lecture name (weight 600, max 2 lines), 
    lecturer row (10px initial avatar, name, play/lock icon)
  - Lock icon if not enrolled, play icon if enrolled
  - Tap → LectureDetailsBottomSheet (before navigating to player)
```

---

## 10. Next.js Implementation Notes

### 10.1 Project Structure Suggestion
```
app/
  explore/
    page.tsx                    ← ExplorePage
    [courseId]/
      page.tsx                  ← EnrolledCourseDetailsPage
      tabs/
        syllabus.tsx
        materials.tsx
        lectures.tsx
        live-classes.tsx
        mock-tests.tsx
        lecturers.tsx
  courses/
    page.tsx                    ← CoursePage (enrolled + ongoing)
  courses/[courseId]/
    page.tsx                    ← Can reuse EnrolledCourseDetailsPage

hooks/
  useCourses.ts                 ← Explore grid state + pagination
  useEnrollments.ts             ← My Courses state
  useLiveClasses.ts             ← Ongoing classes state
  useCourseDetail.ts            ← Course detail + all tabs
  useCategories.ts              ← Category hierarchy + flattening

lib/
  api/course-service.ts
  api/enrollment-service.ts
  utils/image.ts                ← resolveImageUrl()
  utils/live-class.ts           ← computeLiveClassStatus()
  utils/price.ts                ← getCourseBadge(), getEnrollCTA()
  utils/lectures.ts             ← groupLecturesBySubject(), formatLectureDuration()
```

### 10.2 Explore Page — Key Implementation Points

```tsx
// 1. Category tabs: fetch and flatten to leaf nodes
const { data: categories } = useQuery(['categories'], fetchCategories, {
  select: (data) => flattenToLeafCategories(data),
});

// 2. Infinite scroll with React Query
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useInfiniteQuery(
  ['courses', { search, categoryId }],
  ({ pageParam = 1 }) => fetchCourses({ page: pageParam, search, categoryId }),
  {
    getNextPageParam: (lastPage) => 
      lastPage.meta.hasNext ? lastPage.meta.page + 1 : undefined,
  }
);

// 3. Intersection Observer for infinite scroll (120px threshold equivalent)
const observerRef = useRef<IntersectionObserver>();
const loadMoreRef = useCallback((node: HTMLDivElement | null) => {
  if (isFetchingNextPage) return;
  if (observerRef.current) observerRef.current.disconnect();
  observerRef.current = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && hasNextPage) {
      fetchNextPage();
    }
  }, { rootMargin: '120px' });
  if (node) observerRef.current.observe(node);
}, [isFetchingNextPage, fetchNextPage, hasNextPage]);

// 4. Search debounce (300ms, min 2 chars — matches mobile)
const debouncedSearch = useDebounce(searchInput, 300);
useEffect(() => {
  if (debouncedSearch.length >= 2 || debouncedSearch.length === 0) {
    setSearch(debouncedSearch);
  }
}, [debouncedSearch]);
```

### 10.3 Course Detail — Tab Lazy Loading
Unlike mobile (IndexedStack mounts all tabs at once), on web you can lazy-load tab content:

```tsx
const tabNames = ['Syllabus', 'Materials', 'Lectures', 'Live Classes', 'Mock Tests', 'Lecturers'];

// Only fetch data when tab is first opened
const [loadedTabs, setLoadedTabs] = useState<Set<number>>(new Set([0]));

const handleTabChange = (index: number) => {
  setActiveTab(index);
  if (!loadedTabs.has(index)) {
    setLoadedTabs(prev => new Set([...prev, index]));
    // Trigger fetch for that tab
    fetchTabData(index, courseId);
  }
};
```

### 10.4 Enrollment Status and Tab Gating

```tsx
// Lectures tab — show lock if not enrolled
function LectureCard({ lecture, isEnrolled }: { lecture: LectureModel; isEnrolled: boolean }) {
  return (
    <div onClick={isEnrolled ? () => openLecture(lecture) : undefined}>
      {/* ... thumbnail ... */}
      <div>
        {isEnrolled 
          ? <PlayIcon className="text-primary" />
          : <LockIcon className="text-gray-400" />
        }
      </div>
    </div>
  );
}
```

### 10.5 Enroll CTA — Bottom Bar

```tsx
// Bottom sticky bar on course detail page
function EnrollCTA({ course }: { course: CourseDetailsResponse }) {
  const cta = getEnrollCTA(course);
  if (cta === 'NONE') return null;

  const price = course.hasOffer && course.discountedPrice != null
    ? course.discountedPrice
    : course.enrollmentCost;

  return (
    <div className="sticky bottom-0 bg-white border-t shadow-md px-4 py-3 flex items-center gap-3">
      <div className="flex-1">
        <p className="text-xs text-gray-500">Enrollment Fee</p>
        <div className="flex items-baseline gap-1">
          {cta === 'FREE_ENROLL' ? (
            <span className="text-xl font-bold text-green-600">Free</span>
          ) : (
            <>
              <span className="text-xl font-bold">
                Rs. {price?.toLocaleString()}
              </span>
              {course.hasOffer && course.enrollmentCost !== price && (
                <span className="text-xs text-gray-400 line-through">
                  Rs. {course.enrollmentCost?.toLocaleString()}
                </span>
              )}
            </>
          )}
        </div>
      </div>
      {cta === 'FREE_ENROLL' ? (
        <button onClick={handleFreeEnroll} className="bg-secondary text-white px-6 py-2 rounded-lg">
          Enroll Now
        </button>
      ) : (
        <EsewaButton courseId={course.id} />
      )}
    </div>
  );
}
```

### 10.6 Live Class Status Badge Colors

```tsx
const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  'Live now':     { bg: 'bg-primary/90', text: 'text-white', label: 'Live now' },
  'Starts soon':  { bg: 'bg-yellow-500/90', text: 'text-white', label: 'Starts soon' },
  'Completed':    { bg: 'bg-gray-500/90', text: 'text-white', label: 'Completed' },
};
```

### 10.7 Color Reference for Tailwind/CSS

```css
/* Primary palette (from app_colors.dart) */
--color-primary: #1C3B5A;
--color-secondary: #2A5D9F;
--color-accent: #3D7CC9;

/* Text */
--color-heading: #1A324D;
--color-text: #4A5B6E;

/* States */
--color-success: #2E7D32;
--color-failure: #D32F2F;
--color-warning: #F9A825;

/* Grays */
--color-gray-100: #F5F7FA;
--color-gray-200: #E8ECF0;
--color-gray-300: #D4D9DF;
--color-gray-400: #B0B8C1;
--color-gray-500: #8A95A0;
--color-gray-600: #6B7A87;
--color-gray-700: #4E5D6A;
--color-gray-800: #3A4A56;
--color-gray-900: #2A3642;

/* Course pill tab selected */
--color-tab-selected: #1E3A5F;

/* Background */
--color-scaffold-bg: #F0F4F8;
--color-surface: #FFFFFF;
```

### 10.8 Typography Reference

| Name | Size | Weight | Usage |
|---|---|---|---|
| headlineLarge | 24px | 700 | Course title in detail header |
| headlineSmall | 18px | 700 | Price in enroll CTA |
| titleLarge | 20px | 700 | Subject names in syllabus |
| titleMedium | 16px | 600 | Group titles in lectures |
| bodyLarge | 16px | 400/600 | Course title in cards |
| bodyMedium | 14px | 400 | Body text, descriptions |
| bodySmall | 12px | 400/600 | Labels, metadata, badges |
| labelSmall | 10px | 400 | Lecturer initial in avatar |

Font families: `Nunito Sans` (light theme) / `Hanken Grotesk` (dark theme)

### 10.9 Authentication Requirements

| Screen/Tab | Auth Required |
|---|---|
| Explore grid (GET /courses) | No |
| Subjects/Syllabus (GET /subjects/by-course) | No |
| Lecturers (GET /lecturers/by-course) | No |
| Categories (GET /courses/categories) | No |
| Saved courses | Yes |
| Bookmark / unbookmark | Yes |
| Enrollment list | Yes |
| Course details (GET /courses/{id}/details) | Yes |
| Materials | Yes |
| Lectures (watch URL) | Yes |
| Mock Tests (with-attempts) | Yes |
| Live Classes | Yes |
| Free enrollment | Yes |
| eSewa payment | Yes |

Unauthenticated users can browse Explore but must sign in to:
- Save courses
- See enrollment status
- Access lecture content
- Enroll

### 10.10 Key Gotchas for Web Rebuild

1. **`hasOffer` type inconsistency** — may be `boolean`, `"true"`, or `1`. Always normalize with `normalizeHasOffer()`.

2. **Image URLs** — API returns bare filenames for `courseImageUrl`, `courseIconUrl`, `profileImageUrl`. Always run through `resolveImageUrl()`.

3. **Live class status** — Never use the `status` field from the API for join button logic. Always compute from `startTime`/`endTime` + current time.

4. **Category hierarchy** — Categories come nested. Only use leaf nodes (no children) as filter chips. Keep parent categories for display/breadcrumbs only.

5. **Course detail `isEnrolled`** — Check BOTH `details.isEnrolled` boolean AND `details.enrollmentDetails.status` for accurate enrollment state.

6. **Lecture watch URL auth** — For URLs on the same domain as API: add `Authorization: Bearer` header. For S3 signed URLs (different domain or signature query params): do NOT add auth header.

7. **Tab data lazy loading** — In mobile, all 6 tabs are mounted simultaneously in `IndexedStack`. On web, lazy load each tab's data on first activation for performance.

8. **Mock test `numberOfQuestions`** — May be null. Use `resolvedQuestionCount` computed property: tries `numberOfQuestions`, then sums `subjectDistribution`, then counts `questions` array length.

9. **Enrollment progress** — `progressPercentage` is a `double` 0–100 (not 0–1). Clamp to [0, 100] before display.

10. **Category tab "All Courses"** — This is always index 0 and corresponds to `categoryId: null` (no filter). It's hardcoded, not from the API.
