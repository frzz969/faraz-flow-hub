import { createFileRoute } from "@tanstack/react-router";
import { Gauge, Send, Truck } from "lucide-react";
import { PageHeader } from "@/components/farazz/page-header";
import { DataTable, type Column } from "@/components/farazz/data-table";
import { KpiCard } from "@/components/farazz/primitives";
import { StatusBadge } from "@/components/farazz/status-badge";
import { useData, useLookups, formatNum } from "@/lib/farazz/store";
import { useT } from "@/lib/i18n";
import type { OutboundRec } from "@/lib/farazz/data";

export const Route = createFileRoute("/dispatch")({
  head: () => ({
    meta: [
      { title: "Dispatch — FARAZZ FLOW" },
      { name: "description", content: "Dispatch board for outbound waves, vehicles and drivers." },
    ],
  }),
  component: DispatchPage,
});

function DispatchPage() {
  const t = useT();
  const { db } = useData();
  const look = useLookups();

  const dispatched = db.outbound.filter((o) => o.status === "dispatched").length;
  const loaded = db.outbound.filter((o) => o.status === "loaded").length;
  const inProgress = db.outbound.filter((o) => o.status === "picking" || o.status === "packing").length;

  const columns: Column<OutboundRec>[] = [
    { key: "code", header: "Wave", value: (o) => o.code, className: "num", render: (o) => <span className="num font-medium text-foreground">{o.code}</span> },
    { key: "warehouse", header: t("common.warehouse"), value: (o) => look.warehouse[o.warehouseId]?.code ?? "—" },
    { key: "destination", header: t("common.destination"), value: (o) => o.destination, hideOnMobile: true },
    { key: "vehicle", header: t("common.vehicle"), value: (o) => look.vehicle[o.vehicleId]?.code ?? "—", className: "num" },
    { key: "driver", header: t("common.driver"), value: (o) => look.driver[o.driverId]?.name ?? "—", hideOnMobile: true },
    { key: "dispatchTime", header: "Dispatch time", value: (o) => o.dispatchTime, className: "num" },
    { key: "shipments", header: "Shipments", value: (o) => o.shipments, render: (o) => <span className="num">{formatNum(o.shipments)}</span>, align: "right", hideOnMobile: true },
    { key: "status", header: t("common.status"), value: (o) => o.status, render: (o) => <StatusBadge value={o.status} /> },
  ];

  const statusOptions = Array.from(new Set(db.outbound.map((o) => o.status))).map((v) => ({ value: v, label: t(`status.${v}`, v) }));

  return (
    <div className="mx-auto max-w-[104rem] space-y-5">
      <PageHeader
        title={t("nav.dispatch")}
        description="Dispatch board for outbound waves, vehicles and drivers."
        crumbs={[{ label: t("nav.fleet") }, { label: t("nav.dispatch") }]}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Total waves" value={String(db.outbound.length)} tone="info" icon={<Gauge className="h-4 w-4" />} />
        <KpiCard label="In progress" value={String(inProgress)} tone="warning" icon={<Truck className="h-4 w-4" />} />
        <KpiCard label="Dispatched" value={String(dispatched)} tone="success" icon={<Send className="h-4 w-4" />} />
      </div>

      <DataTable
        rows={db.outbound}
        columns={columns}
        searchKeys={(o) => `${o.code} ${look.warehouse[o.warehouseId]?.name ?? ""} ${o.destination} ${look.vehicle[o.vehicleId]?.code ?? ""}`}
        searchPlaceholder="Search wave, warehouse, vehicle…"
        filters={[{ id: "status", label: t("common.status"), options: statusOptions, accessor: (o) => o.status }]}
      />
    </div>
  );
}