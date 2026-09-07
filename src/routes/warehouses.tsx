import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Warehouse as WarehouseIcon, TriangleAlert, AlertOctagon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/farazz/page-header";
import { DataTable, type Column } from "@/components/farazz/data-table";
import { KpiCard, Field, ProgressBar } from "@/components/farazz/primitives";
import { StatusBadge } from "@/components/farazz/status-badge";
import { useData, formatNum } from "@/lib/farazz/store";
import { useT } from "@/lib/i18n";
import type { Warehouse } from "@/lib/farazz/data";

export const Route = createFileRoute("/warehouses")({
  head: () => ({
    meta: [
      { title: "Warehouses — FARAZZ FLOW" },
      { name: "description", content: "Manage warehouse hubs, capacity and operational status." },
    ],
  }),
  component: WarehousesPage,
});

function WarehousesPage() {
  const t = useT();
  const { db } = useData();
  const [selected, setSelected] = useState<Warehouse | null>(null);

  const congested = db.warehouses.filter((w) => w.status === "congested").length;
  const critical = db.warehouses.filter((w) => w.status === "critical").length;

  const columns: Column<Warehouse>[] = [
    { key: "code", header: "Code", value: (w) => w.code, className: "num" },
    { key: "name", header: t("common.name"), value: (w) => w.name, render: (w) => <span className="font-medium text-foreground">{w.name}</span> },
    { key: "city", header: "City", value: (w) => w.city, hideOnMobile: true },
    {
      key: "util",
      header: t("common.utilization"),
      value: (w) => Math.round((w.used / w.capacity) * 100),
      render: (w) => {
        const pct = Math.round((w.used / w.capacity) * 100);
        return (
          <div className="flex w-28 items-center gap-2">
            <ProgressBar value={pct} tone={pct > 88 ? "critical" : pct > 70 ? "warning" : "primary"} />
            <span className="num text-xs text-muted-foreground">{pct}%</span>
          </div>
        );
      },
    },
    { key: "capacity", header: t("common.capacity"), value: (w) => w.capacity, render: (w) => <span className="num">{formatNum(w.capacity)}</span>, align: "right", hideOnMobile: true },
    { key: "status", header: t("common.status"), value: (w) => w.status, render: (w) => <StatusBadge value={w.status} /> },
  ];

  return (
    <div className="mx-auto max-w-[104rem] space-y-5">
      <PageHeader
        title={t("nav.warehouses")}
        description="Manage warehouse hubs, capacity and operational status."
        crumbs={[{ label: t("nav.warehouse") }, { label: t("nav.warehouses") }]}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Total hubs" value={String(db.warehouses.length)} tone="info" icon={<WarehouseIcon className="h-4 w-4" />} />
        <KpiCard label="Congested" value={String(congested)} tone="warning" icon={<TriangleAlert className="h-4 w-4" />} />
        <KpiCard label="Critical" value={String(critical)} tone="critical" icon={<AlertOctagon className="h-4 w-4" />} />
      </div>

      <DataTable
        rows={db.warehouses}
        columns={columns}
        searchKeys={(w) => `${w.code} ${w.name} ${w.city} ${w.region}`}
        searchPlaceholder="Search code, name, city…"
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
                <Field label={t("common.name")} value={selected.name} />
                <Field label="City" value={selected.city} />
                <Field label="Region" value={selected.region} />
                <Field label={t("common.capacity")} value={formatNum(selected.capacity)} mono />
                <Field label="Used" value={formatNum(selected.used)} mono />
                <Field label={t("common.utilization")} value={`${Math.round((selected.used / selected.capacity) * 100)}%`} mono />
              </dl>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Field label="Inbound" value={formatNum(selected.inbound)} mono />
                <Field label="Sorting" value={formatNum(selected.sorting)} mono />
                <Field label="Outbound" value={formatNum(selected.outbound)} mono />
                <Field label="Waiting" value={formatNum(selected.waiting)} mono />
                <Field label="Delayed" value={formatNum(selected.delayed)} mono />
                <Field label={t("common.active")} value={selected.active ? "Yes" : "No"} />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}