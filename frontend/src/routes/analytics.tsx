import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, PackageSearch, Truck, PackageCheck, AlertTriangle, CircleDot, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/farazz/page-header";
import { KpiCard, SectionCard, ProgressBar } from "@/components/farazz/primitives";
import { useData, useLookups } from "@/lib/farazz/store";
import { exportCSV } from "@/lib/farazz/export";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — FARAZZ FLOW" },
      { name: "description", content: "Operational analytics on shipments, exceptions and hub activity." },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const t = useT();
  const { db } = useData();
  const look = useLookups();

  const total = db.shipments.length;
  const inTransit = db.shipments.filter((s) => s.status === "in_transit").length;
  const delivered = db.shipments.filter((s) => s.status === "delivered").length;
  const delayed = db.shipments.filter((s) => s.status === "delayed").length;
  const exceptions = db.shipments.filter((s) => s.status === "exception").length;

  // Status breakdown
  const statusCounts = db.shipments.reduce<Record<string, number>>((acc, s) => {
    acc[s.status] = (acc[s.status] ?? 0) + 1;
    return acc;
  }, {});
  const statusTotal = Math.max(1, total);

  // Exceptions by category
  const excByCategory = db.exceptions.filter((e) => e.status !== "resolved").reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + 1;
    return acc;
  }, {});

  // Hub activity from warehouses
  const activeHubs = db.warehouses.filter((w) => w.active).slice(0, 6);

  return (
    <div className="mx-auto max-w-[104rem] space-y-5">
      <PageHeader
        title={t("nav.analyticsOperations")}
        description="Operational analytics on shipments, exceptions and hub activity."
        crumbs={[{ label: t("nav.analytics") }, { label: t("nav.analyticsOperations") }]}
        actions={
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => {
              exportCSV(
                db.warehouses.map((w) => ({
                  code: w.code,
                  name: w.name,
                  city: w.city,
                  utilization: Math.round((w.used / w.capacity) * 100),
                  status: w.status,
                })),
                [
                  { key: "code", header: "Code" },
                  { key: "name", header: "Hub" },
                  { key: "city", header: "City" },
                  { key: "utilization", header: "Utilization %" },
                  { key: "status", header: "Status" },
                ],
                "analytics-hub-utilization.csv",
              );
              toast.success("Analytics snapshot exported.");
            }}
          >
            <Download className="h-4 w-4" aria-hidden /> Export Snapshot
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label={t("dash.kpi.shipments")} value={String(total)} tone="info" icon={<PackageSearch className="h-4 w-4" />} />
        <KpiCard label={t("dash.kpi.inTransit")} value={String(inTransit)} tone="info" icon={<Truck className="h-4 w-4" />} />
        <KpiCard label={t("dash.kpi.delivered")} value={String(delivered)} tone="success" icon={<PackageCheck className="h-4 w-4" />} />
        <KpiCard label="Delayed" value={String(delayed)} tone="warning" icon={<CircleDot className="h-4 w-4" />} />
        <KpiCard label="Exceptions" value={String(exceptions)} tone="critical" icon={<AlertTriangle className="h-4 w-4" />} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Shipment status breakdown" subtitle={`Across ${total} shipments`}>
          <ul className="space-y-3.5">
            {Object.entries(statusCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([status, count]) => (
                <li key={status}>
                  <div className="mb-1.5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                    <span className="truncate text-sm">{t(`status.${status}`, status)}</span>
                    <span className="num text-xs text-muted-foreground">{count} · {Math.round((count / statusTotal) * 100)}%</span>
                  </div>
                  <ProgressBar value={(count / statusTotal) * 100} tone={status === "delayed" || status === "exception" ? "critical" : status === "in_transit" ? "warning" : "primary"} />
                </li>
              ))}
          </ul>
        </SectionCard>

        <SectionCard title="Open exceptions by category" subtitle={`${db.exceptions.filter((e) => e.status !== "resolved").length} unresolved`}>
          <ul className="space-y-2.5">
            {Object.entries(excByCategory).length === 0 ? (
              <p className="text-sm text-muted-foreground">No open exceptions.</p>
            ) : (
              Object.entries(excByCategory).map(([cat, count]) => (
                <li key={cat} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-md border border-border px-3 py-2">
                  <span className="truncate text-sm">{cat}</span>
                  <span className="num text-sm font-semibold">{count}</span>
                </li>
              ))
            )}
          </ul>
        </SectionCard>
      </div>

      <SectionCard title="Hub capacity overview" subtitle="Utilization across active hubs">
        <ul className="space-y-3.5">
          {activeHubs.map((w) => {
            const pct = Math.round((w.used / w.capacity) * 100);
            return (
              <li key={w.id}>
                <div className="mb-1.5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                  <span className="truncate text-sm">{w.name} · {look.warehouse[w.id]?.city ?? w.city}</span>
                  <span className="num text-xs text-muted-foreground">{pct}% used</span>
                </div>
                <ProgressBar value={pct} tone={pct > 88 ? "critical" : pct > 70 ? "warning" : "primary"} />
              </li>
            );
          })}
        </ul>
      </SectionCard>
    </div>
  );
}