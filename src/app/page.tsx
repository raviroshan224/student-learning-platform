import Link from "next/link";
import { BookOpen, GraduationCap, Radio, Trophy, ArrowRight, Star, CheckCircle, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
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

const steps = [
  { number: "01", title: "Find Course", description: "Browse our curated catalog of NEB Grade 11 & 12 courses" },
  { number: "02", title: "Enroll & Start", description: "Enroll instantly and start learning at your own pace" },
  { number: "03", title: "Get Certified", description: "Complete tests and earn certificates to prove your skills" },
];

const featuredCourses = [
  { id: "1", title: "Complete Web Development Bootcamp", instructor: "John Smith", rating: 4.8, students: 1240, category: "Computer Science", price: 4999 },
  { id: "2", title: "Data Science with Python", instructor: "Sarah Johnson", rating: 4.9, students: 890, category: "Science", price: 5999 },
  { id: "3", title: "Business Management Fundamentals", instructor: "Mike Lee", rating: 4.7, students: 670, category: "Management", price: 3999 },
];

const categoryColors: Record<string, string> = {
  "Management": "bg-[#dcfce7] text-[#166439]",
  "Science": "bg-[#dbeafe] text-[#1d4ed8]",
  "Computer Science": "bg-[#fef3c7] text-[#92400e]",
  "Humanities": "bg-[#ede9fe] text-[#5b21b6]",
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ── Navbar ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white border-b border-[var(--border)]">
        <div className="container mx-auto max-w-7xl flex h-16 items-center justify-between px-4 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[var(--color-primary-600)] flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-[var(--foreground)]">
              Scholar<span className="text-[var(--color-primary-600)]">Gyan</span>
            </span>
          </Link>

          {/* Center nav links — desktop */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[var(--muted-foreground)]">
            <Link href="/" className="text-[var(--foreground)] border-b-2 border-[var(--color-primary-600)] pb-0.5">Home</Link>
            <Link href={ROUTES.EXPLORE} className="hover:text-[var(--foreground)] transition-colors">All Courses</Link>
            <Link href={ROUTES.EXAMS} className="hover:text-[var(--foreground)] transition-colors">Mock Tests</Link>
            <Link href={ROUTES.LIVE} className="hover:text-[var(--foreground)] transition-colors">Live Classes</Link>
          </nav>

          {/* Auth buttons */}
          <div className="flex items-center gap-2">
            <Link href={ROUTES.LOGIN}>
              <Button variant="ghost" size="sm" className="text-[var(--foreground)] font-medium">Sign In</Button>
            </Link>
            <Link href={ROUTES.REGISTER}>
              <Button size="sm" className="bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-700)] rounded-lg">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="bg-[var(--color-primary-50)] py-16 lg:py-24 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div>
              <span className="inline-block bg-[var(--primary-muted)] text-[var(--color-primary-600)] text-xs font-semibold px-3 py-1 rounded-full mb-5">
                #1 NEB Learning Platform in Nepal
              </span>
              <h1 className="text-4xl lg:text-5xl font-bold text-[var(--foreground)] leading-tight mb-5">
                Build Your{" "}
                <span className="text-[var(--color-primary-600)]">Bright Future</span>{" "}
                With Expert Guidance
              </h1>
              <p className="text-[var(--muted-foreground)] text-lg leading-relaxed mb-8 max-w-lg">
                Access thousands of expert-led courses, live interactive classes, and practice exams designed specifically for NEB Grade 11 & 12.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <Link href={ROUTES.REGISTER}>
                  <Button size="lg" className="w-full sm:w-auto bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-700)] rounded-lg gap-2 px-6">
                    Start Learning Free <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={ROUTES.EXPLORE}>
                  <Button variant="outline" size="lg" className="w-full sm:w-auto border-[var(--color-primary-600)] text-[var(--color-primary-600)] hover:bg-[var(--color-primary-50)] rounded-lg px-6">
                    Browse Courses
                  </Button>
                </Link>
              </div>
              {/* Stats row */}
              <div className="flex items-center gap-6 sm:gap-8">
                <div>
                  <p className="text-2xl font-bold text-[var(--foreground)]">1,200+</p>
                  <p className="text-sm text-[var(--muted-foreground)]">Courses</p>
                </div>
                <div className="w-px h-8 bg-[var(--border)]" />
                <div>
                  <p className="text-2xl font-bold text-[var(--foreground)]">48k+</p>
                  <p className="text-sm text-[var(--muted-foreground)]">Students</p>
                </div>
                <div className="w-px h-8 bg-[var(--border)]" />
                <div>
                  <p className="text-2xl font-bold text-[var(--foreground)]">4.8★</p>
                  <p className="text-sm text-[var(--muted-foreground)]">Rating</p>
                </div>
              </div>
            </div>

            {/* Right — illustration placeholder */}
            <div className="relative hidden lg:flex items-center justify-center">
              <div className="w-96 h-80 bg-white rounded-2xl border border-[var(--border)] flex items-center justify-center">
                <div className="text-center">
                  <GraduationCap className="h-20 w-20 text-[var(--color-primary-600)]/20 mx-auto mb-4" />
                  <p className="text-sm text-[var(--muted-foreground)]">Start your learning journey</p>
                </div>
              </div>
              {/* Floating pill — top right */}
              <div className="absolute -top-4 -right-4 bg-white border border-[var(--border)] rounded-xl px-4 py-3 shadow-[var(--shadow)]">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm font-semibold text-[var(--foreground)]">4.8 Rating</span>
                </div>
              </div>
              {/* Floating pill — bottom left */}
              <div className="absolute -bottom-4 -left-4 bg-[var(--color-primary-600)] text-white rounded-xl px-4 py-3">
                <p className="text-xs font-medium opacity-80">Total Courses</p>
                <p className="text-lg font-bold">1,200+</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Courses ─────────────────────────────────────────── */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-[var(--foreground)]">
                All Courses of {CONFIG.APP_NAME}
              </h2>
              <p className="text-[var(--muted-foreground)] mt-1">Explore our most popular courses</p>
            </div>
            <Link href={ROUTES.EXPLORE} className="hidden sm:flex items-center gap-1 text-sm font-medium text-[var(--color-primary-600)] hover:underline">
              See All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-6">
            {["All", "Management", "Science", "Computer Science", "Humanities"].map((cat, i) => (
              <button
                key={cat}
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  i === 0
                    ? "bg-[var(--color-primary-600)] text-white"
                    : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--color-primary-50)] hover:text-[var(--color-primary-600)]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featuredCourses.map((course) => {
              const badgeClass = categoryColors[course.category] ?? "bg-[var(--muted)] text-[var(--muted-foreground)]";
              return (
                <Link key={course.id} href={ROUTES.REGISTER}>
                  <div className="bg-white border border-[var(--border)] rounded-xl overflow-hidden hover:border-[var(--color-primary-600)] transition-colors cursor-pointer group">
                    {/* Thumbnail */}
                    <div className="h-44 bg-[var(--color-primary-50)] flex items-center justify-center">
                      <BookOpen className="h-14 w-14 text-[var(--color-primary-600)]/30" />
                    </div>
                    <div className="p-4">
                      <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-3 ${badgeClass}`}>
                        {course.category}
                      </span>
                      <h3 className="font-semibold text-[var(--foreground)] mb-1 line-clamp-2 group-hover:text-[var(--color-primary-600)] transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-sm text-[var(--muted-foreground)] mb-3">{course.instructor}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{course.rating}</span>
                          <span className="text-xs text-[var(--muted-foreground)]">({course.students})</span>
                        </div>
                        <span className="text-sm font-bold text-[var(--color-primary-600)]">
                          Rs {course.price.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="text-center mt-8 sm:hidden">
            <Link href={ROUTES.EXPLORE}>
              <Button variant="outline" className="border-[var(--color-primary-600)] text-[var(--color-primary-600)] rounded-lg">
                See All Courses <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-[var(--color-primary-50)]">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-2xl lg:text-3xl font-bold text-center text-[var(--foreground)] mb-12">
            How It Works
          </h2>
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-0">
            {steps.map((step, i) => (
              <div key={step.number} className="flex-1 flex flex-col items-center md:flex-row">
                <div className="flex-1 text-center px-6">
                  <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-white border-2 border-[var(--color-primary-600)] flex items-center justify-center">
                    <span className="text-sm font-bold text-[var(--color-primary-600)]">{step.number}</span>
                  </div>
                  <h3 className="font-bold text-lg text-[var(--foreground)] mb-2">{step.title}</h3>
                  <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{step.description}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden md:flex items-center text-[var(--color-primary-600)] text-2xl font-light shrink-0">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Choose Us ────────────────────────────────────────────── */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <h2 className="text-2xl lg:text-3xl font-bold text-center text-[var(--foreground)] mb-4">
            Why Choose {CONFIG.APP_NAME}?
          </h2>
          <p className="text-[var(--muted-foreground)] text-center mb-12">
            Everything you need to succeed in NEB exams, in one place.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="bg-white border border-[var(--border)] rounded-xl p-6 text-center hover:border-[var(--color-primary-600)] transition-colors">
                <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-[var(--color-primary-50)] flex items-center justify-center">
                  <Icon className="h-6 w-6 text-[var(--color-primary-600)]" />
                </div>
                <h3 className="font-semibold text-[var(--foreground)] mb-2">{title}</h3>
                <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── App Banner ────────────────────────────────────────────────── */}
      <section className="py-12 px-4 bg-[var(--color-primary-600)]">
        <div className="container mx-auto max-w-5xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-white/15 flex items-center justify-center">
              <Smartphone className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Download Our Mobile App</h3>
              <p className="text-white/70 text-sm">Learn on the go with the {CONFIG.APP_NAME} mobile app</p>
            </div>
          </div>
          <div className="flex gap-3 shrink-0">
            <button className="border border-white/30 text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-white/10 transition-colors">
              Google Play
            </button>
            <button className="border border-white/30 text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-white/10 transition-colors">
              App Store
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="py-12 px-4 border-t border-[var(--border)] bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-[var(--color-primary-600)] flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold">
                  Scholar<span className="text-[var(--color-primary-600)]">Gyan</span>
                </span>
              </div>
              <p className="text-sm text-[var(--muted-foreground)] mb-3 leading-relaxed">
                Nepal&apos;s premier NEB learning platform for Grade 11 & 12 students.
              </p>
              <p className="text-sm text-[var(--muted-foreground)]">support@scholargyan.com</p>
            </div>

            {/* Categories */}
            <div>
              <h4 className="font-semibold text-[var(--foreground)] mb-3">Categories</h4>
              <ul className="space-y-2 text-sm text-[var(--muted-foreground)]">
                {["Management", "Science", "Computer Science", "Humanities"].map((cat) => (
                  <li key={cat}>
                    <Link href={ROUTES.EXPLORE} className="hover:text-[var(--color-primary-600)] transition-colors">
                      {cat}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-[var(--foreground)] mb-3">Quick Links</h4>
              <ul className="space-y-2 text-sm text-[var(--muted-foreground)]">
                <li><Link href={ROUTES.EXPLORE} className="hover:text-[var(--color-primary-600)] transition-colors">All Courses</Link></li>
                <li><Link href={ROUTES.LIVE} className="hover:text-[var(--color-primary-600)] transition-colors">Live Classes</Link></li>
                <li><Link href={ROUTES.EXAMS} className="hover:text-[var(--color-primary-600)] transition-colors">Mock Tests</Link></li>
                <li><Link href={ROUTES.LOGIN} className="hover:text-[var(--color-primary-600)] transition-colors">Sign In</Link></li>
                <li><Link href={ROUTES.REGISTER} className="hover:text-[var(--color-primary-600)] transition-colors">Create Account</Link></li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="font-semibold text-[var(--foreground)] mb-3">Newsletter</h4>
              <p className="text-sm text-[var(--muted-foreground)] mb-3 leading-relaxed">
                Subscribe for updates on new courses and upcoming exams.
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Your email"
                  className="flex-1 text-sm border border-[var(--border)] rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-primary-600)] transition-colors bg-white"
                />
                <button className="bg-[var(--color-primary-600)] text-white rounded-lg px-3 py-2 text-sm font-medium hover:bg-[var(--color-primary-700)] transition-colors">
                  Go
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--border)] pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-[var(--muted-foreground)]">
            <p>&copy; {new Date().getFullYear()} {CONFIG.APP_NAME}. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-[var(--foreground)] transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-[var(--foreground)] transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
