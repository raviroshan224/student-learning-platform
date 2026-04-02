import Link from "next/link";
import { BookOpen, GraduationCap, Radio, Trophy, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/lib/constants/routes";
import { CONFIG } from "@/lib/constants/config";

const features = [
  {
    icon: BookOpen,
    title: "Expert-Led Courses",
    description: "Learn from industry professionals with real-world experience.",
  },
  {
    icon: Radio,
    title: "Live Classes",
    description: "Join interactive live sessions and ask questions in real time.",
  },
  {
    icon: GraduationCap,
    title: "Exams & Certifications",
    description: "Test your knowledge and earn certificates to showcase your skills.",
  },
  {
    icon: Trophy,
    title: "Track Progress",
    description: "Monitor your learning journey with detailed progress analytics.",
  },
];

const stats = [
  { value: "10,000+", label: "Students" },
  { value: "500+", label: "Courses" },
  { value: "50+", label: "Instructors" },
  { value: "98%", label: "Satisfaction" },
];

const featuredCourses = [
  {
    id: "1",
    title: "Complete Web Development Bootcamp",
    instructor: "John Smith",
    rating: 4.8,
    students: 1240,
    category: "Development",
    price: 49.99,
  },
  {
    id: "2",
    title: "Data Science with Python",
    instructor: "Sarah Johnson",
    rating: 4.9,
    students: 890,
    category: "Data Science",
    price: 59.99,
  },
  {
    id: "3",
    title: "UI/UX Design Fundamentals",
    instructor: "Mike Lee",
    rating: 4.7,
    students: 670,
    category: "Design",
    price: 39.99,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <span className="text-xl font-bold text-[var(--color-primary-600)]">
            {CONFIG.APP_NAME}
          </span>
          <div className="flex items-center gap-3">
            <Link href={ROUTES.LOGIN}>
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href={ROUTES.REGISTER}>
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4 text-center bg-gradient-to-b from-[var(--color-primary-50)] to-[var(--background)]">
        <div className="container mx-auto max-w-4xl">
          <Badge variant="default" className="mb-4">
            #1 Student Learning Platform
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--foreground)] mb-6">
            Learn Without{" "}
            <span className="text-[var(--color-primary-600)]">Limits</span>
          </h1>
          <p className="text-lg sm:text-xl text-[var(--muted-foreground)] mb-8 max-w-2xl mx-auto">
            Access thousands of expert-led courses, live classes, and exams. Level up your skills and advance your career.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href={ROUTES.REGISTER}>
              <Button size="lg" className="w-full sm:w-auto gap-2">
                Start Learning Free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={ROUTES.EXPLORE}>
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Browse Courses
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-4 border-y border-[var(--border)]">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {stats.map(({ value, label }) => (
              <div key={label}>
                <p className="text-3xl font-bold text-[var(--color-primary-600)]">{value}</p>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose {CONFIG.APP_NAME}?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, description }) => (
              <Card key={title} className="text-center hover:shadow-md transition-shadow">
                <CardContent className="pt-6 pb-6">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-primary-50)]">
                    <Icon className="h-6 w-6 text-[var(--color-primary-600)]" />
                  </div>
                  <h3 className="font-semibold mb-2">{title}</h3>
                  <p className="text-sm text-[var(--muted-foreground)]">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-16 px-4 bg-[var(--muted)]">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Featured Courses</h2>
            <Link href={ROUTES.EXPLORE}>
              <Button variant="ghost" className="gap-1">
                View all <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCourses.map((course) => (
              <Card key={course.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-40 bg-gradient-to-br from-[var(--color-primary-100)] to-[var(--color-primary-200)] flex items-center justify-center">
                  <BookOpen className="h-12 w-12 text-[var(--color-primary-500)]" />
                </div>
                <CardContent className="pt-4">
                  <Badge variant="secondary" className="mb-2 text-xs">{course.category}</Badge>
                  <h3 className="font-semibold text-sm mb-1 line-clamp-2">{course.title}</h3>
                  <p className="text-xs text-[var(--muted-foreground)] mb-2">{course.instructor}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-medium">{course.rating}</span>
                      <span className="text-xs text-[var(--muted-foreground)]">({course.students})</span>
                    </div>
                    <span className="text-sm font-bold text-[var(--color-primary-600)]">
                      ${course.price}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Learning?</h2>
          <p className="text-[var(--muted-foreground)] mb-8">
            Join thousands of students already learning on {CONFIG.APP_NAME}.
          </p>
          <Link href={ROUTES.REGISTER}>
            <Button size="lg" className="gap-2">
              Create Free Account <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-8 px-4 text-center text-sm text-[var(--muted-foreground)]">
        <p>&copy; {new Date().getFullYear()} {CONFIG.APP_NAME}. All rights reserved.</p>
      </footer>
    </div>
  );
}
