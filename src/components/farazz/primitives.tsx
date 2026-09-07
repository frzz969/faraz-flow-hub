import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionCard({
  title,
  subtitle,
  action,
  children,
  className,
  bodyClassName,
  padded = true,
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  padded?: boolean;
}) {
  return (
    <section className={cn("surface flex flex-col", className)}>
      {(title || action) && (
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-4 py-3 sm:px-5">
          <div className="min-w-0">
            {title && <h2 className="truncate text-sm font-semibold">{title}</h2>}
            {subtitle && <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={cn(padded && "p-4 sm:p-5", "min-w-0 flex-1", bodyClassName)}>{children}</div>
    </section>
  );
}

export function KpiCard({
  label,
  value,
  delta,
  hint,
  tone = "neutral",
  icon,
}: {
  label: string;
  value: string;
  delta?: string;
  hint?: string;
  tone?: "neutral" | "success" | "warning" | "critical" | "info";
  icon?: ReactNode;
}) {
  const toneClass = {
    neutral: "text-muted-foreground",
    success: "text-success",
    warning: "text-warning",
    critical: "text-critical",
    info: "text-info",
  }[tone];

  return (
    <div className="surface p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
        {icon && <span className={cn("shrink-0", toneClass)}>{icon}</span>}
      </div>
      <p className="num mt-3 text-2xl font-semibold">{value}</p>
      <div className="mt-1 flex items-center gap-2 text-xs">
        {delta && <span className={cn("font-medium", toneClass)}>{delta}</span>}
        {hint && <span className="text-muted-foreground">{hint}</span>}
      </div>
    </div>
  );
}

export function Field({ label, value, mono }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn("mt-0.5 text-sm font-medium break-words", mono && "num")}>{value}</dd>
    </div>
  );
}

export function ProgressBar({ value, tone = "primary" }: { value: number; tone?: "primary" | "warning" | "critical" | "success" }) {
  const bg = {
    primary: "bg-primary",
    warning: "bg-warning",
    critical: "bg-critical",
    success: "bg-success",
  }[tone];
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn("h-full rounded-full transition-all", bg)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}
