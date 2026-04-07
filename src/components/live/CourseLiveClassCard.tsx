import { LiveClassCard } from "./LiveClassCard";

interface CourseLiveClassCardProps {
  lc: any;
}

export function CourseLiveClassCard({ lc }: CourseLiveClassCardProps) {
  return <LiveClassCard lc={lc} variant="full" />;
}
