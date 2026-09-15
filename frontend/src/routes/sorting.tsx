import { createFileRoute } from "@tanstack/react-router";
import { LayoutGrid, Zap, Timer, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/farazz/page-header";
import { DataTable, type Column } from "@/components/farazz/data-table";
import { KpiCard } from "@/components/farazz/primitives";
import { StatusBadge } from "@/components/farazz/status-badge";
import { ExportButton } from "@/components/farazz/export-button";
import { useData, useLookups } from "@/lib/farazz/store";
import { useT } from "@/lib/i18n";
import type { SortingRec } from "@/lib/farazz/data";

export const Route = createFileRoute("/sorting")({
  head: () => ({
    meta: [
      { title: "Sorting — FARAZZ FLOW" },
      { name: "description", content: "Sorting zones, scan flow and hub throughput." },
    ],
  }),
  component: SortingPage,
});

function SortingPage() {
  const t = useT();
  const { db, update } = useData();
  const look = useLookups();

  const high = db.sorting.filter((s) => s.priority === "high").length;
  const scanning = db.sorting.filter((s) => s.status === "scanning").length;
  const sorted = db.sorting.filter((s) => s.status === "sorting").length;

  const columns: Column<SortingRec>[] = [
    { key: "code", header: "Code", value: (s) => s.code, className: "num" },
    { key: "shipment", header: "Shipment", value: (s) => s.shipment, render: (s) => <span className="num">{s.shipment}</span> },
    { key: "warehouse", header: t("common.warehouse"), value: (s) => look.warehouse[s.warehouseId]?.code ?? "—", hideOnMobile: true },
    { key: "zone", header: "Zone", value: (s) => s.zone, hideOnMobile: true },
    { key: "destination", header: t("common.destination"), value: (s) => s.destination, hideOnMobile: true },
    { key: "priority", header: t("common.priority"), value: (s) => s.priority, render: (s) => <StatusBadge value={s.priority} /> },
    { key: "status", header: t("common.status"), value: (s) => s.status, render: (s) => <StatusBadge value={s.status} /> },
  ];

  const statusOptions = Array.from(new Set(db.sorting.map((s) => s.status))).map((v) => ({ value: v, label: t(`status.${v}`, v) }));
  const priorityOptions = ["high", "medium", "low"].map((v) => ({ value: v, label: t(`status.${v}`, v) }));

  return (
    <div className="mx-auto max-w-[104rem] space-y-5">
      <PageHeader
        title={t("nav.sorting")}
        description="Sorting zones, scan flow and hub throughput."
        crumbs={[{ label: t("nav.warehouse") }, { label: t("nav.sorting") }]}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Total items" value={String(db.sorting.length)} tone="info" icon={<LayoutGrid className="h-4 w-4" />} />
        <KpiCard label="High priority" value={String(high)} tone="critical" icon={<Zap className="h-4 w-4" />} />
        <KpiCard label="Sorting now" value={String(sorted)} tone="warning" icon={<Timer className="h-4 w-4" />} />
      </div>

      <DataTable
        rows={db.sorting}
        columns={columns}
        searchKeys={(s) => `${s.code} ${s.shipment} ${s.zone} ${s.destination} ${s.nextHub}`}
        searchPlaceholder="Search code, shipment, zone…"
        filters={[
          { id: "status", label: t("common.status"), options: statusOptions, accessor: (s) => s.status },
          { id: "priority", label: t("common.priority"), options: priorityOptions, accessor: (s) => s.priority },
        ]}
        toolbarExtra={
          <ExportButton
            rows={db.sorting}
            columns={[
              { key: "code", header: "Code", value: (s) => s.code },
              { key: "shipment", header: "Shipment", value: (s) => s.shipment },
              { key: "warehouse", header: "Warehouse", value: (s) => look.warehouse[s.warehouseId]?.code ?? "" },
              { key: "zone", header: "Zone", value: (s) => s.zone },
              { key: "destination", header: "Destination", value: (s) => s.destination },
              { key: "priority", header: "Priority", value: (s) => s.priority },
              { key: "status", header: "Status", value: (s) => s.status },
            ]}
            filename="sorting.csv"
          />
        }
        rowActions={(s) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
              disabled={s.status === "dispatched"}
              onClick={() => {
                const order = ["scanning", "sorting", "dispatched"];
                const next = order[Math.min(order.indexOf(s.status) + 1, order.length - 1)];
                update("sorting", s.id, { status: next }, s.code);
                toast.success(`Sorting item ${s.code} advanced to ${next}.`);
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