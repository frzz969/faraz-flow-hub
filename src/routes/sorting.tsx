import { createFileRoute } from "@tanstack/react-router";
import { LayoutGrid, Zap, Timer } from "lucide-react";
import { PageHeader } from "@/components/farazz/page-header";
import { DataTable, type Column } from "@/components/farazz/data-table";
import { KpiCard } from "@/components/farazz/primitives";
import { StatusBadge } from "@/components/farazz/status-badge";
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
  const { db } = useData();
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
      />
    </div>
  );
}