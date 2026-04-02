export type CourseLevel = "beginner" | "intermediate" | "advanced";
export type CourseStatus = "draft" | "published" | "archived";

export interface CourseInstructor {
  id: string;
  name: string;
  avatar?: string;
  title?: string;
}

export interface LectureItem {
  id: string;
  title: string;
  duration: number; // seconds
  type: "video" | "pdf" | "quiz";
  isPreview: boolean;
  isCompleted?: boolean;
  order?: number;
}

export interface CourseSection {
  id: string;
  title: string;
  order?: number;
  lectures: LectureItem[];
}

export interface Course {
  id: string;
  slug?: string;
  title: string;
  description: string;
  thumbnail: string;
  previewVideo?: string;
  instructor: CourseInstructor;
  level: CourseLevel;
  category: string;
  categoryId?: string;
  tags: string[];
  price: number;
  discountPrice?: number;
  rating: number;
  reviewCount: number;
  studentCount: number;
  totalDuration: number; // seconds
  totalLectures: number;
  sections: CourseSection[];
  isEnrolled?: boolean;
  isSaved?: boolean;
  progress?: number; // 0-100
  status: CourseStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CourseQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  categoryId?: string;
  level?: CourseLevel;
  status?: CourseStatus;
  minRating?: number;
  maxPrice?: number;
  sortBy?: "rating" | "newest" | "popular" | "price";
}

export interface CreateCoursePayload {
  title: string;
  description: string;
  categoryId: string;
  level: CourseLevel;
  price: number;
  discountPrice?: number;
  tags?: string[];
}

export interface UpdateCoursePayload extends Partial<CreateCoursePayload> {
  status?: CourseStatus;
}

export interface CourseModel {
  id: string;
  courseTitle: string;
  courseDescription?: string;
  categoryId?: string;
  categoryName?: string;
  courseImageUrl?: string;
  enrollmentCost?: number;
  discountedPrice?: number;
  hasOffer?: boolean;
  durationHours?: number;
  validityDays?: number;
  slug: string;
  isPublished: boolean;
  isSaved?: boolean;
  tags?: string[];
}

export interface ChapterModel {
  id: string;
  chapterNumber: number;
  chapterTitle: string;
  chapterDescription?: string;
  displayOrder?: number;
}

export interface SubjectModel {
  id: string;
  courseId: string;
  // API returns subjectName (not subjectTitle)
  subjectName?: string;
  subjectTitle?: string; // legacy alias
  subjectDescription?: string;
  markWeight?: number;
  displayOrder?: number;
  isActive?: boolean;
  chapters?: ChapterModel[];
}

export interface LectureModel {
  id: string;
  courseId: string;
  subjectId?: string;
  chapterId?: string;
  // API returns name (not lectureTitle)
  name?: string;
  lectureTitle?: string; // legacy alias
  description?: string;
  thumbnailUrl?: string;
  coverImageUrl?: string;
  durationSeconds?: number;
  duration?: number; // legacy alias (minutes)
  displayOrder?: number;
  isFree: boolean;
  isActive?: boolean;
  processingStatus?: string;
  viewCount?: number;
  lecturerName?: string;
  lecturerProfileImageUrl?: string;
  isCompleted?: boolean;
}

export interface LecturerModel {
  id: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  // API returns profileImageUrl (not photo)
  profileImageUrl?: string;
  photo?: { path?: string; url?: string }; // legacy
  subjectIds?: string[];
  courseIds?: string[];
  subjects?: string; // comma-separated subject names
}

export interface CourseMaterialModel {
  id: string;
  courseId: string;
  subjectId?: string;
  // API returns materialTitle (not title)
  materialTitle?: string;
  title?: string; // legacy alias
  materialDescription?: string;
  materialType?: string;
  downloadUrl?: string;
  fileUrl?: string;
  fileKey?: string;
  fileName?: string;
  fileSize?: number;
  fileExtension?: string;
  downloadCount?: number;
  displayOrder?: number;
  isActive?: boolean;
}

export interface MockTestModel {
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
  durationText?: string;
  cost?: number;
  attemptsAllowed?: number;
  status?: string;
  subjectDistribution?: Array<{ subjectId: string; numberOfQuestions: number }>;
}

export interface EnrollmentProgress {
  completedLecturesCount: number;
  totalLectures: number;
  progressPercentage: number;
  lastAccessedAt?: string;
  lastAccessedLectureId?: string;
}

export interface EnrollmentModel {
  id: string;
  courseId?: string;
  studentId?: string;
  course?: {
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
    stats?: { totalLectures?: number; totalMaterials?: number; totalLecturers?: number };
  };
  progress?: EnrollmentProgress;
  certificate?: { issued: boolean; issuedAt?: string; certificateUrl?: string; certificateNumber?: string };
  status?: string;
  enrollmentDate?: string;
  enrolledAt?: string; // legacy
  expiryDate?: string;
  paymentId?: string;
}

export interface CourseDetailsResponse {
  id: string;
  courseTitle: string;
  courseDescription?: string;
  courseImageUrl?: string;
  courseIconUrl?: string;
  enrollmentCost?: number;
  discountedPrice?: number;
  hasOffer?: boolean | string | number;
  durationHours?: number;
  validityDays?: number;
  isEnrolled?: boolean;
  enrollmentDetails?: {
    status?: string;
    enrollmentDate?: string;
    expiryDate?: string;
    progress?: EnrollmentProgress;
    certificate?: { issued: boolean; issuedAt?: string; certificateUrl?: string };
  };
  stats?: {
    totalLectures?: number;
    totalMaterials?: number;
    totalLecturers?: number;
    totalStudents?: number;
  };
  tags?: string[];
}

export interface CourseEnrollmentDetail {
  enrollment: EnrollmentModel;
  course: CourseModel;
  subjects: SubjectModel[];
}
