import { createFileRoute } from "@tanstack/react-router";
import { CreditCard, CheckCheck, HandCoins } from "lucide-react";
import { PageHeader } from "@/components/farazz/page-header";
import { DataTable, type Column } from "@/components/farazz/data-table";
import { KpiCard } from "@/components/farazz/primitives";
import { StatusBadge } from "@/components/farazz/status-badge";
import { useData, useLookups, formatIDR } from "@/lib/farazz/store";
import { useT } from "@/lib/i18n";
import type { CodRec } from "@/lib/farazz/data";

export const Route = createFileRoute("/cod")({
  head: () => ({
    meta: [
      { title: "COD — FARAZZ FLOW" },
      { name: "description", content: "Cash-on-delivery collections and remittance tracking." },
    ],
  }),
  component: CodPage,
});

function CodPage() {
  const t = useT();
  const { db } = useData();
  const look = useLookups();

  const pendingValue = db.cods.filter((c) => c.status === "pending").reduce((acc, c) => acc + c.amount, 0);
  const remitted = db.cods.filter((c) => c.status === "remitted").length;

  const columns: Column<CodRec>[] = [
    { key: "code", header: "Code", value: (c) => c.code, className: "num", render: (c) => <span className="num font-medium text-foreground">{c.code}</span> },
    { key: "shipment", header: "Shipment", value: (c) => c.shipment, className: "num" },
    { key: "customer", header: t("common.customer"), value: (c) => look.customer[c.customerId]?.name ?? "—", render: (c) => <span className="font-medium text-foreground">{look.customer[c.customerId]?.name ?? "—"}</span> },
    { key: "amount", header: t("common.amount"), value: (c) => c.amount, render: (c) => <span className="num">{formatIDR(c.amount)}</span>, align: "right" },
    { key: "collected", header: "Collected", value: (c) => c.collected, hideOnMobile: true },
    { key: "driver", header: t("common.driver"), value: (c) => look.driver[c.driverId]?.name ?? "—", hideOnMobile: true },
    { key: "status", header: t("common.status"), value: (c) => c.status, render: (c) => <StatusBadge value={c.status} /> },
  ];

  const statusOptions = Array.from(new Set(db.cods.map((c) => c.status))).map((v) => ({ value: v, label: t(`status.${v}`, v) }));

  return (
    <div className="mx-auto max-w-[104rem] space-y-5">
      <PageHeader
        title={t("nav.cod")}
        description="Cash-on-delivery collections and remittance tracking."
        crumbs={[{ label: t("nav.finance") }, { label: t("nav.cod") }]}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Total COD" value={String(db.cods.length)} tone="info" icon={<CreditCard className="h-4 w-4" />} />
        <KpiCard label="Pending value" value={formatIDR(pendingValue)} tone="warning" icon={<HandCoins className="h-4 w-4" />} />
        <KpiCard label="Remitted" value={String(remitted)} tone="success" icon={<CheckCheck className="h-4 w-4" />} />
      </div>

      <DataTable
        rows={db.cods}
        columns={columns}
        searchKeys={(c) => `${c.code} ${c.shipment} ${look.customer[c.customerId]?.name ?? ""}`}
        searchPlaceholder="Search code, shipment, customer…"
        filters={[{ id: "status", label: t("common.status"), options: statusOptions, accessor: (c) => c.status }]}
      />
    </div>
  );
}