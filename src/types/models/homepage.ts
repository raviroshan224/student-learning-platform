export interface BannerItem {
  id: string;
  courseId?: string;
  imageUrl?: string;
  title?: string;
  description?: string;
}

export interface LiveClassModel {
  id: string;
  title: string;
  courseId?: string;
  scheduledAt: string; // ISO string
  durationMinutes: number;
  instructorName?: string;
  meetingUrl?: string;
  thumbnailUrl?: string;
}

export interface HomepageData {
  banners?: BannerItem[];
  recommendedCourses?: import('./course').CourseModel[];
  latestOngoingCourse?: {
    courseId: string;
    courseTitle: string;
    courseImageUrl?: string;
    progress: number;
    lastLectureId?: string;
    lastLectureTitle?: string;
  };
  upcomingClasses?: LiveClassModel[];
  liveClasses?: LiveClassModel[];
  upcomingExam?: {
    id: string;
    title: string;
    examDate: string;
    categoryName?: string;
  };
  preferredCategories?: import('./category').CategoryModel[];
  dealCourses?: import('./course').CourseModel[];
}
