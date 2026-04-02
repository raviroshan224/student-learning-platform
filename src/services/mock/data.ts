import type { User } from "@/types/models/user";
import type { Course } from "@/types/models/course";

// ─── Demo Credentials ─────────────────────────────────────────────────────────
export const DEMO_EMAIL = "demo@student.com";
export const DEMO_PASSWORD = "password123";

// ─── Mock User ────────────────────────────────────────────────────────────────
export const MOCK_USER: User = {
  id: "u1",
  fullName: "Demo Student",
  name: "Demo Student",
  email: "demo@student.com",
  avatar: "",
  mobileNumber: "+977-9800000000",
  phone: "+977-9800000000",
  bio: "Grade 12 Science student passionate about learning.",
  role: "student",
  enrolledCourses: ["bio12", "cs12"],
  createdAt: "2026-01-01T00:00:00Z",
};

// ─── Mock Courses ─────────────────────────────────────────────────────────────
export const MOCK_COURSES: Course[] = [
  {
    id: "bio12",
    title: "Biology (Grade 12)",
    description:
      "Step into the world of life sciences! Explore cell biology, genetics, ecology, and human physiology with expert-guided content tailored for Grade 12 students.",
    thumbnail: "",
    instructor: { id: "t1", name: "Dr. Anita Sharma", title: "Senior Biology Educator" },
    level: "intermediate",
    category: "Grade 12 Science",
    tags: ["Biology", "Grade 12", "Science", "NEB"],
    price: 0,
    rating: 4.8,
    reviewCount: 312,
    studentCount: 1840,
    totalDuration: 54000,
    totalLectures: 72,
    sections: [
      {
        id: "s1",
        title: "Cell Biology",
        lectures: [
          { id: "l1", title: "Introduction to Cell Theory", duration: 900, type: "video", isPreview: true, isCompleted: true },
          { id: "l2", title: "Cell Organelles", duration: 1200, type: "video", isPreview: true, isCompleted: true },
          { id: "l3", title: "Cell Division – Mitosis", duration: 1500, type: "video", isPreview: false, isCompleted: false },
          { id: "l4", title: "Cell Division – Meiosis", duration: 1350, type: "video", isPreview: false, isCompleted: false },
        ],
      },
      {
        id: "s2",
        title: "Genetics & Heredity",
        lectures: [
          { id: "l5", title: "Mendelian Genetics", duration: 1200, type: "video", isPreview: false, isCompleted: false },
          { id: "l6", title: "DNA Structure & Replication", duration: 1500, type: "video", isPreview: false, isCompleted: false },
          { id: "l7", title: "Genetics Quiz", duration: 600, type: "quiz", isPreview: false, isCompleted: false },
        ],
      },
      {
        id: "s3",
        title: "Ecology",
        lectures: [
          { id: "l8", title: "Ecosystems & Food Chains", duration: 1100, type: "video", isPreview: false, isCompleted: false },
          { id: "l9", title: "Biodiversity & Conservation", duration: 950, type: "video", isPreview: false, isCompleted: false },
        ],
      },
    ],
    isEnrolled: true,
    progress: 28,
    status: "published",
    createdAt: "2026-01-15T00:00:00Z",
    updatedAt: "2026-03-15T00:00:00Z",
  },
  {
    id: "cs12",
    title: "Computer Science (Grade 12)",
    description:
      "Step into the digital future! Learn programming, algorithms, and technology applications to solve problems and create innovative solutions.",
    thumbnail: "",
    instructor: { id: "t2", name: "Er. Rajesh Thapa", title: "Software Engineer & Educator" },
    level: "intermediate",
    category: "Grade 12 Science",
    tags: ["Computer Science", "Grade 12", "Programming", "NEB"],
    price: 0,
    rating: 4.9,
    reviewCount: 428,
    studentCount: 2100,
    totalDuration: 79200,
    totalLectures: 105,
    sections: [
      {
        id: "s1",
        title: "Database Management System (DBMS)",
        lectures: [
          { id: "l1", title: "Introduction to DBMS", duration: 900, type: "video", isPreview: true, isCompleted: true },
          { id: "l2", title: "ER Diagrams", duration: 1200, type: "video", isPreview: false, isCompleted: true },
          { id: "l3", title: "SQL Basics", duration: 1800, type: "video", isPreview: false, isCompleted: false },
          { id: "l4", title: "Normalization", duration: 1500, type: "video", isPreview: false, isCompleted: false },
        ],
      },
      {
        id: "s2",
        title: "Data Communication & Networking",
        lectures: [
          { id: "l5", title: "Network Fundamentals", duration: 1200, type: "video", isPreview: false, isCompleted: false },
          { id: "l6", title: "OSI & TCP/IP Models", duration: 1500, type: "video", isPreview: false, isCompleted: false },
          { id: "l7", title: "Network Devices", duration: 900, type: "video", isPreview: false, isCompleted: false },
        ],
      },
      {
        id: "s3",
        title: "Web Technology II",
        lectures: [
          { id: "l8", title: "HTML5 & CSS3", duration: 1800, type: "video", isPreview: false, isCompleted: false },
          { id: "l9", title: "JavaScript Basics", duration: 2100, type: "video", isPreview: false, isCompleted: false },
        ],
      },
      {
        id: "s4",
        title: "Programming in C",
        lectures: [
          { id: "l10", title: "Introduction to C", duration: 1200, type: "video", isPreview: false, isCompleted: false },
          { id: "l11", title: "Functions & Arrays", duration: 1500, type: "video", isPreview: false, isCompleted: false },
          { id: "l12", title: "Pointers", duration: 1800, type: "video", isPreview: false, isCompleted: false },
        ],
      },
    ],
    isEnrolled: true,
    progress: 15,
    status: "published",
    createdAt: "2026-01-10T00:00:00Z",
    updatedAt: "2026-03-20T00:00:00Z",
  },
  {
    id: "math12s",
    title: "Mathematics (Grade 12 Science)",
    description:
      "Master advanced mathematics including calculus, vectors, and statistics designed for Grade 12 Science students.",
    thumbnail: "",
    instructor: { id: "t3", name: "Prof. Binod Adhikari", title: "Mathematics Expert" },
    level: "advanced",
    category: "Grade 12 Science",
    tags: ["Mathematics", "Grade 12", "Science", "Calculus"],
    price: 0,
    rating: 4.7,
    reviewCount: 289,
    studentCount: 1650,
    totalDuration: 64800,
    totalLectures: 88,
    sections: [
      {
        id: "s1",
        title: "Calculus",
        lectures: [
          { id: "l1", title: "Limits & Continuity", duration: 1500, type: "video", isPreview: true, isCompleted: false },
          { id: "l2", title: "Derivatives", duration: 1800, type: "video", isPreview: false, isCompleted: false },
          { id: "l3", title: "Integration", duration: 2100, type: "video", isPreview: false, isCompleted: false },
        ],
      },
    ],
    isEnrolled: false,
    progress: 0,
    status: "published",
    createdAt: "2026-01-20T00:00:00Z",
    updatedAt: "2026-03-10T00:00:00Z",
  },
  {
    id: "phy12",
    title: "Physics (Grade 12)",
    description:
      "Explore mechanics, thermodynamics, optics, and modern physics with conceptual clarity and problem-solving practice.",
    thumbnail: "",
    instructor: { id: "t4", name: "Dr. Sushil Poudel", title: "Physics Lecturer" },
    level: "advanced",
    category: "Grade 12 Science",
    tags: ["Physics", "Grade 12", "Science"],
    price: 0,
    rating: 4.6,
    reviewCount: 201,
    studentCount: 1380,
    totalDuration: 72000,
    totalLectures: 95,
    sections: [
      {
        id: "s1",
        title: "Mechanics",
        lectures: [
          { id: "l1", title: "Newton's Laws", duration: 1200, type: "video", isPreview: true, isCompleted: false },
          { id: "l2", title: "Work, Energy & Power", duration: 1500, type: "video", isPreview: false, isCompleted: false },
        ],
      },
    ],
    isEnrolled: false,
    progress: 0,
    status: "published",
    createdAt: "2026-02-01T00:00:00Z",
    updatedAt: "2026-03-05T00:00:00Z",
  },
  {
    id: "chem12",
    title: "Chemistry (Grade 12)",
    description:
      "From organic chemistry to electrochemistry, master all key topics required for Grade 12 NEB examination.",
    thumbnail: "",
    instructor: { id: "t5", name: "Dr. Meena Basnet", title: "Chemistry Educator" },
    level: "intermediate",
    category: "Grade 12 Science",
    tags: ["Chemistry", "Grade 12", "Science"],
    price: 0,
    rating: 4.7,
    reviewCount: 176,
    studentCount: 1120,
    totalDuration: 61200,
    totalLectures: 82,
    sections: [
      {
        id: "s1",
        title: "Organic Chemistry",
        lectures: [
          { id: "l1", title: "Introduction to Organic Compounds", duration: 1200, type: "video", isPreview: true, isCompleted: false },
        ],
      },
    ],
    isEnrolled: false,
    progress: 0,
    status: "published",
    createdAt: "2026-02-10T00:00:00Z",
    updatedAt: "2026-03-12T00:00:00Z",
  },
  {
    id: "acc12",
    title: "Accountancy (Grade 12 Management)",
    description:
      "Learn the principles of accounting, financial statements, and cost accounting tailored for Grade 12 Management students.",
    thumbnail: "",
    instructor: { id: "t6", name: "CA Deepak Joshi", title: "Chartered Accountant & Educator" },
    level: "intermediate",
    category: "Grade 12 Management",
    tags: ["Accountancy", "Grade 12", "Management"],
    price: 0,
    rating: 4.8,
    reviewCount: 245,
    studentCount: 1560,
    totalDuration: 57600,
    totalLectures: 76,
    sections: [
      {
        id: "s1",
        title: "Financial Statements",
        lectures: [
          { id: "l1", title: "Income Statement", duration: 1200, type: "video", isPreview: true, isCompleted: false },
          { id: "l2", title: "Balance Sheet", duration: 1500, type: "video", isPreview: false, isCompleted: false },
        ],
      },
    ],
    isEnrolled: false,
    progress: 0,
    status: "published",
    createdAt: "2026-01-25T00:00:00Z",
    updatedAt: "2026-03-18T00:00:00Z",
  },
  {
    id: "econ12",
    title: "Economics (Grade 12 Management)",
    description:
      "Understand micro and macroeconomics, market structures, and Nepal's economic policies.",
    thumbnail: "",
    instructor: { id: "t7", name: "Prof. Kiran Koirala", title: "Economics Expert" },
    level: "intermediate",
    category: "Grade 12 Management",
    tags: ["Economics", "Grade 12", "Management"],
    price: 0,
    rating: 4.5,
    reviewCount: 189,
    studentCount: 1230,
    totalDuration: 50400,
    totalLectures: 67,
    sections: [
      {
        id: "s1",
        title: "Introduction to Economics",
        lectures: [
          { id: "l1", title: "Demand & Supply", duration: 1200, type: "video", isPreview: true, isCompleted: false },
        ],
      },
    ],
    isEnrolled: false,
    progress: 0,
    status: "published",
    createdAt: "2026-02-05T00:00:00Z",
    updatedAt: "2026-03-08T00:00:00Z",
  },
  {
    id: "law12",
    title: "Constitutional Law (Grade 12 Law)",
    description:
      "Explore the Nepali Constitution, fundamental rights, and the judicial system in depth.",
    thumbnail: "",
    instructor: { id: "t8", name: "Adv. Sunita Rai", title: "Legal Expert & Educator" },
    level: "intermediate",
    category: "Grade 12 Law",
    tags: ["Law", "Grade 12", "Constitutional Law"],
    price: 0,
    rating: 4.6,
    reviewCount: 134,
    studentCount: 890,
    totalDuration: 46800,
    totalLectures: 62,
    sections: [
      {
        id: "s1",
        title: "Nepal Constitution",
        lectures: [
          { id: "l1", title: "Preamble & Fundamental Rights", duration: 1200, type: "video", isPreview: true, isCompleted: false },
        ],
      },
    ],
    isEnrolled: false,
    progress: 0,
    status: "published",
    createdAt: "2026-02-15T00:00:00Z",
    updatedAt: "2026-03-14T00:00:00Z",
  },
  {
    id: "bio11",
    title: "Biology (Grade 11)",
    description:
      "Foundation-level Biology covering cell biology, plant physiology, and introductory genetics for Grade 11 students.",
    thumbnail: "",
    instructor: { id: "t1", name: "Dr. Anita Sharma", title: "Senior Biology Educator" },
    level: "beginner",
    category: "Grade 11 Science",
    tags: ["Biology", "Grade 11", "Science"],
    price: 0,
    rating: 4.7,
    reviewCount: 198,
    studentCount: 1450,
    totalDuration: 46800,
    totalLectures: 60,
    sections: [
      {
        id: "s1",
        title: "Introduction to Biology",
        lectures: [
          { id: "l1", title: "What is Biology?", duration: 600, type: "video", isPreview: true, isCompleted: false },
        ],
      },
    ],
    isEnrolled: false,
    progress: 0,
    status: "published",
    createdAt: "2026-01-05T00:00:00Z",
    updatedAt: "2026-03-02T00:00:00Z",
  },
  {
    id: "cs11",
    title: "Computer Science (Grade 11)",
    description:
      "Foundation programming, hardware concepts, and internet fundamentals for Grade 11 students.",
    thumbnail: "",
    instructor: { id: "t2", name: "Er. Rajesh Thapa", title: "Software Engineer & Educator" },
    level: "beginner",
    category: "Grade 11 Science",
    tags: ["Computer Science", "Grade 11", "Programming"],
    price: 0,
    rating: 4.8,
    reviewCount: 267,
    studentCount: 1780,
    totalDuration: 50400,
    totalLectures: 68,
    sections: [
      {
        id: "s1",
        title: "Computer Fundamentals",
        lectures: [
          { id: "l1", title: "Introduction to Computers", duration: 900, type: "video", isPreview: true, isCompleted: false },
        ],
      },
    ],
    isEnrolled: false,
    progress: 0,
    status: "published",
    createdAt: "2026-01-08T00:00:00Z",
    updatedAt: "2026-03-06T00:00:00Z",
  },
  {
    id: "ss11",
    title: "Social Studies (Grade 11)",
    description:
      "Understand Nepal's geography, history, and social dynamics with comprehensive coverage for Grade 11.",
    thumbnail: "",
    instructor: { id: "t9", name: "Mr. Prakash Bhandari", title: "Social Studies Teacher" },
    level: "beginner",
    category: "Grade 11 Management",
    tags: ["Social Studies", "Grade 11", "Management"],
    price: 0,
    rating: 4.5,
    reviewCount: 156,
    studentCount: 1100,
    totalDuration: 43200,
    totalLectures: 58,
    sections: [
      {
        id: "s1",
        title: "Nepal's Geography",
        lectures: [
          { id: "l1", title: "Physical Features of Nepal", duration: 900, type: "video", isPreview: true, isCompleted: false },
        ],
      },
    ],
    isEnrolled: false,
    progress: 0,
    status: "published",
    createdAt: "2026-01-12T00:00:00Z",
    updatedAt: "2026-03-09T00:00:00Z",
  },
  {
    id: "law11",
    title: "Constitutional Law (Grade 11)",
    description:
      "Introduction to Nepali law system, government structure, and civic rights for Grade 11 students.",
    thumbnail: "",
    instructor: { id: "t8", name: "Adv. Sunita Rai", title: "Legal Expert & Educator" },
    level: "beginner",
    category: "Grade 11 Law",
    tags: ["Law", "Grade 11", "Constitutional Law"],
    price: 0,
    rating: 4.4,
    reviewCount: 112,
    studentCount: 780,
    totalDuration: 39600,
    totalLectures: 52,
    sections: [
      {
        id: "s1",
        title: "Introduction to Law",
        lectures: [
          { id: "l1", title: "What is Law?", duration: 600, type: "video", isPreview: true, isCompleted: false },
        ],
      },
    ],
    isEnrolled: false,
    progress: 0,
    status: "published",
    createdAt: "2026-01-18T00:00:00Z",
    updatedAt: "2026-03-11T00:00:00Z",
  },
];

// ─── Exam Type ────────────────────────────────────────────────────────────────
export type ExamStatus = "active" | "completed" | "upcoming";

export interface MockExamResult {
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  timeTaken: number;
}

export interface MockExamQuestion {
  id: string;
  text: string;
  type: "mcq" | "true_false";
  marks: number;
  options: { id: string; text: string }[];
  correctAnswer: string;
}

export interface MockExam {
  id: string;
  courseId: string;
  title: string;
  courseName: string;
  duration: number;
  totalMarks: number;
  passingMarks: number;
  status: ExamStatus;
  questions: MockExamQuestion[];
  result: MockExamResult | null;
}

// ─── Mock Exam Data ────────────────────────────────────────────────────────────
export const MOCK_EXAMS: MockExam[] = [
  {
    id: "ex1",
    courseId: "cs12",
    title: "Database Management System Quiz",
    courseName: "Computer Science (Grade 12)",
    duration: 30,
    totalMarks: 50,
    passingMarks: 25,
    status: "active" as const,
    questions: [
      {
        id: "q1",
        text: "Which of the following is NOT a type of database model?",
        type: "mcq" as const,
        marks: 5,
        options: [
          { id: "a", text: "Hierarchical Model" },
          { id: "b", text: "Network Model" },
          { id: "c", text: "Relational Model" },
          { id: "d", text: "Sequential Model" },
        ],
        correctAnswer: "d",
      },
      {
        id: "q2",
        text: "SQL stands for Structured Query Language.",
        type: "true_false" as const,
        marks: 5,
        options: [
          { id: "true", text: "True" },
          { id: "false", text: "False" },
        ],
        correctAnswer: "true",
      },
      {
        id: "q3",
        text: "Which SQL command is used to retrieve data from a table?",
        type: "mcq" as const,
        marks: 5,
        options: [
          { id: "a", text: "INSERT" },
          { id: "b", text: "SELECT" },
          { id: "c", text: "UPDATE" },
          { id: "d", text: "DELETE" },
        ],
        correctAnswer: "b",
      },
      {
        id: "q4",
        text: "A primary key uniquely identifies each record in a table.",
        type: "true_false" as const,
        marks: 5,
        options: [
          { id: "true", text: "True" },
          { id: "false", text: "False" },
        ],
        correctAnswer: "true",
      },
      {
        id: "q5",
        text: "Which normal form eliminates transitive functional dependency?",
        type: "mcq" as const,
        marks: 5,
        options: [
          { id: "a", text: "1NF" },
          { id: "b", text: "2NF" },
          { id: "c", text: "3NF" },
          { id: "d", text: "BCNF" },
        ],
        correctAnswer: "c",
      },
    ],
    result: null,
  },
  {
    id: "ex2",
    courseId: "bio12",
    title: "Cell Biology Assessment",
    courseName: "Biology (Grade 12)",
    duration: 25,
    totalMarks: 40,
    passingMarks: 20,
    status: "completed" as const,
    questions: [
      {
        id: "q1",
        text: "Which organelle is known as the powerhouse of the cell?",
        type: "mcq" as const,
        marks: 5,
        options: [
          { id: "a", text: "Nucleus" },
          { id: "b", text: "Mitochondria" },
          { id: "c", text: "Ribosome" },
          { id: "d", text: "Golgi apparatus" },
        ],
        correctAnswer: "b",
      },
      {
        id: "q2",
        text: "DNA is found only in the nucleus of the cell.",
        type: "true_false" as const,
        marks: 5,
        options: [
          { id: "true", text: "True" },
          { id: "false", text: "False" },
        ],
        correctAnswer: "false",
      },
    ],
    result: { score: 30, totalMarks: 40, percentage: 75, passed: true, timeTaken: 900 },
  },
  {
    id: "ex3",
    courseId: "bio12",
    title: "Genetics & Heredity Quiz",
    courseName: "Biology (Grade 12)",
    duration: 20,
    totalMarks: 30,
    passingMarks: 15,
    status: "upcoming" as const,
    questions: [],
    result: null,
  },
];

// ─── Mock Notifications ────────────────────────────────────────────────────────
export const MOCK_NOTIFICATIONS = [
  {
    id: "n1",
    type: "exam_reminder",
    title: "Exam Available: DBMS Quiz",
    message: "The Database Management System quiz for Computer Science (Grade 12) is now available. Take it before it expires!",
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    actionUrl: "/courses/cs12",
  },
  {
    id: "n2",
    type: "course_update",
    title: "New Lecture Added",
    message: "A new lecture 'SQL Basics' has been added to Computer Science (Grade 12). Continue your learning journey!",
    isRead: false,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    actionUrl: "/courses/cs12",
  },
  {
    id: "n3",
    type: "achievement",
    title: "Achievement Unlocked! 🏆",
    message: "You completed 2 lectures in Biology (Grade 12). Keep up the great work!",
    isRead: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    actionUrl: "/courses/bio12",
  },
  {
    id: "n4",
    type: "live_class",
    title: "Live Class Tomorrow",
    message: "Upcoming live class: 'Cell Division Q&A' for Biology (Grade 12) tomorrow at 3 PM. Don't miss it!",
    isRead: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    actionUrl: "/live",
  },
  {
    id: "n5",
    type: "payment",
    title: "Enrollment Confirmed",
    message: "You have been successfully enrolled in Biology (Grade 12) and Computer Science (Grade 12).",
    isRead: true,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    actionUrl: "/courses",
  },
];

// ─── Grade Categories ─────────────────────────────────────────────────────────
export const GRADE_CATEGORIES = [
  {
    id: "g12",
    label: "Grade 12",
    subcategories: ["Grade 12 Science", "Grade 12 Management", "Grade 12 Law"],
  },
  {
    id: "g11",
    label: "Grade 11",
    subcategories: ["Grade 11 Science", "Grade 11 Management", "Grade 11 Law"],
  },
];

// ─── Dashboard Stats ───────────────────────────────────────────────────────────
export const MOCK_DASHBOARD_STATS = {
  enrolledCourses: 2,
  completedCourses: 0,
  totalHoursLearned: 4,
  examsPassed: 1,
  currentStreak: 5,
  certificates: 0,
};
