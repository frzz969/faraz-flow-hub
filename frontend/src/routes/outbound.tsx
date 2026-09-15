import { createFileRoute } from "@tanstack/react-router";
import { Archive, Send, Boxes, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/farazz/page-header";
import { DataTable, type Column } from "@/components/farazz/data-table";
import { KpiCard } from "@/components/farazz/primitives";
import { StatusBadge } from "@/components/farazz/status-badge";
import { ExportButton } from "@/components/farazz/export-button";
import { useData, useLookups, formatNum } from "@/lib/farazz/store";
import { useT } from "@/lib/i18n";
import type { OutboundRec } from "@/lib/farazz/data";

export const Route = createFileRoute("/outbound")({
  head: () => ({
    meta: [
      { title: "Outbound — FARAZZ FLOW" },
      { name: "description", content: "Outbound waves, loading and dispatch across hubs." },
    ],
  }),
  component: OutboundPage,
});

function OutboundPage() {
  const t = useT();
  const { db, update } = useData();
  const look = useLookups();

  const picking = db.outbound.filter((o) => o.status === "picking").length;
  const loaded = db.outbound.filter((o) => o.status === "loaded").length;
  const dispatched = db.outbound.filter((o) => o.status === "dispatched").length;

  const columns: Column<OutboundRec>[] = [
    { key: "code", header: "Code", value: (o) => o.code, className: "num" },
    { key: "warehouse", header: t("common.warehouse"), value: (o) => look.warehouse[o.warehouseId]?.code ?? "—", render: (o) => <span className="font-medium text-foreground">{look.warehouse[o.warehouseId]?.name ?? "—"}</span> },
    { key: "destination", header: t("common.destination"), value: (o) => o.destination, hideOnMobile: true },
    { key: "shipments", header: "Shipments", value: (o) => o.shipments, render: (o) => <span className="num">{formatNum(o.shipments)}</span>, align: "right", hideOnMobile: true },
    { key: "packages", header: "Packages", value: (o) => o.packages, render: (o) => <span className="num">{formatNum(o.packages)}</span>, align: "right", hideOnMobile: true },
    { key: "vehicle", header: t("common.vehicle"), value: (o) => look.vehicle[o.vehicleId]?.code ?? "—", render: (o) => <span className="num">{look.vehicle[o.vehicleId]?.code ?? "—"}</span> },
    { key: "dispatchTime", header: "Dispatch", value: (o) => o.dispatchTime, className: "num", hideOnMobile: true },
    { key: "status", header: t("common.status"), value: (o) => o.status, render: (o) => <StatusBadge value={o.status} /> },
  ];

  const statusOptions = Array.from(new Set(db.outbound.map((o) => o.status))).map((v) => ({ value: v, label: t(`status.${v}`, v) }));

  return (
    <div className="mx-auto max-w-[104rem] space-y-5">
      <PageHeader
        title={t("nav.outbound")}
        description="Outbound waves, loading and dispatch across hubs."
        crumbs={[{ label: t("nav.warehouse") }, { label: t("nav.outbound") }]}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Total waves" value={String(db.outbound.length)} tone="info" icon={<Archive className="h-4 w-4" />} />
        <KpiCard label="Picking/Packing" value={String(picking)} tone="warning" icon={<Boxes className="h-4 w-4" />} />
        <KpiCard label="Dispatched" value={String(dispatched + loaded)} tone="success" icon={<Send className="h-4 w-4" />} />
      </div>

      <DataTable
        rows={db.outbound}
        columns={columns}
        searchKeys={(o) => `${o.code} ${look.warehouse[o.warehouseId]?.name ?? ""} ${o.destination} ${look.vehicle[o.vehicleId]?.code ?? ""}`}
        searchPlaceholder="Search code, warehouse, destination…"
        filters={[{ id: "status", label: t("common.status"), options: statusOptions, accessor: (o) => o.status }]}
        toolbarExtra={
          <ExportButton
            rows={db.outbound}
            columns={[
              { key: "code", header: "Code", value: (o) => o.code },
              { key: "warehouse", header: "Warehouse", value: (o) => look.warehouse[o.warehouseId]?.code ?? "" },
              { key: "destination", header: "Destination", value: (o) => o.destination },
              { key: "shipments", header: "Shipments", value: (o) => o.shipments },
              { key: "packages", header: "Packages", value: (o) => o.packages },
              { key: "vehicle", header: "Vehicle", value: (o) => look.vehicle[o.vehicleId]?.code ?? "" },
              { key: "status", header: "Status", value: (o) => o.status },
            ]}
            filename="outbound.csv"
          />
        }
        rowActions={(o) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
              disabled={o.status === "dispatched"}
              onClick={() => {
                const order = ["picking", "packing", "loaded", "dispatched"];
                const next = order[Math.min(order.indexOf(o.status) + 1, order.length - 1)];
                update("outbound", o.id, { status: next }, o.code);
                toast.success(`Outbound ${o.code} advanced to ${next}.`);
              }}
            >
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              Advance
            </Button>
          </div>
        )}
      />
    </div>
  );
}