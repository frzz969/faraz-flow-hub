import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface TimelineItem {
  title: string;
  timestamp?: string;
  location?: string;
  operator?: string;
  description?: string;
  state?: "done" | "current" | "upcoming" | "alert";
  right?: ReactNode;
}

export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="relative space-y-0">
      {items.map((item, i) => {
        const state = item.state ?? (i === items.length - 1 ? "current" : "done");
        const dot = {
          done: "bg-success",
          current: "bg-primary ring-4 ring-primary-soft",
          upcoming: "bg-muted-foreground/30",
          alert: "bg-critical ring-4 ring-critical-soft",
        }[state];
        return (
          <li key={`${item.title}-${i}`} className="relative flex gap-3 pb-5 last:pb-0">
            <div className="flex flex-col items-center">
              <span className={cn("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", dot)} aria-hidden />
              {i < items.length - 1 && <span className="mt-1 w-px flex-1 bg-border" aria-hidden />}
            </div>
            <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <p className={cn("text-sm font-medium", state === "upcoming" && "text-muted-foreground")}>{item.title}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                  {item.location && <span>{item.location}</span>}
                  {item.operator && <span className="before:mr-2 before:content-['·']">{item.operator}</span>}
                </div>
                {item.description && <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>}
              </div>
              <div className="shrink-0 text-right">
                {item.timestamp && <span className="num text-xs text-muted-foreground">{item.timestamp}</span>}
                {item.right && <div className="mt-1">{item.right}</div>}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
