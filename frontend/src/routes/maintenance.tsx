import { createFileRoute } from "@tanstack/react-router";
import { Wrench, Fuel, Truck } from "lucide-react";
import { PageHeader } from "@/components/farazz/page-header";
import { DataTable, type Column } from "@/components/farazz/data-table";
import { KpiCard, ProgressBar } from "@/components/farazz/primitives";
import { StatusBadge } from "@/components/farazz/status-badge";
import { useData, formatNum } from "@/lib/farazz/store";
import { useT } from "@/lib/i18n";
import type { Vehicle } from "@/lib/farazz/data";

export const Route = createFileRoute("/maintenance")({
  head: () => ({
    meta: [
      { title: "Maintenance — FARAZZ FLOW" },
      { name: "description", content: "Vehicle maintenance, service intervals and fuel health." },
    ],
  }),
  component: MaintenancePage,
});

function MaintenancePage() {
  const t = useT();
  const { db } = useData();

  const inWorkshop = db.vehicles.filter((v) => v.status === "workshop").length;
  const lowFuel = db.vehicles.filter((v) => v.fuel < 25).length;
  const dueService = db.vehicles.filter((v) => v.nextServiceKm > 0 && v.nextServiceKm < 1000).length;

  const columns: Column<Vehicle>[] = [
    { key: "code", header: "Code", value: (v) => v.code, className: "num", render: (v) => <span className="num font-medium text-foreground">{v.code}</span> },
    { key: "model", header: "Model", value: (v) => v.model },
    { key: "plate", header: "Plate", value: (v) => v.plate, className: "num", hideOnMobile: true },
    { key: "type", header: "Type", value: (v) => v.type, hideOnMobile: true },
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
    {
      key: "nextService",
      header: "Next service",
      value: (v) => v.nextServiceKm,
      render: (v) => (v.nextServiceKm === 0 ? <span className="text-xs">In service</span> : <span className="num">{formatNum(v.nextServiceKm)} km{v.nextServiceKm < 1000 ? " · due" : ""}</span>),
    },
    { key: "status", header: t("common.status"), value: (v) => v.status, render: (v) => <StatusBadge value={v.status} /> },
  ];

  return (
    <div className="mx-auto max-w-[104rem] space-y-5">
      <PageHeader
        title={t("nav.maintenance")}
        description="Vehicle maintenance, service intervals and fuel health."
        crumbs={[{ label: t("nav.fleet") }, { label: t("nav.maintenance") }]}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="In workshop" value={String(inWorkshop)} tone="critical" icon={<Wrench className="h-4 w-4" />} />
        <KpiCard label="Low fuel (<25%)" value={String(lowFuel)} tone="warning" icon={<Fuel className="h-4 w-4" />} />
        <KpiCard label="Service due soon" value={String(dueService)} tone="warning" icon={<Truck className="h-4 w-4" />} />
      </div>

      <DataTable
        rows={db.vehicles}
        columns={columns}
        searchKeys={(v) => `${v.code} ${v.model} ${v.plate} ${v.status}`}
        searchPlaceholder="Search code, model, plate…"
      />
    </div>
  );
}