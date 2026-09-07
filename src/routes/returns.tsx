import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeftRight, RotateCcw, RefreshCcw } from "lucide-react";
import { PageHeader } from "@/components/farazz/page-header";
import { DataTable, type Column } from "@/components/farazz/data-table";
import { KpiCard } from "@/components/farazz/primitives";
import { StatusBadge } from "@/components/farazz/status-badge";
import { useData, useLookups } from "@/lib/farazz/store";
import { useT } from "@/lib/i18n";
import type { ReturnRec } from "@/lib/farazz/data";

export const Route = createFileRoute("/returns")({
  head: () => ({
    meta: [
      { title: "Returns — FARAZZ FLOW" },
      { name: "description", content: "Manage return requests, inspections and resolutions." },
    ],
  }),
  component: ReturnsPage,
});

function ReturnsPage() {
  const t = useT();
  const { db } = useData();
  const look = useLookups();

  const requested = db.returns.filter((r) => r.status === "requested").length;
  const inspection = db.returns.filter((r) => r.status === "inspection").length;
  const completed = db.returns.filter((r) => r.status === "completed").length;

  const columns: Column<ReturnRec>[] = [
    { key: "code", header: "Code", value: (r) => r.code, className: "num" },
    { key: "shipment", header: "Shipment", value: (r) => r.shipment, render: (r) => <span className="num">{r.shipment}</span> },
    {
      key: "customer",
      header: t("common.customer"),
      value: (r) => look.customer[r.customerId]?.name ?? "—",
      render: (r) => <span className="font-medium text-foreground">{look.customer[r.customerId]?.name ?? "—"}</span>,
    },
    { key: "reason", header: t("common.reason"), value: (r) => r.reason, className: "max-w-[16rem] truncate" },
    { key: "condition", header: "Condition", value: (r) => r.condition, hideOnMobile: true },
    { key: "resolution", header: t("common.resolution"), value: (r) => r.resolution, hideOnMobile: true },
    { key: "status", header: t("common.status"), value: (r) => r.status, render: (r) => <StatusBadge value={r.status} /> },
    { key: "date", header: t("common.date"), value: (r) => r.date, hideOnMobile: true },
  ];

  const statusOptions = Array.from(new Set(db.returns.map((r) => r.status))).map((v) => ({ value: v, label: t(`status.${v}`, v) }));

  return (
    <div className="mx-auto max-w-[104rem] space-y-5">
      <PageHeader
        title={t("nav.returns")}
        description="Manage return requests, inspections and resolutions."
        crumbs={[{ label: t("nav.operations") }, { label: t("nav.returns") }]}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Requested" value={String(requested)} tone="warning" icon={<RefreshCcw className="h-4 w-4" />} />
        <KpiCard label="In inspection" value={String(inspection)} tone="warning" icon={<ArrowLeftRight className="h-4 w-4" />} />
        <KpiCard label="Completed" value={String(completed)} tone="success" icon={<RotateCcw className="h-4 w-4" />} />
      </div>

      <DataTable
        rows={db.returns}
        columns={columns}
        searchKeys={(r) => `${r.code} ${r.shipment} ${look.customer[r.customerId]?.name ?? ""} ${r.reason}`}
        searchPlaceholder="Search code, shipment, reason…"
        filters={[{ id: "status", label: t("common.status"), options: statusOptions, accessor: (r) => r.status }]}
      />
    </div>
  );
}