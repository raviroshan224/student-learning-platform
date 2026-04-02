import type { Metadata } from "next";
import { Nunito_Sans } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/providers/AppProviders";

const nunitoSans = Nunito_Sans({ subsets: ["latin"], display: "swap", weight: ["400","600","700","800"] });

export const metadata: Metadata = {
  title: {
    default: "ScholarGyan – Student Learning Platform",
    template: "%s | ScholarGyan",
  },
  description:
    "Nepal's ultimate NEB Grade 11 & 12 student learning platform for courses, exams, and live classes.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${nunitoSans.className} h-full`} suppressHydrationWarning>
      <body className="min-h-full antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
