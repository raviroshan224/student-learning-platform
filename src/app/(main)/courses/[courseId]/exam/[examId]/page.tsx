"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";

export default function ExamRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(ROUTES.EXAMS);
  }, [router]);

  return null;
}
