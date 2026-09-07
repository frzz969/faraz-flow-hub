import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, ArrowRight, PackageSearch, Truck, Warehouse as WarehouseIcon } from "lucide-react";
import { PageHeader } from "@/components/farazz/page-header";
import { Field, KpiCard, ProgressBar, SectionCard } from "@/components/farazz/primitives";
import { StatusBadge } from "@/components/farazz/status-badge";
import { Timeline } from "@/components/farazz/timeline";
import { AskFarazzButton } from "@/components/farazz/app-layout";
import { Button } from "@/components/ui/button";
import { useData, useLookups, formatNum } from "@/lib/farazz/store";
import { hubPerformance, shipmentTrend } from "@/lib/farazz/data";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Operations Control Center — FARAZZ FLOW" },
      { name: "description", content: "Real-time logistics and supply chain operations overview: shipments, warehouse capacity, fleet dispatch and exceptions." },
      { property: "og:title", content: "Operations Control Center — FARAZZ FLOW" },
      { property: "og:description", content: "Enterprise logistics and supply chain operations platform." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const t = useT();
  const { db } = useData();
  const look = useLookups();
  const navigate = useNavigate();

  const inTransit = db.shipments.filter((s) => s.status === "in_transit").length;
  const delivered = db.shipments.filter((s) => s.status === "delivered").length;
  const exceptionsOpen = db.exceptions.filter((e) => e.status !== "resolved").length;

  const exceptionByCategory = db.exceptions.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-[104rem] space-y-5">
      <PageHeader
        title={t("dash.greeting")}
        description={t("dash.subtitle")}
        crumbs={[{ label: t("nav.overview") }, { label: t("nav.dashboard") }]}
        actions={
          <>
            <AskFarazzButton />
            <Button size="sm" onClick={() => navigate({ to: "/shipments" })}>
              {t("nav.shipments")}
              <ArrowRight className="ml-1 h-3.5 w-3.5" aria-hidden />
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label={t("dash.kpi.shipments")} value="12,842" delta="+8.4%" hint="vs last week" tone="success" icon={<PackageSearch className="h-4 w-4" />} />
        <KpiCard label={t("dash.kpi.inTransit")} value="4,291" hint={t("common.today")} tone="info" icon={<Truck className="h-4 w-4" />} />
        <KpiCard label={t("dash.kpi.delivered")} value="7,932" delta="96.2%" hint="on-time" tone="success" />
        <KpiCard label={t("dash.kpi.processing")} value="1,284" hint="Active" tone="info" icon={<WarehouseIcon className="h-4 w-4" />} />
        <KpiCard label={t("dash.kpi.exceptions")} value={String(37)} delta={t("common.needAttention")} tone="critical" icon={<AlertTriangle className="h-4 w-4" />} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard className="xl:col-span-2" title={t("dash.shipmentPerformance")} subtitle={t("dash.shipmentPerformanceSub")}>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={shipmentTrend} margin={{ left: -20, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="gCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 12 }} />
                <Area type="monotone" dataKey="created" stroke="var(--color-chart-1)" fill="url(#gCreated)" strokeWidth={2} />
                <Area type="monotone" dataKey="delivered" stroke="var(--color-chart-3)" fill="transparent" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title={t("dash.deliveryPerformance")} subtitle={t("dash.deliveryPerformanceSub")}>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hubPerformance} margin={{ left: -20, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="hub" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis domain={[80, 100]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 12 }} />
                <Bar dataKey="onTime" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard title={t("dash.warehouseCapacity")} subtitle={`${db.warehouses.length} hubs`}>
          <ul className="space-y-3.5">
            {db.warehouses.slice(0, 6).map((w) => {
              const pct = Math.round((w.used / w.capacity) * 100);
              return (
                <li key={w.id}>
                  <div className="mb-1.5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                    <span className="truncate text-sm">{w.name}</span>
                    <span className="num text-xs text-muted-foreground">{pct}%</span>
                  </div>
                  <ProgressBar value={pct} tone={pct > 88 ? "critical" : pct > 70 ? "warning" : "primary"} />
                </li>
              );
            })}
          </ul>
        </SectionCard>

        <SectionCard title={t("dash.exceptionSummary")} subtitle={`${exceptionsOpen} open`} action={<Button variant="ghost" size="sm" onClick={() => navigate({ to: "/exceptions" })}>{t("common.viewAll")}</Button>}>
          <ul className="space-y-2.5">
            {Object.entries(exceptionByCategory).map(([cat, count]) => (
              <li key={cat} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-md border border-border px-3 py-2">
                <span className="truncate text-sm">{cat}</span>
                <span className="num text-sm font-semibold">{count}</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title={t("dash.criticalAlerts")} subtitle="Requires an operational decision">
          <ul className="space-y-3">
            {db.exceptions.filter((e) => e.severity === "high").slice(0, 4).map((e) => (
              <li key={e.id} className="rounded-md border border-critical/20 bg-critical-soft/50 p-3">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                  <p className="truncate text-sm font-medium">{e.category}</p>
                  <StatusBadge value={e.status} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{e.reason} · {e.shipment}</p>
                <p className="mt-1 text-xs">{e.action}</p>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title={t("dash.upcomingDispatch")} subtitle="Next outbound waves">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">{t("common.warehouse")}</th>
                  <th className="pb-2 font-medium">{t("common.destination")}</th>
                  <th className="pb-2 font-medium">{t("common.vehicle")}</th>
                  <th className="pb-2 font-medium">Time</th>
                  <th className="pb-2 font-medium">{t("common.status")}</th>
                </tr>
              </thead>
              <tbody>
                {db.outbound.slice(0, 6).map((o) => (
                  <tr key={o.id} className="border-b border-border/60 last:border-0">
                    <td className="py-2.5">{look.warehouse[o.warehouseId]?.name ?? "—"}</td>
                    <td className="py-2.5">{o.destination}</td>
                    <td className="num py-2.5 text-xs">{look.vehicle[o.vehicleId]?.code ?? "—"}</td>
                    <td className="num py-2.5 text-xs">{o.dispatchTime}</td>
                    <td className="py-2.5"><StatusBadge value={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title={t("dash.recentActivity")} subtitle={`${formatNum(db.activity.length)} events`}>
          <Timeline
            items={db.activity.slice(0, 6).map((a) => ({
              title: `${a.user} — ${a.action}`,
              timestamp: a.time,
              location: a.module,
              operator: a.record,
              description: a.before !== "—" ? `${a.before} → ${a.after}` : "",
              state: "done" as const,
            }))}
          />
        </SectionCard>
      </div>

      <SectionCard title="Operational snapshot" subtitle="Live master data driving every module">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <Field label={t("nav.warehouses")} value={formatNum(db.warehouses.filter((w) => w.active).length)} mono />
          <Field label={t("nav.customers")} value={formatNum(db.customers.filter((c) => c.active).length)} mono />
          <Field label={t("nav.suppliers")} value={formatNum(db.suppliers.filter((s) => s.active).length)} mono />
          <Field label={t("nav.vehicles")} value={formatNum(db.vehicles.filter((v) => v.active).length)} mono />
          <Field label={t("nav.serviceTypes")} value={formatNum(db.serviceTypes.filter((s) => s.active).length)} mono />
          <Field label={t("nav.shipments")} value={`${formatNum(inTransit)} / ${formatNum(delivered)}`} mono />
        </dl>
      </SectionCard>
    </div>
  );
}
