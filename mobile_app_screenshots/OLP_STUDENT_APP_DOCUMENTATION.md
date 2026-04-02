# OLP Student App — Complete Technical & Functional Documentation

> **Purpose:** This document fully describes the OLP (Online Learning Platform / ScholarGyan) Flutter mobile app so that a Next.js web application can be built that replicates its behavior precisely.
>
> **Generated:** 2026-03-31  
> **Source:** Full codebase analysis of `lib/` directory

---

## Table of Contents

1. [App Overview](#1-app-overview)
2. [User Journey](#2-user-journey)
3. [Navigation Map](#3-navigation-map)
4. [Screens and Pages](#4-screens-and-pages)
5. [API Reference](#5-api-reference)
6. [Data Models](#6-data-models)
7. [UI Design System](#7-ui-design-system)
8. [State Management Logic](#8-state-management-logic)
9. [Web Implementation Guide](#9-web-implementation-guide)

---

## 1. App Overview

| Property | Value |
|---|---|
| **App Name** | OLP (Online Learning Platform) |
| **Brand Name** | ScholarGyan |
| **Framework** | Flutter (Dart) |
| **Architecture** | Clean Architecture + Feature-first modules |
| **State Management** | Riverpod v3 (StateNotifier pattern) |
| **HTTP Client** | Dio v5.9 with interceptors |
| **Local Storage** | flutter_secure_storage (tokens) + Hive (cache) |
| **Backend Base URL** | `https://scholargyan.onecloudlab.com/api/v1/` |
| **Image CDN Base URL** | `https://olp-uploads.s3.us-east-1.amazonaws.com/` |
| **Payment Gateway** | eSewa (Nepal) |
| **Video Conferencing** | Zoom Video SDK |
| **Push Notifications** | Firebase Cloud Messaging (FCM) |

### Core Feature Set

The app is an **online learning platform for students** in Nepal. It provides:

- Email-based authentication with OTP verification
- Course browsing, enrollment (free and paid via eSewa)
- Video lectures with progress tracking
- Live classes via Zoom
- Mock tests / exam preparation
- Exam listing and tracking
- Personalized dashboard based on user category preferences
- User profile management

---

## 2. User Journey

### 2.1 App Startup Decision Tree

```
App Launch
    │
    ▼
SplashPage
(calls checkAuthenticationOnStartup)
    │
    ├── No token in secure storage?
    │       └──▶ LoginScreen
    │
    ├── Token exists (even if expired)?
    │       │
    │       ├── Fetch /auth/me
    │       │       │
    │       │       ├── 401/403 → Logout → LoginScreen
    │       │       │
    │       │       └── Success → Dashboard
    │       │
    │       └── API fails + cached user exists → Dashboard (offline mode)
    │
    └── Token exists, no cached user, API fails → LoginScreen
```

### 2.2 First-Time User Flow (After Login)

```
LoginScreen
    │
    ▼
POST /auth/email/login
    │
    ▼
Check user.hasSelectedCategories
    │
    ├── false → CourseSelection page
    │               │
    │               ▼
    │           GET /categories/hierarchy
    │               │
    │               ▼
    │           User selects 1+ categories
    │               │
    │               ▼
    │           POST /user-preferences/favorite-categories
    │               │
    │               ▼
    │           GET /auth/me (refresh user)
    │               │
    │               ▼
    │           Dashboard (Home tab)
    │
    └── true → Dashboard (Home tab) directly
```

### 2.3 Registration Flow

```
LoginScreen → "Register" link
    │
    ▼
RegistrationPage
(fullName, email, mobileNumber, password, confirmPassword, terms)
    │
    ▼
POST /auth/email/register
    │
    ▼
EmailVerificationPage
(6-digit OTP sent to email)
    │
    ▼
POST /auth/email/verify-otp
    │
    ▼
LoginScreen (user redirected to login after verification)
```

### 2.4 Password Reset Flow

```
LoginScreen → "Forgot Password"
    │
    ▼
ForgotPasswordPage (enter email)
    │
    ▼
POST /auth/forgot/password
    │
    ▼
OTP Verification Page
    │
    ▼
POST /auth/verify/otp
    │
    ▼
ResetPasswordPage (new password + confirm)
    │
    ▼
POST /auth/reset/password
    │
    ▼
LoginScreen
```

### 2.5 Returning User Flow

```
App Launch → Token found in secure storage
    │
    ▼
SplashPage (shows CircularProgressIndicator)
    │
    ▼
GET /auth/me (validates session)
    │
    ▼
Dashboard (last tab preserved in session)
```

### 2.6 Course Enrollment Flow (Paid)

```
Explore tab → Browse course card
    │
    ▼
EnrolledCourseDetailsPage (course detail)
    │
    ▼
Tap "Enroll" button
    │
    ▼
POST /payments/initiate { paymentType: "course", referenceId: courseId }
    │
    ▼
Receive esewaRedirectUrl
    │
    ▼
Open eSewa payment page (WebView or external browser)
    │
    ▼
Payment success/failure callback
    │
    ▼
POST /payments/verify
    │
    ▼
Course appears in "My Courses" tab
```

### 2.7 Course Enrollment Flow (Free)

```
Course details page → "Enroll Free" button
    │
    ▼
POST /enrollments/free-course { courseId }
    │
    ▼
Success → Course available in "Courses" tab
```

### 2.8 Taking a Mock Test Flow

```
Test tab → "Available Tests"
    │
    ▼
Select course → list of mock tests
    │
    ▼
Tap mock test
    │
    ▼
POST /test-sessions/start { testId }
    │
    ▼
QuizPage (answer questions, countdown timer)
    │
    ▼
Submit answers
    │
    ▼
Results page (score, breakdown)
    │
    ▼
Appears in "Test History" tab
```

---

## 3. Navigation Map

### 3.1 Navigation Tree (Full)

```
App Root
├── SplashPage (startup auth check)
│
├── [UNAUTHENTICATED]
│   ├── LoginScreen
│   ├── RegistrationPage
│   ├── EmailVerificationPage
│   ├── ForgotPasswordPage
│   ├── OtpVerificationPage
│   └── ResetPasswordPage
│
├── [FIRST-TIME USER]
│   └── CourseSelection (category picker)
│
└── [AUTHENTICATED] → Dashboard (5-tab IndexedStack)
    │
    ├── [Tab 0] HomePage
    │   ├── SearchPage (full-screen search)
    │   ├── CourseDetailPage (from recommended courses)
    │   ├── LiveClassDetailPage (from live classes)
    │   └── UpcomingLiveClassesPage
    │
    ├── [Tab 1] ExplorePage
    │   ├── CourseDetail / EnrolledCourseDetailsPage
    │   └── SearchPage
    │
    ├── [Tab 2] CoursePage
    │   ├── [Sub-tab 0] "My Courses" (enrolled courses list)
    │   │   ├── EnrolledCourseDetailsPage
    │   │   │   ├── VideoPlayerPage (lecture playback)
    │   │   │   ├── LectureDetailsWidget
    │   │   │   └── CourseMaterials download list
    │   │   └── LiveClassDetailPage
    │   └── [Sub-tab 1] "Ongoing Classes" (live class schedule)
    │       └── MeetingPageV2 (Zoom live class)
    │
    ├── [Tab 3] TestPage
    │   ├── [Sub-tab 0] "Available Tests"
    │   │   ├── Course selector dropdown
    │   │   ├── MockTestList
    │   │   └── QuizPage (test session)
    │   │       └── TestResultPage
    │   └── [Sub-tab 1] "Test History"
    │       └── TestHistoryDetailPage
    │
    └── [Tab 4] ProfilePage
        ├── EditProfilePage
        ├── ChangePasswordPage
        ├── CourseSelection (update preferred categories)
        ├── SavedCoursesPage
        ├── UpcomingClassesPage
        ├── ExamListPage (from profile)
        ├── AboutUsPage (from app-info/about)
        ├── TermsPage (from app-info/terms)
        ├── FaqsPage (from app-info/faqs)
        └── HelpSupportPage
```

### 3.2 Bottom Navigation Tabs

| Index | Label | Icon (SVG) | Page Component |
|---|---|---|---|
| 0 | Home | AppAssets.homeIcon | `HomePage` |
| 1 | Explore | AppAssets.exploreIcon | `ExplorePage` |
| 2 | Courses | AppAssets.coursesIcon | `CoursePage` |
| 3 | Test | AppAssets.testIcon | `TestPage` |
| 4 | Profile | AppAssets.profileIcon | `ProfilePage` |

**Implementation:** Uses Flutter `IndexedStack` — all tabs are mounted simultaneously, preserving scroll position. The active tab is tracked via `navigationProvider` (Riverpod StateNotifier).

---

## 4. Screens and Pages

### 4.1 SplashPage

**File:** `lib/main.dart` → `SplashPage`  
**Purpose:** Shows a loading spinner while checking if a valid auth token exists.  
**Logic:** Calls `checkAuthenticationOnStartup()` which reads secure storage, fetches `/auth/me`, and resolves to Dashboard or LoginScreen.  
**UI:** White scaffold with centered `CircularProgressIndicator`.

---

### 4.2 LoginScreen

**File:** `lib/features/auth/view/pages/login_page.dart`  
**Purpose:** Email + password login form.  
**UI Components:**
- App logo / branding header
- Email text field (keyboard: emailAddress)
- Password text field (obscured, with show/hide toggle)
- "Forgot Password?" link
- Primary "Login" button (full width)
- "Don't have an account? Register" link
- Field-level validation error messages
- General error banner (snackbar/banner)

**APIs Used:**
- `POST /auth/email/login`

**Post-login navigation:**
- `hasSelectedCategories == false` → `CourseSelection`
- `hasSelectedCategories == true` → `Dashboard`

---

### 4.3 RegistrationPage

**File:** `lib/features/auth/view/pages/registration_page.dart`  
**Purpose:** New user signup.  
**UI Components:**
- Full Name field
- Email field
- Mobile Number field (with Nepal +977 prefix)
- Password field (min 8 chars)
- Confirm Password field
- Terms & Conditions checkbox + link
- "Register" button
- "Already have an account? Login" link
- Field-level errors (server-side validation)
- Rate-limit countdown display (throttleSeconds)

**APIs Used:**
- `POST /auth/email/register`

---

### 4.4 EmailVerificationPage

**File:** `lib/features/auth/view/pages/email_verification_page.dart`  
**Purpose:** OTP verification after registration or resend.  
**UI Components:**
- 6-digit OTP input (pin_code_fields style)
- "Verify" button
- "Resend OTP" button (with countdown timer)
- Email display ("We sent OTP to you@email.com")

**APIs Used:**
- `POST /auth/email/verify-otp` (verify OTP)
- `POST /auth/email/send-verification` (resend)

---

### 4.5 CourseSelection (Category Picker)

**File:** `lib/features/before_auth/presentation/pages/course_selection.dart`  
**Purpose:** First-time user picks preferred course categories.  
**Shown when:** `user.hasSelectedCategories == false` after login.  
**Also accessible from:** Profile → "Preferred Categories" (with `fromLogin: false`)

**UI Components:**
- Greeting message ("Namaste [fullName]")
- Instructional subtitle
- Expandable list of parent categories (accordion/expansion tiles)
  - Each parent shows child categories as selectable chips/items
  - Multi-select allowed
  - First item expanded by default
- "Next" button at bottom (full-width)
- Loading state on submit

**APIs Used:**
- `GET /categories/hierarchy` (load category tree)
- `POST /user-preferences/favorite-categories` (save selection)

**Post-submit:** Refreshes user (`GET /auth/me`) then navigates to `Dashboard`.

**Category hierarchy structure:**
```json
[
  {
    "parentCategory": {
      "id": "...",
      "categoryName": "Engineering",
      "categoryImageUrl": "..."
    },
    "childCategories": [
      { "id": "...", "categoryName": "Civil Engineering" },
      { "id": "...", "categoryName": "Computer Engineering" }
    ]
  }
]
```

---

### 4.6 Dashboard

**File:** `lib/features/dashboard/presentation/pages/dashboard.dart`  
**Purpose:** Main app shell with bottom navigation bar.  
**UI Components:**
- `IndexedStack` with 5 pages
- Custom `BottomNavigationBar` with SVG icons
  - Selected: `AppColors.primary` (#1C3B5A), scaled up 1.1×
  - Unselected: `AppColors.gray700`
  - Background: white card with elevation 10, borderRadius 12
  - Type: `fixed` (no shifting)

---

### 4.7 HomePage

**File:** `lib/features/home/presentation/pages/home_page.dart`  
**Purpose:** Personalized dashboard for the student.

**UI Layout (top to bottom):**

| Section | Widget | Description |
|---|---|---|
| Header | Avatar + "Namaste [name]" | Links to ProfilePage |
| Search bar | Full-width tappable field | Navigates to SearchPage |
| Banner Slider | Auto-scrolling horizontal list | Promotional course banners |
| Recommended Courses | Horizontal `ListView` | Cards with image, title, price |
| Continue Learning | Single card with progress bar | Latest ongoing course, resumes from last position |
| Upcoming Classes | Horizontal list | Next scheduled live classes |
| Live Classes | Horizontal list | Currently active live classes |
| Upcoming Exam | Single card with countdown | Days until next exam |
| Preferred Categories | Expandable chip list | User's chosen categories (editable) |
| Grab the Deals | Top category + discounted courses | Promotional section |

**APIs Used:**
- `GET /homepage` (single endpoint fetches everything)

**Data shape:** See `HomepageResponse` in Data Models section.

---

### 4.8 SearchPage

**File:** `lib/features/home/presentation/pages/search_page.dart`  
**Purpose:** Global search across courses, exams, live classes.  
**UI Components:**
- Search text field (auto-focus)
- Real-time results list
- Result categories (courses, exams)
- Empty state / no results message

**APIs Used:**
- `GET /homepage/search?q=keyword`

---

### 4.9 ExplorePage

**File:** `lib/features/explore/presentation/pages/explore_page.dart`  
**Purpose:** Browse all available courses by category.  
**UI Components:**
- Tab bar: "Courses" tab and "Details" tab (ExamDetails)
- Category filter chips (horizontal scroll)
- Search field
- Course grid/list with pagination (infinite scroll)
- Course cards: image, title, price, duration, save icon

**Sub-tabs:**
- `CoursesTab` — paginated course list with category filter
- `DetailsTab` — exam details / category details

**APIs Used:**
- `GET /courses?page=1&limit=10&search=&categoryId=`
- `GET /courses/{id}/save` (POST to save, DELETE to unsave)
- `GET /exams?page=1&limit=10`

---

### 4.10 CoursePage (My Courses)

**File:** `lib/features/courses/presentation/pages/courses_page.dart`  
**Purpose:** Shows enrolled courses and live class schedule.  
**UI Components:**
- Tab bar: "My Courses" | "Ongoing Classes"
- Enrolled courses list (cards with progress bars)
- Ongoing classes list (live class cards with join button)

**APIs Used:**
- `GET /enrollments/my-courses`
- `GET /live-classes/my-classes`

---

### 4.11 EnrolledCourseDetailsPage

**File:** `lib/features/courses/presentation/pages/enrolled_course_details_page.dart`  
**Purpose:** Full detail view of a course (both enrolled and unenrolled users).  
**UI Components:**
- Course banner image
- Course title, category, duration, validity
- Price display (with strikethrough if discounted)
- Progress bar (if enrolled)
- "Enroll" / "Pay" button (if not enrolled)
- Tabs: Subjects, Lecturers, Materials
  - **Subjects tab:** Accordion list of subjects → chapters → lectures
  - **Lecturers tab:** Instructor profiles
  - **Materials tab:** PDF / file list with download buttons
- Mock test section

**APIs Used:**
- `GET /courses/{id}/details`
- `GET /subjects/course/{courseId}`
- `GET /lecturers/course/{courseId}`
- `GET /course-materials/course/{courseId}`
- `GET /lectures/subject/{subjectId}`
- `GET /enrollments/courses/{courseId}/details`
- `GET /mock-tests/courses/{courseId}/with-attempts`
- `POST /payments/initiate`
- `POST /enrollments/free-course`

---

### 4.12 VideoPlayerPage

**File:** `lib/features/courses/presentation/pages/video_player_page.dart`  
**Purpose:** Plays lecture videos, tracks progress.  
**UI Components:**
- Video player (custom controls: play/pause, seek, fullscreen)
- Lecture title and description
- Previous / Next lecture navigation
- Progress tracking (marks lecture complete)
- Notes section

**APIs Used:**
- `GET /lectures/{id}` (get video URL)
- `POST /enrollments/progress/complete-lecture { lectureId, courseId }`

---

### 4.13 LiveClassDetailPage

**File:** `lib/features/courses/presentation/pages/live_class_detail_page.dart`  
**Purpose:** Shows live class details and join button.  
**UI Components:**
- Class banner image
- Title, subject, lecturer info
- Scheduled time / status badge ("Upcoming" / "Live" / "Completed")
- Countdown timer (for upcoming classes)
- "Join Class" button (launches Zoom)

**APIs Used:**
- `GET /lectures/{id}` (live class info)

---

### 4.14 MeetingPageV2

**File:** `lib/features/courses/presentation/pages/meeting_page_v2.dart`  
**Purpose:** Zoom video class interface.  
**UI:** Zoom Video SDK embedded in Flutter widget.  
**Integration:** `flutter_zoom_videosdk` package.

---

### 4.15 UpcomingLiveClassesPage

**File:** `lib/features/courses/presentation/pages/upcoming_live_classes_page.dart`  
**Purpose:** Full list of upcoming live classes.  
**APIs Used:**
- `GET /live-classes/my-classes`

---

### 4.16 TestPage

**File:** `lib/features/test/presentation/pages/test_page.dart`  
**Purpose:** Mock test center.  
**UI Components:**
- Tab bar: "Available Tests" | "Test History"
- Course dropdown/selector in "Available Tests"
- Mock test cards (title, question count, marks, time limit, attempt status)
- "Start Test" button
- Test history list with scores

**APIs Used:**
- `GET /enrollments/my-courses` (to populate course dropdown)
- `GET /mock-tests/courses/{courseId}/with-attempts`
- `POST /test-sessions/start`
- `GET /test-sessions/history/me`

---

### 4.17 ExamListPage

**File:** `lib/features/exams/presentation/pages/exam_list_page.dart`  
**Purpose:** Browse all available exams (national/state exams the platform covers).  
**UI Components:**
- Search field
- Filter: status (active/inactive), category, sort order
- Paginated exam cards (image, title, category, validity, course count)
- Infinite scroll

**APIs Used:**
- `GET /exams?page=1&limit=10&search=&status=&category=&sortBy=createdAt&sortOrder=desc`

---

### 4.18 ExamDetailPage

**File:** `lib/features/exams/presentation/pages/exam_detail_page.dart`  
**Purpose:** Details of a specific exam including associated courses.  
**UI Components:**
- Exam banner image
- Exam title, description, category
- Validity info
- Associated courses list

**APIs Used:**
- `GET /exams/{id}`

---

### 4.19 ProfilePage

**File:** `lib/features/profile/presentation/pages/profile_page.dart`  
**Purpose:** User account hub.  
**UI Layout:**

```
[Profile Card]
  - Avatar (circular, tappable to upload)
  - Full Name
  - Email

[My Data]
  - Exam Lists          → ExamListPage
  - Saved Courses       → SavedCoursesPage  (GET /courses/saved/my-courses)
  - Upcoming Classes    → UpcomingClassesPage
  - Mock Tests          → TestPage (Test tab)
  - Preferred Categories → CourseSelection (fromLogin: false)

[General]
  - My Profile          → EditProfilePage
  - Logout              → Clears tokens, resets all providers, → LoginScreen

[About Us]
  - About Us            → GET /app-info/about
  - Terms & Conditions  → GET /app-info/terms
  - FAQs                → GET /app-info/faqs
  - Help & Support
  - Privacy Policy
```

**APIs Used:**
- `GET /auth/me`
- `POST /auth/me/upload-profile-picture` (multipart)
- `DELETE /auth/me` (delete account)

---

### 4.20 EditProfilePage

**File:** `lib/features/profile/presentation/pages/edit_profile_page.dart`  
**Purpose:** Edit user's full name, email, mobile number.  
**APIs Used:**
- `PATCH /auth/me { fullName, email, mobileNumber }`

---

### 4.21 ChangePasswordPage

**File:** `lib/features/profile/presentation/pages/change_password_page.dart`  
**Purpose:** Change password (requires old password).  
**APIs Used:**
- `POST /auth/me/password { oldPassword, newPassword }`

---

## 5. API Reference

### Base Configuration

```
Base URL:       https://scholargyan.onecloudlab.com/api/v1/
Image CDN:      https://olp-uploads.s3.us-east-1.amazonaws.com/
Timeout:        Connect 30s, Receive 8s
Auth Header:    Authorization: Bearer <JWT_TOKEN>
Content-Type:   application/json
```

### 5.1 Authentication APIs

#### POST /auth/email/register
Register a new user.

**Request:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "mobileNumber": "+977XXXXXXXXXX",
  "password": "Password123!",
  "confirmPassword": "Password123!",
  "hasConfirmedToTerms": true
}
```

**Response (201):**
```json
{
  "message": "Registration successful. Please verify your email."
}
```

**Error (422) — Field validation:**
```json
{
  "errors": {
    "email": ["Email already in use"],
    "password": ["Password too weak"]
  }
}
```

---

#### POST /auth/email/login
Authenticate user with email and password.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "Password123!"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "abc123...",
  "tokenExpires": 1711900000,
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "fullName": "John Doe",
    "mobileNumber": "+977XXXXXXXXXX",
    "isVerified": true,
    "hasSelectedCategories": false,
    "favoriteCategories": [],
    "photo": { "url": "https://..." },
    "role": { "id": "...", "name": "user" },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error (401) — Invalid credentials:**
```json
{ "message": "Invalid email or password" }
```

**Error (429) — Rate limited:**
```json
{ "message": "Too many attempts", "throttleSeconds": 60 }
```

---

#### POST /auth/email/send-verification
Send/resend email verification OTP.

**Request:**
```json
{ "email": "john@example.com" }
```

---

#### POST /auth/email/verify-otp
Verify email OTP.

**Request:**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

---

#### POST /auth/forgot/password
Initiate password reset (sends OTP).

**Request:**
```json
{ "email": "john@example.com" }
```

---

#### POST /auth/verify/otp
Verify password reset OTP.

**Request:**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

---

#### POST /auth/reset/password
Set new password after OTP verified.

**Request:**
```json
{
  "email": "john@example.com",
  "otp": "123456",
  "newPassword": "NewPassword123!"
}
```

---

#### POST /auth/refresh
Refresh access token.

**Request:**
```json
{ "refreshToken": "abc123..." }
```

**Response:**
```json
{
  "token": "newToken...",
  "refreshToken": "newRefreshToken...",
  "tokenExpires": 1711900000
}
```

---

#### GET /auth/me
Get current authenticated user's profile.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": "uuid",
  "email": "john@example.com",
  "fullName": "John Doe",
  "mobileNumber": "+977XXXXXXXXXX",
  "isVerified": true,
  "hasSelectedCategories": true,
  "favoriteCategories": ["cat_id_1", "cat_id_2"],
  "savedCourses": ["course_id_1"],
  "photo": { "url": "https://...", "path": "..." },
  "role": { "id": "...", "name": "user" },
  "status": { "id": "...", "name": "active" },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-15T00:00:00.000Z"
}
```

---

#### PATCH /auth/me
Update user profile.

**Request:**
```json
{
  "fullName": "John Updated",
  "mobileNumber": "+977XXXXXXXXXX"
}
```

---

#### POST /auth/me/password
Change password (authenticated).

**Request:**
```json
{
  "oldPassword": "OldPass123!",
  "newPassword": "NewPass123!"
}
```

---

#### POST /auth/me/upload-profile-picture
Upload profile photo (multipart/form-data).

**Request:** `FormData` with `file` field.

---

#### POST /auth/logout
Logout (invalidate refresh token on server).

---

### 5.2 Category APIs

#### GET /categories/hierarchy
Get full category tree for selection screen.

**Response:**
```json
[
  {
    "parentCategory": {
      "id": "parent_uuid",
      "categoryName": "Engineering",
      "categoryImageUrl": "engineering.svg"
    },
    "childCategories": [
      {
        "id": "child_uuid_1",
        "categoryName": "Civil Engineering",
        "categoryImageUrl": "civil.svg"
      }
    ]
  }
]
```

---

#### POST /user-preferences/favorite-categories
Save user's preferred categories.

**Request:**
```json
{
  "categoryIds": ["child_uuid_1", "child_uuid_2"]
}
```

---

### 5.3 Homepage APIs

#### GET /homepage
Fetch all homepage data in a single request.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "userProfile": {
    "fullName": "John Doe",
    "photo": "https://..."
  },
  "preferredCategories": [
    { "id": "...", "categoryName": "Engineering", "categoryImageUrl": "..." }
  ],
  "recommendedExams": [...],
  "recommendedCourses": [...],
  "bannerCourses": [...],
  "latestOngoingCourse": {
    "id": "...",
    "courseTitle": "...",
    "courseImageUrl": "...",
    "progressPercentage": 45.5,
    "completedLectures": 9,
    "totalLectures": 20,
    "lastAccessedLectureId": "...",
    "lastAccessedLectureTitle": "...",
    "lastWatchedPositionSeconds": 300
  },
  "liveClasses": [...],
  "upcomingExam": {
    "id": "...",
    "title": "...",
    "examDate": "2024-06-15T00:00:00.000Z",
    "daysUntilExam": 45
  },
  "topCategoryWithCourses": {
    "categoryId": "...",
    "categoryName": "Engineering",
    "courses": [...]
  }
}
```

---

#### GET /homepage/search?q={keyword}
Global search.

**Query params:** `q` (search string)

**Response:** Mixed results (courses, exams, live classes).

---

#### GET /homepage/latest-category
Fetch latest/trending category with courses.

---

### 5.4 Course APIs

#### GET /courses
List all published courses (paginated).

**Query params:**
```
page=1
limit=10
search=keyword
categoryId=uuid
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "courseTitle": "Civil Engineering Complete",
      "courseDescription": "...",
      "categoryId": "...",
      "categoryName": "Civil Engineering",
      "courseImageUrl": "course_banner.jpg",
      "courseIconUrl": "course_icon.png",
      "enrollmentCost": 2999,
      "discountedPrice": 1999,
      "hasOffer": true,
      "durationHours": 120,
      "validityDays": 365,
      "slug": "civil-engineering-complete",
      "isPublished": true,
      "isSaved": false,
      "tags": ["engineering", "civil"]
    }
  ],
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

#### GET /courses/{id}
Get single course by ID.

---

#### GET /courses/slug/{slug}
Get course by URL slug.

---

#### GET /courses/{id}/details
Get full course details including subjects, lecturers, materials count.

---

#### POST /courses/{id}/save
Bookmark a course.

#### DELETE /courses/{id}/save
Remove bookmark.

#### GET /courses/{id}/is-saved
Check if course is bookmarked.

**Response:** `{ "isSaved": true }`

---

#### GET /courses/saved/my-courses
Get all bookmarked courses.

---

#### GET /courses/category/{categoryId}
Get courses filtered by category.

---

### 5.5 Enrollment APIs

#### GET /enrollments/my-courses
Get all enrolled courses.

**Response:**
```json
[
  {
    "id": "enrollment_uuid",
    "course": {
      "id": "...",
      "courseTitle": "...",
      "courseImageUrl": "..."
    },
    "progress": {
      "completedLecturesCount": 5,
      "totalLectures": 20,
      "progressPercentage": 25.0,
      "lastAccessedAt": "2024-01-15T..."
    },
    "certificate": {
      "issued": false,
      "issuedAt": null,
      "certificateUrl": null
    },
    "status": "active",
    "enrolledAt": "2024-01-01T..."
  }
]
```

---

#### GET /enrollments/courses/{courseId}/details
Get enrollment details for a specific course.

---

#### POST /enrollments/free-course
Enroll in a free course.

**Request:**
```json
{ "courseId": "uuid" }
```

---

#### POST /enrollments/progress/complete-lecture
Mark a lecture as watched/completed.

**Request:**
```json
{
  "lectureId": "uuid",
  "courseId": "uuid"
}
```

---

### 5.6 Subject, Lecture, Material APIs

#### GET /subjects/course/{courseId}
Get all subjects for a course, including chapters.

**Response:**
```json
[
  {
    "id": "...",
    "courseId": "...",
    "subjectName": "Structural Engineering",
    "markWeight": 20,
    "displayOrder": 1,
    "chapters": [
      {
        "id": "...",
        "chapterNumber": 1,
        "chapterTitle": "Introduction",
        "displayOrder": 1
      }
    ]
  }
]
```

---

#### GET /lectures/subject/{subjectId}
Get all lectures for a subject.

**Response:**
```json
[
  {
    "id": "...",
    "courseId": "...",
    "subjectId": "...",
    "name": "Lecture 1: Introduction",
    "thumbnailUrl": "...",
    "durationSeconds": 3600,
    "isFree": false,
    "displayOrder": 1,
    "lecturerName": "Prof. Ram Sharma",
    "processingStatus": "ready"
  }
]
```

---

#### GET /lectures/{id}
Get full lecture detail including video URL.

---

#### GET /lectures/free
Get free preview lectures.

---

#### GET /lecturers/course/{courseId}
Get instructors for a course.

**Response:**
```json
[
  {
    "id": "...",
    "fullName": "Prof. Ram Sharma",
    "email": "ram@example.com",
    "profileImageUrl": "...",
    "subjects": "Structural, Geotechnical"
  }
]
```

---

#### GET /course-materials/course/{courseId}
Get all downloadable materials for a course.

---

#### GET /course-materials/subject/{subjectId}
Get materials for a specific subject.

---

#### GET /course-materials/{id}/download
Download a material file (returns signed URL or stream).

---

### 5.7 Live Class APIs

#### GET /live-classes/my-classes
Get live classes for enrolled courses.

**Response:**
```json
[
  {
    "id": "...",
    "title": "Structural Analysis - Class 1",
    "scheduledAt": "2024-06-01T10:00:00.000Z",
    "thumbnailUrl": "...",
    "status": "upcoming",
    "durationMinutes": 90,
    "lecturerName": "Prof. Ram",
    "courseId": "..."
  }
]
```

---

### 5.8 Mock Test APIs

#### GET /mock-tests/courses/{courseId}/with-attempts
Get mock tests for a course, including attempt history.

**Response:**
```json
[
  {
    "id": "...",
    "title": "Full Mock Test 1",
    "courseId": "...",
    "questions": 100,
    "totalMarks": 100,
    "timeLimit": 120,
    "attempted": true,
    "lastAttempt": {
      "id": "...",
      "score": 72,
      "totalMarks": 100,
      "completedAt": "2024-01-10T..."
    }
  }
]
```

---

#### POST /test-sessions/start
Start a new test session.

**Request:**
```json
{ "testId": "mock_test_uuid" }
```

**Response:**
```json
{
  "sessionId": "...",
  "questions": [
    {
      "id": "...",
      "questionText": "...",
      "options": ["A", "B", "C", "D"],
      "marks": 1
    }
  ],
  "timeLimit": 120,
  "totalQuestions": 100
}
```

---

#### GET /test-sessions/history/me
Get user's test attempt history.

---

### 5.9 Exam APIs

#### GET /exams
List all exams (paginated, filterable).

**Query params:**
```
page=1
limit=10
search=keyword
status=active
category=uuid
sortBy=createdAt
sortOrder=desc
```

**Response:**
```json
{
  "data": [
    {
      "id": "...",
      "title": "Loksewa Aayog 2024",
      "category": "Civil Service",
      "description": "...",
      "examImageUrl": "...",
      "validityDays": 365,
      "status": "active",
      "totalCourses": 3,
      "courseDetails": [
        { "id": "...", "title": "...", "classCount": 50 }
      ]
    }
  ],
  "meta": { "page": 1, "limit": 10, "total": 25, "totalPages": 3, "hasNext": true }
}
```

---

#### GET /exams/{id}
Get full exam detail.

---

### 5.10 Payment APIs

#### POST /payments/initiate
Start payment process.

**Request:**
```json
{
  "paymentType": "course",
  "referenceId": "course_uuid",
  "promoCode": "PROMO10"
}
```

**Response:**
```json
{
  "esewaRedirectUrl": "https://esewa.com.np/epay/main?..."
}
```

---

#### POST /payments/verify
Verify payment after eSewa redirect.

**Request:**
```json
{
  "referenceId": "course_uuid",
  "paymentType": "course",
  "esewaTransactionId": "...",
  "status": "success"
}
```

---

### 5.11 App Info APIs

#### GET /app-info/about
Returns about us content (HTML or plain text).

#### GET /app-info/terms
Returns terms and conditions content.

#### GET /app-info/faqs
Returns FAQ list.

```json
[
  {
    "question": "How do I enroll?",
    "answer": "..."
  }
]
```

---

## 6. Data Models

### 6.1 UserModel

```typescript
interface UserModel {
  id: string;                           // UUID
  email: string;
  provider?: string;                    // "email" | "google" | "facebook"
  socialId?: string;
  fullName?: string;
  mobileNumber?: string;                // +977XXXXXXXXXX format
  hasConfirmedToTerms?: boolean;
  isVerified?: boolean;                 // Email verified
  photo?: {                             // Profile photo object
    url?: string;
    path?: string;
    photoUrl?: string;
    secure_url?: string;
  };
  role?: { id: string; name: string };
  status?: { id: string; name: string };
  favoriteCategories?: string[];        // Array of category IDs
  hasSelectedCategories?: boolean;      // KEY: first-time user flag
  savedCourses?: string[];              // Array of course IDs
  createdAt?: string;                   // ISO8601
  updatedAt?: string;
  deletedAt?: string | null;
}
```

**Key business logic field:** `hasSelectedCategories`
- `false` → user must complete category selection
- `true` → user goes directly to dashboard

---

### 6.2 CourseModel

```typescript
interface CourseModel {
  id: string;
  courseTitle: string;
  courseDescription?: string;
  categoryId?: string;
  categoryName?: string;
  courseImageUrl?: string;              // May be filename only → prepend imageBaseUrl
  courseIconUrl?: string;
  enrollmentCost?: number;             // Price in NPR (paisa? units)
  discountedPrice?: number;            // Reduced price
  hasOffer?: boolean;                  // Whether discount is active
  durationHours?: number;              // Total video hours
  validityDays?: number;               // Days access is valid after enrollment
  slug: string;                        // URL-friendly identifier
  isPublished: boolean;
  displayOrder?: number;
  tags?: string[];
  isSaved: boolean;                    // Current user's bookmark status
}
```

---

### 6.3 SubjectModel

```typescript
interface SubjectModel {
  id: string;
  courseId: string;
  subjectName: string;
  subjectDescription?: string;
  markWeight?: number;                 // Percentage weight in exams
  displayOrder?: number;
  isActive: boolean;
  chapters: ChapterModel[];
}

interface ChapterModel {
  id: string;
  chapterNumber: number;
  chapterTitle: string;
  chapterDescription?: string;
  displayOrder?: number;
}
```

---

### 6.4 LectureModel

```typescript
interface LectureModel {
  id: string;
  courseId: string;
  subjectId?: string;
  chapterId?: string;
  name: string;                        // Lecture title
  description?: string;
  thumbnailUrl?: string;
  coverImageUrl?: string;
  durationSeconds?: number;
  displayOrder?: number;
  isFree: boolean;                     // Preview without enrollment
  isActive: boolean;
  processingStatus?: string;           // "ready" | "processing" | "failed"
  viewCount?: number;
  lecturerIds: string[];
  lecturerName?: string;
  lecturerProfileImageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}
```

---

### 6.5 LecturerModel

```typescript
interface LecturerModel {
  id: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  profileImageUrl?: string;
  subjectIds: string[];
  courseIds: string[];
  subjects?: string;                   // Comma-separated subject names
}
```

---

### 6.6 CourseMaterialModel

```typescript
interface CourseMaterialModel {
  id: string;
  courseId: string;
  subjectId?: string;
  chapterId?: string;
  materialTitle: string;
  materialDescription?: string;
  materialType?: string;               // "pdf" | "doc" | "video" etc.
  downloadUrl?: string;                // Signed S3 URL
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;                   // Bytes
  fileExtension?: string;
  downloadCount?: number;
  displayOrder?: number;
  isActive: boolean;
  uploadedAt?: string;
  createdAt?: string;
}
```

---

### 6.7 EnrollmentModel

```typescript
interface EnrollmentModel {
  id: string;
  course: {
    id: string;
    courseTitle: string;
    courseImageUrl?: string;
  };
  progress: {
    completedLecturesCount: number;
    totalLectures: number;
    progressPercentage: number;        // 0.0 - 100.0
    lastAccessedAt?: string;
  };
  certificate: {
    issued: boolean;
    issuedAt?: string;
    certificateUrl?: string;
  };
  status?: string;                     // "active" | "completed" | "expired"
  enrolledAt?: string;
  completedAt?: string;
}
```

---

### 6.8 ExamSummary

```typescript
interface ExamSummary {
  id: string;
  title: string;
  category?: string;
  validityDays?: number;
  description?: string;
  examImageUrl?: string;
  status?: string;                     // "active" | "inactive"
  createdAt?: string;
  updatedAt?: string;
  courses: string[];                   // Course IDs
  courseDetails: ExamCourseInfo[];
  totalCourses?: number;
}

interface ExamCourseInfo {
  id: string;
  title: string;
  thumbnail?: string;
  classCount?: number;
  description?: string;
}
```

---

### 6.9 HomepageResponse

```typescript
interface HomepageResponse {
  userProfile?: {
    fullName?: string;
    photo?: string;                    // Resolved URL string
  };
  preferredCategories: Category[];
  recommendedExams: Exam[];
  recommendedCourses: Course[];
  bannerCourses: Course[];
  latestOngoingCourse?: LatestOngoingCourse;
  liveClasses: LiveClass[];
  upcomingExam?: UpcomingExam;
  topCategoryWithCourses?: TopCategoryWithCourses;
}

interface LatestOngoingCourse {
  id?: string;
  courseTitle?: string;
  courseImageUrl?: string;
  progressPercentage?: number;
  completedLectures?: number;
  totalLectures?: number;
  lastAccessedLectureId?: string;
  lastAccessedLectureTitle?: string;
  lastAccessedLectureThumbnail?: string;
  lastWatchedPositionSeconds?: number;
}

interface UpcomingExam {
  id?: string;
  title?: string;
  examImageUrl?: string;
  examDate?: string;                   // ISO8601
  daysUntilExam?: number;
}

interface LiveClass {
  id?: string;
  title?: string;
  scheduledAt?: string;               // ISO8601
  thumbnailUrl?: string;
}

interface TopCategoryWithCourses {
  categoryId?: string;
  categoryName?: string;
  categoryImageUrl?: string;
  courses: Course[];
}
```

---

### 6.10 Pagination (PagedMeta)

```typescript
interface PagedMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}
```

All paginated endpoints return:
```typescript
interface PagedResponse<T> {
  data: T[];
  meta: PagedMeta;
}
```

---

### 6.11 Error Response

```typescript
interface ApiError {
  message: string;
  statusCode?: number;
  errors?: Record<string, string[]>;  // Field-level validation errors
  throttleSeconds?: number;           // Rate limit wait time
}
```

---

## 7. UI Design System

### 7.1 Color Palette

```css
/* Primary Brand Colors */
--color-primary:        #1C3B5A;  /* Deep navy blue — main brand color */
--color-secondary:      #2A5D9F;  /* Medium blue */
--color-accent:         #3D7CC9;  /* Lighter highlight blue */

/* Text Colors */
--color-heading:        #1A324D;  /* Darkest text, close to primary */
--color-text:           #4A5B6E;  /* Body text — muted blue-grey */

/* Background Colors */
--color-scaffold-bg:    #F0F4F8;  /* App background */
--color-surface:        #FFFFFF;  /* Cards, modals */
--color-card:           #F5F8FA;  /* Subtle card variant */
--color-light-grey-bg:  #F8FAFC;  /* Secondary background */

/* Status Colors */
--color-success:        #2E7D32;  /* Green */
--color-failure:        #D32F2F;  /* Red */
--color-warning:        #F9A825;  /* Amber */
--color-info:           #2A5D9F;  /* Same as secondary */

/* Grayscale (blue-tinted) */
--color-gray-900:       #1A2632;
--color-gray-800:       #2D3B47;
--color-gray-700:       #3D4D5C;
--color-gray-600:       #556575;
--color-gray-500:       #7B8A99;
--color-gray-400:       #A3AEB9;
--color-gray-300:       #CFD6DE;
--color-gray-200:       #E2E8ED;
--color-gray-100:       #F0F4F8;

/* Borders and Dividers */
--color-border:         #D8E1E9;
--color-divider:        #E2E8ED;
--color-shadow:         rgba(28, 59, 90, 0.10);  /* Primary-based shadow */

/* Utility */
--color-white:          #FFFFFF;
--color-black:          #000000;
--color-quiz-bg:        rgba(222, 251, 255, 0.73);
```

**Gradients:**
```css
/* Button gradient */
background: linear-gradient(to right, #1C3B5A, #2A5D9F);

/* Primary gradient */
background: linear-gradient(135deg, #1C3B5A, #2A5D9F);

/* Background gradient */
background: linear-gradient(to bottom, #F8FAFC, #FFFFFF);
```

---

### 7.2 Typography

**Primary Font (Light Mode):** `Nunito Sans` (Google Fonts)  
**Dark Mode Font:** `Hanken Grotesk`

**Type Scale:**

| Token | Size | Weight | Color | Usage |
|---|---|---|---|---|
| `headlineLarge` | 24px | 700 | `#1A324D` | Page titles, course titles |
| `headlineMedium` | 20px | 600 | `#1A324D` | Section headings |
| `headlineSmall` | 18px | 600 | `#1A324D` | Sub-section headings |
| `titleLarge` | 16px | 600 | `#4A5B6E` | Card titles, important content |
| `titleMedium` | 14px | 500 | `#4A5B6E` | Lesson titles, card headings |
| `titleSmall` | 13px | 500 | `#4A5B6E` | Secondary information |
| `bodyLarge` | 16px | 600 | `#4A5B6E` | Main content text |
| `bodyMedium` | 14px | 600 | `#4A5B6E` | Regular content, descriptions |
| `bodySmall` | 12px | 600 | `#556575` | Captions, metadata |

---

### 7.3 Spacing System

Based on Flutter's `AppSpacing` constants:
```
xs:      4px
sm:      8px
md:      12px
average: 16px
lg:      24px
xl:      32px
xxl:     48px
```

Standard screen padding: `16px` horizontal.

---

### 7.4 Component Styles

#### Buttons

**Primary (ElevatedButton):**
```css
background: #1C3B5A;
color: #FFFFFF;
padding: 12px 24px;
border-radius: 8px;
font-size: 14px;
font-weight: 600;
```

**Outlined (OutlinedButton):**
```css
background: transparent;
color: #1C3B5A;
border: 1px solid #1C3B5A;
padding: 12px 24px;
border-radius: 8px;
font-size: 14px;
font-weight: 600;
```

**Full-width pattern:** Most CTAs are full-width buttons pinned to bottom of screen.

---

#### Cards

```css
background: #FFFFFF;
border-radius: 12px;
box-shadow: 0 2px 8px rgba(28, 59, 90, 0.10);
```

**Course card typical structure:**
```
┌─────────────────────────┐
│  [Course Image 16:9]    │
├─────────────────────────┤
│  Category Badge         │
│  Course Title (2 lines) │
│  Duration | Validity    │
│  ┌──────┐  ┌─────────┐  │
│  │ Free │  │ Rs 1999 │  │
│  └──────┘  └─────────┘  │
└─────────────────────────┘
```

---

#### Input Fields

```css
background: #FFFFFF;
border: 1px solid #D8E1E9;
border-radius: 8px;
padding: 12px 16px;
font-size: 14px;

/* Focus state */
border: 2px solid #1C3B5A;

/* Error state */
border: 1px solid #D32F2F;
```

---

#### Tab Bar

```css
/* Selected tab */
color: #1C3B5A;
/* Unselected tab */
color: #556575;
/* Indicator */
background: #1C3B5A;
/* Divider */
display: none; /* dividerColor: transparent */
```

---

#### App Bar

```css
background: #FFFFFF;
elevation: 0; /* no shadow */
title-color: #1A324D;
title-size: 20px;
title-weight: 600;
icon-color: #1A2632;
```

---

#### Bottom Navigation Bar

```css
background: #FFFFFF;
border-radius: 12px;
elevation: 10;
selected-color: #1C3B5A;
unselected-color: #3D4D5C;
type: fixed; /* all labels always visible */
```

---

### 7.5 Reusable UI Components

| Component | Description |
|---|---|
| `ReusableButton` | Full-width primary button with loading state |
| `CustomAppBar` | Standard top bar with back button and title |
| `CText` | Text widget with design-system type tokens |
| `CourseCard` | Course listing card with image, price, save button |
| `LiveClassCard` | Live class info card with schedule and join |
| `ExamCard` | Exam card with category and validity |
| `ProgressBar` | Course completion progress bar |
| `LoadingWidget` | Centered CircularProgressIndicator |
| `ErrorWidget` | Error message with retry button |
| `EmptyStateWidget` | Illustration + message for empty lists |
| `SearchBar` | Tappable or interactive search input |
| `CategoryChip` | Selectable category filter chip |

---

## 8. State Management Logic

### 8.1 Auth State

**Provider:** `authNotifierProvider` (StateNotifierProvider)  
**State:** `AuthState`

```dart
enum AuthStatus {
  initial,
  authenticated,
  unauthenticated,
  loading,
  error,
  passwordResetEmailSent,
  passwordResetOtpVerified,
  emailVerificationOtpSent,
  emailVerified,
}

class AuthState {
  AuthStatus status;
  UserModel? user;
  String? error;
  Map<String, List<String>>? fieldErrors;  // Per-field server errors
  int? statusCode;
  int? throttleSeconds;                    // Rate limit countdown
  bool hasCompletedStartupCheck;           // Controls SplashPage display
}
```

**Key methods:**
- `checkAuthenticationOnStartup()` — called once at app launch
- `login(email, password)` — POST /auth/email/login
- `register(RegisterRequest)` — POST /auth/email/register
- `logout()` — clears storage + resets ALL providers (via ProviderScope key change)
- `getMe()` — GET /auth/me, updates cached user
- `updateProfile(ProfileUpdateModel)` — PATCH /auth/me
- `uploadProfilePicture(File)` — POST /auth/me/upload-profile-picture

**Token storage (SecureStorageService keys):**
```
"token"              → JWT access token
"refreshToken"       → Refresh token
"tokenExpires"       → Unix timestamp string
"loginTimestamp"     → ISO8601 login time
"cached_user_profile" → JSON-serialized UserModel
```

**Token refresh strategy:**
1. **Proactive:** Timer fires 5 minutes before expiry, calls `/auth/refresh`
2. **Reactive:** Dio interceptor catches 401, calls `/auth/refresh`, retries original request
3. **Anti-loop:** Skips refresh if:
   - Request already marked as retry (`_isRetry` flag)
   - 401 received within 5 seconds of login (wrong credentials case)
   - Request doesn't require auth (login/register endpoints)

**Logout behavior:**
- Clears all secure storage keys
- Calls `POST /auth/logout` on server
- Fires `_onLogout` callback which calls `setState(() { _providerKey = UniqueKey(); })`
- This disposes **all** Riverpod providers, resetting app state completely

---

### 8.2 Navigation State

**Provider:** `navigationProvider` (StateNotifierProvider)  
**State:** `NavigationState { int selectedIndex }`

```dart
// Switch tab
ref.read(navigationProvider.notifier).navigate(2); // Go to Courses tab
```

Uses `IndexedStack` — all 5 tab pages are mounted and alive simultaneously.

---

### 8.3 Homepage State

**Provider:** `homepageViewModelProvider` (StateNotifierProvider)  
**State:** `HomepageState`

```dart
class HomepageState {
  bool isLoading;
  String? error;
  HomepageResponse? data;
}
```

**Methods:**
- `fetchHomepage()` — GET /homepage
- Supports pull-to-refresh

---

### 8.4 Courses State

**Provider:** `coursesViewModelProvider` (StateNotifierProvider)

Manages:
- `publicCourses` — paginated list for Explore
- `savedCourses` — bookmarked courses
- `enrolledCourses` — user's enrollments
- `courseDetails` — cached course detail views
- `subjects` — course subjects map
- `liveClasses` — user's live class schedule
- `mockTests` — test list by course

**Pagination pattern:**
```dart
// Load more on scroll
if (meta.hasNext) fetchMoreCourses(page: meta.page + 1);
```

---

### 8.5 Favorite Category State

**Provider:** `favoriteCategoryNotifierProvider` (StateNotifierProvider)  
**State:** `FavoriteCategoryState`

```dart
class FavoriteCategoryState {
  bool isLoading;
  bool isUpdating;
  bool isUpdateSuccessful;
  String? error;
  List<CategoryHierarchyItem> categoryHierarchy;
  List<String> selectedCategoryIds;
}
```

**Methods:**
- `loadCategories()` — GET /categories/hierarchy
- `toggleCategory(categoryId)` — toggle selection in local state
- `updateFavoriteCategories()` — POST /user-preferences/favorite-categories

**Lifecycle:** After `isUpdateSuccessful == true`, the page navigates to Dashboard and calls `getMe()` to refresh user with updated `hasSelectedCategories: true`.

---

### 8.6 Exam State

**Provider:** `examListViewModelProvider` (StateNotifierProvider)

```dart
class ExamListState {
  bool isLoading;
  bool isLoadingMore;
  String? error;
  List<ExamSummary> exams;
  ExamListMeta? meta;
  String? searchQuery;
  String? statusFilter;
  String? categoryFilter;
  String sortBy;
  String sortOrder;
}
```

Supports:
- Search with debounce
- Status filter
- Category filter
- Sort by field/order
- Infinite scroll pagination

---

### 8.7 Connectivity State

**Provider:** `connectivityProvider`

Monitors internet connection. If offline, shows a `NoInternetPage` overlay.

---

## 9. Web Implementation Guide

### 9.1 Technology Mapping

| Mobile Concept | Web (Next.js) Equivalent |
|---|---|
| Riverpod StateNotifier | Zustand store / React Context + useReducer |
| Secure Storage (tokens) | `httpOnly` cookies OR `localStorage` (cookies preferred for security) |
| Hive (cache) | `localStorage` / `sessionStorage` / SWR cache |
| Go Router / Navigator | Next.js App Router (file-based routing) |
| IndexedStack (tabs) | Next.js layout with persistent tab state |
| Dio interceptors | Axios interceptors / fetch middleware |
| Firebase Messaging | Web Push API + Firebase JS SDK |
| Zoom SDK | Zoom Web SDK or ZoomMtg.js |
| eSewa | eSewa payment web form integration |

---

### 9.2 Recommended Project Structure

```
src/
├── app/                              # Next.js App Router
│   ├── (auth)/                       # Auth route group (no layout)
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── verify-email/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx
│   │
│   ├── (onboarding)/                 # First-time user flow
│   │   └── select-categories/page.tsx
│   │
│   ├── (dashboard)/                  # Authenticated main layout
│   │   ├── layout.tsx                # ← Bottom nav / sidebar
│   │   ├── page.tsx                  # ← /  → redirect to /home
│   │   ├── home/page.tsx
│   │   ├── explore/page.tsx
│   │   ├── courses/
│   │   │   ├── page.tsx              # My Courses + Ongoing Classes
│   │   │   └── [courseId]/page.tsx   # Course detail
│   │   ├── test/
│   │   │   ├── page.tsx
│   │   │   └── [sessionId]/page.tsx  # Active quiz
│   │   ├── exams/
│   │   │   ├── page.tsx
│   │   │   └── [examId]/page.tsx
│   │   └── profile/
│   │       ├── page.tsx
│   │       ├── edit/page.tsx
│   │       └── categories/page.tsx
│   │
│   └── api/                          # Next.js API routes (proxy if needed)
│       └── auth/[...nextauth]/route.ts
│
├── lib/
│   ├── api/                          # API client layer
│   │   ├── client.ts                 # Axios/fetch config with interceptors
│   │   ├── auth.ts                   # Auth endpoints
│   │   ├── courses.ts                # Course endpoints
│   │   ├── enrollments.ts
│   │   ├── exams.ts
│   │   ├── homepage.ts
│   │   ├── payments.ts
│   │   └── test-sessions.ts
│   │
│   ├── stores/                       # Zustand stores
│   │   ├── auth.store.ts
│   │   ├── navigation.store.ts
│   │   └── categories.store.ts
│   │
│   ├── hooks/                        # React Query / SWR hooks
│   │   ├── useHomepage.ts
│   │   ├── useCourses.ts
│   │   ├── useEnrollments.ts
│   │   └── useExams.ts
│   │
│   └── types/                        # TypeScript interfaces (from Data Models)
│       ├── auth.types.ts
│       ├── course.types.ts
│       ├── exam.types.ts
│       └── api.types.ts
│
├── components/
│   ├── ui/                           # Design system primitives
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   └── Badge.tsx
│   ├── course/
│   │   ├── CourseCard.tsx
│   │   └── CourseGrid.tsx
│   ├── exam/
│   │   └── ExamCard.tsx
│   └── layout/
│       ├── BottomNav.tsx             # Mobile bottom nav
│       ├── Sidebar.tsx               # Desktop sidebar
│       └── DashboardLayout.tsx
│
└── middleware.ts                     # Auth protection
```

---

### 9.3 Authentication Implementation

#### Token Storage Strategy (Recommended)
Use `httpOnly` cookies for security:

```typescript
// On login success, set cookies via API route
// lib/api/auth.ts
export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/email/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  
  // Store in memory for current session
  // OR use httpOnly cookie via Next.js API route
  return data; // { token, refreshToken, tokenExpires, user }
}
```

#### API Client with Token Refresh

```typescript
// lib/api/client.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://scholargyan.onecloudlab.com/api/v1/',
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach token
api.interceptors.request.use((config) => {
  const token = getStoredToken(); // from store/cookie
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: handle 401 + token refresh
let isRefreshing = false;
let failedQueue: any[] = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }
      
      isRefreshing = true;
      
      try {
        const refreshToken = getStoredRefreshToken();
        const { data } = await axios.post(
          `https://scholargyan.onecloudlab.com/api/v1/auth/refresh`,
          { refreshToken }
        );
        
        storeToken(data.token, data.refreshToken, data.tokenExpires);
        processQueue(null, data.token);
        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        return api(originalRequest);
        
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuth(); // logout
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
```

---

### 9.4 Protected Routes (Next.js Middleware)

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPaths = ['/login', '/register', '/verify-email', '/forgot-password', '/reset-password'];
const onboardingPath = '/select-categories';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const hasSelectedCategories = request.cookies.get('hasSelectedCategories')?.value;
  const pathname = request.nextUrl.pathname;

  const isPublicPath = publicPaths.some(p => pathname.startsWith(p));

  // Not logged in → redirect to login
  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Logged in but on public path → redirect to home
  if (token && isPublicPath) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // First-time user → redirect to category selection
  if (token && hasSelectedCategories === 'false' && pathname !== onboardingPath) {
    return NextResponse.redirect(new URL(onboardingPath, request.url));
  }

  // Already selected categories, trying to access onboarding → redirect
  if (token && hasSelectedCategories === 'true' && pathname === onboardingPath) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

---

### 9.5 Auth Store (Zustand)

```typescript
// lib/stores/auth.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthStore {
  user: UserModel | null;
  token: string | null;
  refreshToken: string | null;
  tokenExpires: number | null;
  isAuthenticated: boolean;
  
  setAuth: (data: AuthResponseModel) => void;
  clearAuth: () => void;
  updateUser: (user: Partial<UserModel>) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      tokenExpires: null,
      isAuthenticated: false,
      
      setAuth: (data) => set({
        user: data.user,
        token: data.token,
        refreshToken: data.refreshToken,
        tokenExpires: data.tokenExpires,
        isAuthenticated: true,
      }),
      
      clearAuth: () => set({
        user: null,
        token: null,
        refreshToken: null,
        tokenExpires: null,
        isAuthenticated: false,
      }),
      
      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null,
      })),
    }),
    { name: 'auth-storage' }
  )
);
```

---

### 9.6 First-Time Category Selection Logic

```typescript
// app/(dashboard)/layout.tsx
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/api/auth';

export default async function DashboardLayout({ children }) {
  const user = await getCurrentUser(); // server-side fetch
  
  if (!user) {
    redirect('/login');
  }
  
  if (!user.hasSelectedCategories) {
    redirect('/select-categories');
  }
  
  return (
    <div>
      <main>{children}</main>
      <BottomNav />
    </div>
  );
}
```

```typescript
// app/(onboarding)/select-categories/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCategoryHierarchy, updateFavoriteCategories } from '@/lib/api/categories';
import { useAuthStore } from '@/lib/stores/auth.store';

export default function SelectCategoriesPage() {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { user, updateUser } = useAuthStore();
  
  const handleSubmit = async () => {
    await updateFavoriteCategories(selectedIds);
    // Refresh user profile
    const updatedUser = await getCurrentUser();
    updateUser(updatedUser);
    router.replace('/home');
  };
  
  return (
    <div>
      <h1>Namaste {user?.fullName}</h1>
      <p>Please select the courses you are interested in</p>
      {/* Category accordion list */}
      <button onClick={handleSubmit}>Next</button>
    </div>
  );
}
```

---

### 9.7 Image URL Resolution

Many API responses return only a filename for image fields. Apply this logic everywhere:

```typescript
// lib/utils/image.ts
const IMAGE_BASE_URL = 'https://olp-uploads.s3.us-east-1.amazonaws.com/';

export function resolveImageUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${IMAGE_BASE_URL}${url}`;
}
```

---

### 9.8 Dashboard/Homepage Data Fetching

```typescript
// app/(dashboard)/home/page.tsx
import { getHomepageData } from '@/lib/api/homepage';

export default async function HomePage() {
  const data = await getHomepageData(); // SSR
  
  return (
    <div>
      <Header user={data.userProfile} />
      <SearchBar />
      <BannerSlider courses={data.bannerCourses} />
      <RecommendedCourses courses={data.recommendedCourses} />
      {data.latestOngoingCourse && (
        <ContinueLearning course={data.latestOngoingCourse} />
      )}
      <UpcomingClasses classes={data.liveClasses} />
      {data.upcomingExam && (
        <UpcomingExamCountdown exam={data.upcomingExam} />
      )}
      <PreferredCategories categories={data.preferredCategories} />
      {data.topCategoryWithCourses && (
        <GrabDeals category={data.topCategoryWithCourses} />
      )}
    </div>
  );
}
```

---

### 9.9 Pagination Hook Pattern

```typescript
// lib/hooks/usePaginatedCourses.ts
import { useState, useCallback } from 'react';
import { getCourses } from '@/lib/api/courses';

export function usePaginatedCourses(filters: CourseFilters) {
  const [courses, setCourses] = useState<CourseModel[]>([]);
  const [meta, setMeta] = useState<PagedMeta | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const loadPage = useCallback(async (page: number, append = false) => {
    if (page === 1) setIsLoading(true);
    else setIsLoadingMore(true);
    
    try {
      const res = await getCourses({ ...filters, page, limit: 10 });
      if (append) {
        setCourses(prev => [...prev, ...res.data]);
      } else {
        setCourses(res.data);
      }
      setMeta(res.meta);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [filters]);

  const loadMore = () => {
    if (meta?.hasNext) loadPage((meta.page ?? 1) + 1, true);
  };

  return { courses, meta, isLoading, isLoadingMore, loadPage, loadMore };
}
```

---

### 9.10 CSS Variables for Design System

```css
/* globals.css */
:root {
  --primary: #1C3B5A;
  --secondary: #2A5D9F;
  --accent: #3D7CC9;
  
  --heading: #1A324D;
  --text: #4A5B6E;
  
  --scaffold-bg: #F0F4F8;
  --surface: #FFFFFF;
  --card: #F5F8FA;
  --border: #D8E1E9;
  
  --success: #2E7D32;
  --error: #D32F2F;
  --warning: #F9A825;
  
  --gray-900: #1A2632;
  --gray-700: #3D4D5C;
  --gray-600: #556575;
  --gray-400: #A3AEB9;
  --gray-200: #E2E8ED;
  --gray-100: #F0F4F8;
  
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  
  --shadow: 0 2px 8px rgba(28, 59, 90, 0.10);
  --shadow-lg: 0 8px 24px rgba(28, 59, 90, 0.15);
  
  --font-sans: 'Nunito Sans', sans-serif;
}
```

---

### 9.11 Page Route Mapping (Mobile → Web)

| Mobile Screen | Web Route | Notes |
|---|---|---|
| SplashPage | Root layout (server) | Server checks auth in layout |
| LoginScreen | `/login` | Public route |
| RegistrationPage | `/register` | Public route |
| EmailVerificationPage | `/verify-email` | Pass email in state/query |
| ForgotPasswordPage | `/forgot-password` | Public route |
| ResetPasswordPage | `/reset-password` | Requires OTP token |
| CourseSelection | `/select-categories` | Protected, first-time only |
| Dashboard > Home | `/home` | Default dashboard page |
| Dashboard > Explore | `/explore` | Course browser |
| Dashboard > Courses | `/courses` | My enrolled courses |
| Dashboard > Test | `/test` | Mock test center |
| Dashboard > Profile | `/profile` | User settings |
| Course Detail | `/courses/[id]` | Dynamic route |
| Video Player | `/courses/[id]/lectures/[lectureId]` | Protected, enrolled only |
| Live Class | `/courses/[id]/live/[classId]` | Protected |
| Exam List | `/exams` | Protected |
| Exam Detail | `/exams/[id]` | Protected |
| Quiz/Test Session | `/test/session/[sessionId]` | Protected, active session |
| Edit Profile | `/profile/edit` | Protected |
| Change Password | `/profile/change-password` | Protected |
| Preferred Categories | `/profile/categories` | Protected |
| Saved Courses | `/profile/saved-courses` | Protected |
| About | `/about` | Public |
| Terms | `/terms` | Public |
| FAQs | `/faqs` | Public |
| Search | `/search?q=...` | Protected, query param |

---

### 9.12 Key Business Rules to Implement

1. **Image resolution:** Always prepend `https://olp-uploads.s3.us-east-1.amazonaws.com/` to image paths that are filenames (don't start with `http`).

2. **First-time user:** After login, check `user.hasSelectedCategories`. If `false`, redirect to `/select-categories` before showing any dashboard page.

3. **Token refresh:** Implement interceptor that handles 401s. The refresh token is long-lived. If refresh fails → logout completely.

4. **Provider reset on logout:** When user logs out, clear all cached state (not just auth). In React, this means clearing all stores and query caches.

5. **Price display:** Show `discountedPrice` when `hasOffer === true`, with `enrollmentCost` shown as strikethrough. Format as "Rs X,XXX" (Nepali Rupees).

6. **Free course enrollment:** If `enrollmentCost === 0` or `enrollmentCost === null`, show "Enroll Free" button → `POST /enrollments/free-course`.

7. **Lecture access:** Free lectures (`isFree === true`) are accessible without enrollment. Paid lectures require enrollment check.

8. **Progress tracking:** When user finishes watching a lecture (or passes a threshold), call `POST /enrollments/progress/complete-lecture`.

9. **Live class status:** Derive status from `scheduledAt` + `durationMinutes`:
   - `scheduledAt > now` → "Upcoming"
   - `scheduledAt <= now <= scheduledAt + duration` → "Live"
   - Past both → "Completed"

10. **Test attempts:** Show attempt history from `lastAttempt` in mock test. Show "Retake" instead of "Start" if `attempted === true`.

11. **Rate limiting:** When API returns `throttleSeconds`, show countdown timer before allowing retry.

12. **Offline graceful degradation:** Use stale-while-revalidate for homepage data. Show cached data while fetching fresh.

---

*This documentation covers the complete OLP student app architecture and is intended to be used as the specification for building the Next.js web version.*
