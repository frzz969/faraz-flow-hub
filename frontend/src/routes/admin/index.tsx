import { createFileRoute } from "@tanstack/react-router";
import { Shield, Users, Truck, Warehouse as WarehouseIcon, CircleAlert, ListChecks } from "lucide-react";
import { PageHeader } from "@/components/farazz/page-header";
import { KpiCard, SectionCard } from "@/components/farazz/primitives";
import { Timeline } from "@/components/farazz/timeline";
import { useData, formatNum } from "@/lib/farazz/store";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — FARAZZ FLOW" },
      { name: "description", content: "Administration overview for the FARAZZ FLOW platform." },
    ],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const t = useT();
  const { db } = useData();

  const activeUsers = db.users.filter((u) => u.active).length;
  const openExceptions = db.exceptions.filter((e) => e.status !== "resolved").length;
  const openTasks = db.tasks.filter((tk) => tk.status !== "completed").length;

  return (
    <div className="mx-auto max-w-[104rem] space-y-5">
      <PageHeader
        title={t("admin.dashboard")}
        description="Platform administration overview."
        crumbs={[{ label: t("nav.administration") }, { label: t("admin.dashboard") }]}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label={t("admin.users")} value={String(activeUsers)} hint="active" tone="info" icon={<Users className="h-4 w-4" />} />
        <KpiCard label={t("nav.vehicles")} value={String(db.vehicles.filter((v) => v.active).length)} hint="active" tone="info" icon={<Truck className="h-4 w-4" />} />
        <KpiCard label={t("nav.warehouses")} value={String(db.warehouses.filter((w) => w.active).length)} hint="active" tone="info" icon={<WarehouseIcon className="h-4 w-4" />} />
        <KpiCard label={t("nav.exceptions")} value={String(openExceptions)} hint="open" tone="critical" icon={<CircleAlert className="h-4 w-4" />} />
        <KpiCard label={t("nav.tasks")} value={String(openTasks)} hint="open" tone="warning" icon={<ListChecks className="h-4 w-4" />} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Platform snapshot" subtitle="Live master data">
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <StatsField label={t("nav.customers")} value={formatNum(db.customers.filter((c) => c.active).length)} />
            <StatsField label={t("nav.suppliers")} value={formatNum(db.suppliers.filter((s) => s.active).length)} />
            <StatsField label={t("nav.drivers")} value={formatNum(db.drivers.filter((d) => d.active).length)} />
            <StatsField label={t("nav.routes")} value={formatNum(db.routes.filter((r) => r.active).length)} />
            <StatsField label={t("nav.serviceTypes")} value={formatNum(db.serviceTypes.filter((s) => s.active).length)} />
            <StatsField label={t("nav.inventory")} value={formatNum(db.products.filter((p) => p.active).length)} />
          </dl>
        </SectionCard>

        <SectionCard title={t("admin.audit")} subtitle="Latest audit events">
          <Timeline
            items={db.auditLog.slice(0, 6).map((a) => ({
              title: `${a.user} — ${a.action}`,
              timestamp: a.time,
              location: a.module,
              operator: a.record,
              description: a.before !== "—" ? `${a.before} → ${a.after}` : "",
            }))}
          />
        </SectionCard>
      </div>

      <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-4 py-3 text-sm">
        <Shield className="h-4 w-4 text-muted-foreground" aria-hidden />
        <span className="text-muted-foreground">You are signed in as <span className="font-medium text-foreground">Dimas Prakoso</span> · Super Admin</span>
      </div>
    </div>
  );
}

function StatsField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="num mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}