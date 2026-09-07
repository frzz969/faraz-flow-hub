import { createFileRoute } from "@tanstack/react-router";
import { FileText, CalendarClock, Download, FileBarChart } from "lucide-react";
import { PageHeader } from "@/components/farazz/page-header";
import { SectionCard } from "@/components/farazz/primitives";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports — FARAZZ FLOW" },
      { name: "description", content: "Scheduled and on-demand operational reports." },
    ],
  }),
  component: ReportsPage,
});

const REPORT_TEMPLATES = [
  { name: "Shipment Performance Report", desc: "Created vs delivered volumes and on-time rate, grouped by hub.", schedule: "Daily · 06:00", format: "PDF / XLSX" },
  { name: "Warehouse Utilization Report", desc: "Capacity, inbound, sorting and outbound load per hub.", schedule: "Daily · 06:30", format: "XLSX" },
  { name: "Fleet Utilization Report", desc: "Vehicle assignment, fuel and service intervals.", schedule: "Weekly · Mon 07:00", format: "XLSX" },
  { name: "Financial Summary", desc: "Billing, invoices, payments and COD reconciliation.", schedule: "Monthly · 1st 06:00", format: "PDF" },
  { name: "Exception Report", desc: "All open and resolved exceptions with resolution time.", schedule: "Weekly · Fri 07:00", format: "PDF" },
  { name: "Driver Performance Report", desc: "Driver ratings, delivery counts and on-time delivery.", schedule: "Monthly · 1st 07:30", format: "PDF / XLSX" },
];

function ReportsPage() {
  const t = useT();

  return (
    <div className="mx-auto max-w-[104rem] space-y-5">
      <PageHeader
        title={t("nav.reports")}
        description="Scheduled and on-demand operational reports."
        crumbs={[{ label: t("nav.analytics") }, { label: t("nav.reports") }]}
      />

      <SectionCard title="Report templates" subtitle={`${REPORT_TEMPLATES.length} available`}>
        <ul className="divide-y divide-border">
          {REPORT_TEMPLATES.map((r) => (
            <li key={r.name} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:gap-4">
              <div className="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)] items-start gap-2.5">
                <span className="mt-0.5 text-muted-foreground">
                  <FileBarChart className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{r.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{r.desc}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <CalendarClock className="h-3.5 w-3.5" aria-hidden /> {r.schedule}
                </span>
                <span className="hidden sm:inline">{r.format}</span>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Download className="h-3.5 w-3.5" aria-hidden /> Export
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="On-demand reports" subtitle="Generate a report for the current data snapshot">
        <div className="grid gap-3 sm:grid-cols-3">
          {["Shipments today", "Open exceptions", "Outstanding invoices"].map((label) => (
            <Button key={label} variant="outline" className="justify-start gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" aria-hidden />
              {label}
            </Button>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}