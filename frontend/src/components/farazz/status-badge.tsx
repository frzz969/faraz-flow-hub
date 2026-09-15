import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

type Tone = "success" | "warning" | "critical" | "info" | "neutral" | "ai";

const TONE_BY_STATUS: Record<string, Tone> = {
  delivered: "success",
  completed: "success",
  received: "success",
  put_away: "success",
  resolved: "success",
  paid: "success",
  approved: "success",
  operational: "success",
  active: "success",
  available: "success",
  collected: "success",
  remitted: "success",
  low: "success",

  delayed: "warning",
  pending: "warning",
  partially_paid: "warning",
  congested: "warning",
  inspection: "warning",
  investigating: "warning",
  medium: "warning",
  idle: "warning",
  workshop: "warning",
  ready: "warning",
  requested: "warning",
  scanning: "warning",

  exception: "critical",
  failed: "critical",
  critical: "critical",
  overdue: "critical",
  rejected: "critical",
  cancelled: "critical",
  returned: "critical",
  high: "critical",
  unpaid: "critical",

  created: "info",
  confirmed: "info",
  processing: "info",
  picked_up: "info",
  at_origin_hub: "info",
  sorting: "info",
  dispatched: "info",
  in_transit: "info",
  at_destination_hub: "info",
  out_for_delivery: "info",
  assigned: "info",
  on_route: "info",
  open: "info",
  expected: "info",
  arrived: "info",
  picking: "info",
  packing: "info",
  loaded: "info",
};

const TONE_CLASS: Record<Tone, string> = {
  success: "bg-success-soft text-success ring-success/20",
  warning: "bg-warning-soft text-warning ring-warning/20",
  critical: "bg-critical-soft text-critical ring-critical/20",
  info: "bg-info-soft text-info ring-info/20",
  neutral: "bg-muted text-muted-foreground ring-border",
  ai: "bg-ai-soft text-ai ring-ai/20",
};

export function statusKey(value: string) {
  return value.toLowerCase().replace(/[\s/]+/g, "_").replace(/[^a-z_]/g, "");
}

export function StatusBadge({
  value,
  tone,
  className,
  dot = true,
}: {
  value: string;
  tone?: Tone;
  className?: string;
  dot?: boolean;
}) {
  const t = useT();
  const key = statusKey(value);
  const resolved = tone ?? TONE_BY_STATUS[key] ?? "neutral";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap",
        TONE_CLASS[resolved],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />}
      {t(`status.${key}`, value)}
    </span>
  );
}
