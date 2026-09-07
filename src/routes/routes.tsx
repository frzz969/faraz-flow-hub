import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Route as RouteIcon, MapPin, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/farazz/page-header";
import { DataTable, type Column } from "@/components/farazz/data-table";
import { KpiCard, Field, ProgressBar } from "@/components/farazz/primitives";
import { StatusBadge } from "@/components/farazz/status-badge";
import { useData, formatNum } from "@/lib/farazz/store";
import { useT } from "@/lib/i18n";
import type { RouteRec } from "@/lib/farazz/data";

export const Route = createFileRoute("/routes")({
  head: () => ({
    meta: [
      { title: "Routes — FARAZZ FLOW" },
      { name: "description", content: "Line haul routes, stops, distances and on-time performance." },
    ],
  }),
  component: RoutesPage,
});

function RoutesPage() {
  const t = useT();
  const { db } = useData();
  const [selected, setSelected] = useState<RouteRec | null>(null);

  const totalDistance = db.routes.reduce((acc, r) => acc + r.distanceKm, 0);
  const avgOnTime = Math.round((db.routes.reduce((acc, r) => acc + r.onTimeRate, 0) / Math.max(1, db.routes.length)) * 10) / 10;

  const columns: Column<RouteRec>[] = [
    { key: "code", header: "Code", value: (r) => r.code, className: "num", render: (r) => <span className="num font-medium text-foreground">{r.code}</span> },
    { key: "name", header: t("common.name"), value: (r) => r.name },
    { key: "stops", header: "Stops", value: (r) => r.stops.join(", "), className: "max-w-[18rem] truncate", hideOnMobile: true },
    { key: "distance", header: "Distance", value: (r) => r.distanceKm, render: (r) => <span className="num">{formatNum(r.distanceKm)} km</span>, align: "right" },
    { key: "est", header: "Est. hours", value: (r) => r.estHours, render: (r) => <span className="num">{r.estHours}h</span>, align: "right", hideOnMobile: true },
    { key: "actual", header: "Actual", value: (r) => r.actualHours, render: (r) => <span className="num">{r.actualHours}h</span>, align: "right", hideOnMobile: true },
    {
      key: "onTime",
      header: "On-time",
      value: (r) => r.onTimeRate,
      render: (r) => (
        <div className="flex w-28 items-center gap-2">
          <ProgressBar value={r.onTimeRate} tone={r.onTimeRate < 90 ? "warning" : "success"} />
          <span className="num text-xs text-muted-foreground">{r.onTimeRate}%</span>
        </div>
      ),
      hideOnMobile: true,
    },
    { key: "shipments", header: "Active shipments", value: (r) => r.activeShipments, render: (r) => <span className="num">{formatNum(r.activeShipments)}</span>, align: "right", hideOnMobile: true },
  ];

  return (
    <div className="mx-auto max-w-[104rem] space-y-5">
      <PageHeader
        title={t("nav.routes")}
        description="Line haul routes, stops, distances and on-time performance."
        crumbs={[{ label: t("nav.fleet") }, { label: t("nav.routes") }]}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Total routes" value={String(db.routes.length)} tone="info" icon={<RouteIcon className="h-4 w-4" />} />
        <KpiCard label="Covered distance" value={formatNum(totalDistance) + " km"} tone="info" icon={<MapPin className="h-4 w-4" />} />
        <KpiCard label="Avg on-time" value={avgOnTime + "%"} tone="success" icon={<Clock className="h-4 w-4" />} />
      </div>

      <DataTable
        rows={db.routes}
        columns={columns}
        searchKeys={(r) => `${r.code} ${r.name} ${r.stops.join(" ")}`}
        searchPlaceholder="Search code, name, stops…"
        onRowClick={setSelected}
      />

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="num">{selected.code}</DialogTitle>
              </DialogHeader>
              <dl className="grid grid-cols-2 gap-4">
                <Field label={t("common.name")} value={selected.name} />
                <Field label="Distance" value={`${formatNum(selected.distanceKm)} km`} mono />
                <Field label="Est. hours" value={`${selected.estHours}h`} mono />
                <Field label="Actual hours" value={`${selected.actualHours}h`} mono />
                <Field label="On-time rate" value={`${selected.onTimeRate}%`} mono />
                <Field label="Active shipments" value={formatNum(selected.activeShipments)} mono />
              </dl>
              <Field label="Stops" value={selected.stops.map((s, i) => `${i + 1}. ${s}`).join(" — ")} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}