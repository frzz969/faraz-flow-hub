import { createFileRoute } from "@tanstack/react-router";
import { CreditCard, AlertCircle, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/farazz/page-header";
import { DataTable, type Column } from "@/components/farazz/data-table";
import { KpiCard } from "@/components/farazz/primitives";
import { StatusBadge } from "@/components/farazz/status-badge";
import { useData, useLookups, formatIDR } from "@/lib/farazz/store";
import { useT } from "@/lib/i18n";
import type { Invoice } from "@/lib/farazz/data";

export const Route = createFileRoute("/billing")({
  head: () => ({
    meta: [
      { title: "Billing — FARAZZ FLOW" },
      { name: "description", content: "Billing overview across all customer invoices." },
    ],
  }),
  component: BillingPage,
});

function BillingPage() {
  const t = useT();
  const { db } = useData();
  const look = useLookups();

  const total = db.invoices.reduce((acc, i) => acc + i.total, 0);
  const unpaid = db.invoices.filter((i) => i.status === "unpaid" || i.status === "overdue").reduce((acc, i) => acc + i.total, 0);
  const overdue = db.invoices.filter((i) => i.status === "overdue").length;

  const columns: Column<Invoice>[] = [
    { key: "code", header: "Code", value: (i) => i.code, className: "num", render: (i) => <span className="num font-medium text-foreground">{i.code}</span> },
    { key: "customer", header: t("common.customer"), value: (i) => look.customer[i.customerId]?.name ?? "—", render: (i) => <span className="font-medium text-foreground">{look.customer[i.customerId]?.name ?? "—"}</span> },
    { key: "issued", header: "Issued", value: (i) => i.issued, hideOnMobile: true },
    { key: "due", header: "Due", value: (i) => i.due, hideOnMobile: true },
    { key: "total", header: "Total", value: (i) => i.total, render: (i) => <span className="num">{formatIDR(i.total)}</span>, align: "right" },
    { key: "status", header: t("common.status"), value: (i) => i.status, render: (i) => <StatusBadge value={i.status} /> },
  ];

  const statusOptions = Array.from(new Set(db.invoices.map((i) => i.status))).map((v) => ({ value: v, label: t(`status.${v}`, v) }));

  return (
    <div className="mx-auto max-w-[104rem] space-y-5">
      <PageHeader
        title={t("nav.billing")}
        description="Billing overview across all customer invoices."
        crumbs={[{ label: t("nav.finance") }, { label: t("nav.billing") }]}
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <KpiCard label="Total billed" value={formatIDR(total)} tone="info" icon={<CreditCard className="h-4 w-4" />} />
        <KpiCard label="Outstanding" value={formatIDR(unpaid)} tone="warning" icon={<CreditCard className="h-4 w-4" />} />
        <KpiCard label="Overdue" value={String(overdue)} tone="critical" icon={<AlertCircle className="h-4 w-4" />} />
        <KpiCard label="Paid invoices" value={String(db.invoices.filter((i) => i.status === "paid").length)} tone="success" icon={<CheckCircle2 className="h-4 w-4" />} />
      </div>

      <DataTable
        rows={db.invoices}
        columns={columns}
        searchKeys={(i) => `${i.code} ${look.customer[i.customerId]?.name ?? ""}`}
        searchPlaceholder="Search code, customer…"
        filters={[{ id: "status", label: t("common.status"), options: statusOptions, accessor: (i) => i.status }]}
      />
    </div>
  );
}