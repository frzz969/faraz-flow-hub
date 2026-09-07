import { createFileRoute } from "@tanstack/react-router";
import { Landmark, CheckCircle2, Clock } from "lucide-react";
import { PageHeader } from "@/components/farazz/page-header";
import { DataTable, type Column } from "@/components/farazz/data-table";
import { KpiCard } from "@/components/farazz/primitives";
import { StatusBadge } from "@/components/farazz/status-badge";
import { useData, useLookups, formatIDR } from "@/lib/farazz/store";
import { useT } from "@/lib/i18n";
import type { Payment } from "@/lib/farazz/data";

export const Route = createFileRoute("/payments")({
  head: () => ({
    meta: [
      { title: "Payments — FARAZZ FLOW" },
      { name: "description", content: "Payment register and reconciliation status." },
    ],
  }),
  component: PaymentsPage,
});

function PaymentsPage() {
  const t = useT();
  const { db } = useData();
  const look = useLookups();

  const collected = db.payments.filter((p) => p.status === "paid").reduce((acc, p) => acc + p.amount, 0);
  const pending = db.payments.filter((p) => p.status === "pending").length;

  const columns: Column<Payment>[] = [
    { key: "code", header: "Code", value: (p) => p.code, className: "num", render: (p) => <span className="num font-medium text-foreground">{p.code}</span> },
    { key: "invoice", header: "Invoice", value: (p) => p.invoice, className: "num" },
    { key: "customer", header: t("common.customer"), value: (p) => look.customer[p.customerId]?.name ?? "—", render: (p) => <span className="font-medium text-foreground">{look.customer[p.customerId]?.name ?? "—"}</span> },
    { key: "method", header: "Method", value: (p) => p.method, hideOnMobile: true },
    { key: "amount", header: t("common.amount"), value: (p) => p.amount, render: (p) => <span className="num">{formatIDR(p.amount)}</span>, align: "right" },
    { key: "date", header: t("common.date"), value: (p) => p.date, hideOnMobile: true },
    { key: "status", header: t("common.status"), value: (p) => p.status, render: (p) => <StatusBadge value={p.status} /> },
  ];

  const statusOptions = Array.from(new Set(db.payments.map((p) => p.status))).map((v) => ({ value: v, label: t(`status.${v}`, v) }));

  return (
    <div className="mx-auto max-w-[104rem] space-y-5">
      <PageHeader
        title={t("nav.payments")}
        description="Payment register and reconciliation status."
        crumbs={[{ label: t("nav.finance") }, { label: t("nav.payments") }]}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Total payments" value={String(db.payments.length)} tone="info" icon={<Landmark className="h-4 w-4" />} />
        <KpiCard label="Collected" value={formatIDR(collected)} tone="success" icon={<CheckCircle2 className="h-4 w-4" />} />
        <KpiCard label="Pending" value={String(pending)} tone="warning" icon={<Clock className="h-4 w-4" />} />
      </div>

      <DataTable
        rows={db.payments}
        columns={columns}
        searchKeys={(p) => `${p.code} ${p.invoice} ${look.customer[p.customerId]?.name ?? ""} ${p.method}`}
        searchPlaceholder="Search code, invoice, customer…"
        filters={[{ id: "status", label: t("common.status"), options: statusOptions, accessor: (p) => p.status }]}
      />
    </div>
  );
}