import { createFileRoute } from "@tanstack/react-router";
import { FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/farazz/page-header";
import { DataTable, type Column } from "@/components/farazz/data-table";
import { KpiCard } from "@/components/farazz/primitives";
import { StatusBadge } from "@/components/farazz/status-badge";
import { useData, useLookups, formatIDR } from "@/lib/farazz/store";
import { useT } from "@/lib/i18n";
import type { ContractRec } from "@/lib/farazz/data";

export const Route = createFileRoute("/contracts")({
  head: () => ({
    meta: [
      { title: "Contracts — FARAZZ FLOW" },
      { name: "description", content: "Service contracts with customers and their terms." },
    ],
  }),
  component: ContractsPage,
});

function ContractsPage() {
  const t = useT();
  const { db } = useData();
  const look = useLookups();

  const active = db.contracts.filter((c) => c.status === "active").length;
  const totalValue = db.contracts.filter((c) => c.status === "active").reduce((acc, c) => acc + c.value, 0);

  const columns: Column<ContractRec>[] = [
    { key: "code", header: "Code", value: (c) => c.code, className: "num", render: (c) => <span className="num font-medium text-foreground">{c.code}</span> },
    { key: "customer", header: t("common.customer"), value: (c) => look.customer[c.customerId]?.name ?? "—", render: (c) => <span className="font-medium text-foreground">{look.customer[c.customerId]?.name ?? "—"}</span> },
    { key: "service", header: t("common.service"), value: (c) => look.service[c.serviceId]?.name ?? "—", hideOnMobile: true },
    { key: "start", header: "Start", value: (c) => c.start, hideOnMobile: true },
    { key: "end", header: "End", value: (c) => c.end, hideOnMobile: true },
    { key: "value", header: "Value", value: (c) => c.value, render: (c) => <span className="num">{formatIDR(c.value)}</span>, align: "right" },
    { key: "status", header: t("common.status"), value: (c) => c.status, render: (c) => <StatusBadge value={c.status} /> },
  ];

  const statusOptions = Array.from(new Set(db.contracts.map((c) => c.status))).map((v) => ({ value: v, label: t(`status.${v}`, v) }));

  return (
    <div className="mx-auto max-w-[104rem] space-y-5">
      <PageHeader
        title={t("nav.contracts")}
        description="Service contracts with customers and their terms."
        crumbs={[{ label: t("nav.business") }, { label: t("nav.contracts") }]}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Active contracts" value={String(active)} tone="success" icon={<CheckCircle2 className="h-4 w-4" />} />
        <KpiCard label="Total value" value={formatIDR(totalValue)} tone="info" icon={<FileText className="h-4 w-4" />} />
        <KpiCard label="Pending / other" value={String(db.contracts.length - active)} tone="warning" icon={<AlertCircle className="h-4 w-4" />} />
      </div>

      <DataTable
        rows={db.contracts}
        columns={columns}
        searchKeys={(c) => `${c.code} ${look.customer[c.customerId]?.name ?? ""} ${look.service[c.serviceId]?.name ?? ""}`}
        searchPlaceholder="Search code, customer, service…"
        filters={[{ id: "status", label: t("common.status"), options: statusOptions, accessor: (c) => c.status }]}
      />
    </div>
  );
}