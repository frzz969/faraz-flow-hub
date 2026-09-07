import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Truck, Route as RouteIcon, Wrench, Gauge } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/farazz/page-header";
import { DataTable, type Column } from "@/components/farazz/data-table";
import { KpiCard, Field, ProgressBar } from "@/components/farazz/primitives";
import { StatusBadge } from "@/components/farazz/status-badge";
import { useData, useLookups, formatNum } from "@/lib/farazz/store";
import { useT } from "@/lib/i18n";
import type { Vehicle } from "@/lib/farazz/data";

export const Route = createFileRoute("/vehicles")({
  head: () => ({
    meta: [
      { title: "Vehicles — FARAZZ FLOW" },
      { name: "description", content: "Fleet vehicles, assignment, fuel and service status." },
    ],
  }),
  component: VehiclesPage,
});

function VehiclesPage() {
  const t = useT();
  const { db } = useData();
  const look = useLookups();
  const [selected, setSelected] = useState<Vehicle | null>(null);

  const onRoute = db.vehicles.filter((v) => v.status === "on_route").length;
  const idle = db.vehicles.filter((v) => v.status === "idle" || v.status === "available").length;
  const workshop = db.vehicles.filter((v) => v.status === "workshop").length;

  const columns: Column<Vehicle>[] = [
    { key: "code", header: "Code", value: (v) => v.code, className: "num", render: (v) => <span className="num font-medium text-foreground">{v.code}</span> },
    { key: "model", header: "Model", value: (v) => v.model },
    { key: "plate", header: "Plate", value: (v) => v.plate, className: "num", hideOnMobile: true },
    { key: "type", header: "Type", value: (v) => v.type, hideOnMobile: true },
    { key: "driver", header: t("common.driver"), value: (v) => (v.driverId ? look.driver[v.driverId]?.name ?? "—" : "Unassigned"), hideOnMobile: true },
    { key: "route", header: t("common.route"), value: (v) => (v.routeId ? look.route[v.routeId]?.code ?? "—" : "—"), className: "num", hideOnMobile: true },
    {
      key: "fuel",
      header: "Fuel",
      value: (v) => v.fuel,
      render: (v) => (
        <div className="flex w-24 items-center gap-2">
          <ProgressBar value={v.fuel} tone={v.fuel < 25 ? "critical" : v.fuel < 50 ? "warning" : "success"} />
          <span className="num text-xs text-muted-foreground">{v.fuel}%</span>
        </div>
      ),
      hideOnMobile: true,
    },
    { key: "status", header: t("common.status"), value: (v) => v.status, render: (v) => <StatusBadge value={v.status} /> },
  ];

  const statusOptions = Array.from(new Set(db.vehicles.map((v) => v.status))).map((v) => ({ value: v, label: t(`status.${v}`, v) }));

  return (
    <div className="mx-auto max-w-[104rem] space-y-5">
      <PageHeader
        title={t("nav.vehicles")}
        description="Fleet vehicles, assignment, fuel and service status."
        crumbs={[{ label: t("nav.fleet") }, { label: t("nav.vehicles") }]}
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <KpiCard label="Total vehicles" value={String(db.vehicles.length)} tone="info" icon={<Truck className="h-4 w-4" />} />
        <KpiCard label="On route" value={String(onRoute)} tone="info" icon={<RouteIcon className="h-4 w-4" />} />
        <KpiCard label="Available" value={String(idle)} tone="success" icon={<Gauge className="h-4 w-4" />} />
        <KpiCard label="In workshop" value={String(workshop)} tone="critical" icon={<Wrench className="h-4 w-4" />} />
      </div>

      <DataTable
        rows={db.vehicles}
        columns={columns}
        searchKeys={(v) => `${v.code} ${v.model} ${v.plate} ${v.type} ${look.driver[v.driverId ?? ""]?.name ?? ""}`}
        searchPlaceholder="Search code, model, plate…"
        filters={[{ id: "status", label: t("common.status"), options: statusOptions, accessor: (v) => v.status }]}
        onRowClick={setSelected}
      />

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="num">{selected.code}</span>
                  <StatusBadge value={selected.status} />
                </DialogTitle>
              </DialogHeader>
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Field label="Model" value={selected.model} />
                <Field label="Plate" value={selected.plate} mono />
                <Field label="Type" value={selected.type} />
                <Field label={t("common.driver")} value={selected.driverId ? look.driver[selected.driverId]?.name ?? "—" : "Unassigned"} />
                <Field label={t("common.route")} value={selected.routeId ? look.route[selected.routeId]?.code ?? "—" : "—"} mono />
                <Field label="Fuel" value={`${selected.fuel}%`} mono />
                <Field label="Next service" value={`${formatNum(selected.nextServiceKm)} km`} mono />
                <Field label={t("common.active")} value={selected.active ? "Yes" : "No"} />
              </dl>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}