import { LiveClassCard } from "./LiveClassCard";

interface OngoingClassCardProps {
  lc: any;
}

export function OngoingClassCard({ lc }: OngoingClassCardProps) {
  return <LiveClassCard lc={lc} variant="full" />;
}
