import { createFileRoute } from "@tanstack/react-router";
import { ClipboardCheck, Package, CircleDollarSign } from "lucide-react";
import { PageHeader } from "@/components/farazz/page-header";
import { DataTable, type Column } from "@/components/farazz/data-table";
import { KpiCard } from "@/components/farazz/primitives";
import { StatusBadge } from "@/components/farazz/status-badge";
import { useData, useLookups, formatIDR } from "@/lib/farazz/store";
import { useT } from "@/lib/i18n";
import type { Order } from "@/lib/farazz/data";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "Orders — FARAZZ FLOW" },
      { name: "description", content: "Manage customer orders and their fulfillment status." },
    ],
  }),
  component: OrdersPage,
});

function OrdersPage() {
  const t = useT();
  const { db } = useData();
  const look = useLookups();

  const paid = db.orders.filter((o) => o.payment === "paid").length;
  const unpaid = db.orders.filter((o) => o.payment === "unpaid").length;
  const dispatched = db.orders.filter((o) => o.status === "dispatched" || o.status === "completed").length;

  const columns: Column<Order>[] = [
    { key: "code", header: "Code", value: (o) => o.code, className: "num" },
    {
      key: "customer",
      header: t("common.customer"),
      value: (o) => look.customer[o.customerId]?.name ?? "—",
      render: (o) => <span className="font-medium text-foreground">{look.customer[o.customerId]?.name ?? "—"}</span>,
    },
    { key: "origin", header: t("common.origin"), value: (o) => o.origin, hideOnMobile: true },
    { key: "destination", header: t("common.destination"), value: (o) => o.destination, hideOnMobile: true },
    { key: "packages", header: "Packages", value: (o) => o.packages, render: (o) => <span className="num">{o.packages}</span>, align: "right", hideOnMobile: true },
    { key: "amount", header: "Amount", value: (o) => o.amount, render: (o) => <span className="num">{formatIDR(o.amount)}</span>, align: "right" },
    { key: "payment", header: "Payment", value: (o) => o.payment, render: (o) => <StatusBadge value={o.payment} /> },
    { key: "status", header: t("common.status"), value: (o) => o.status, render: (o) => <StatusBadge value={o.status} /> },
    { key: "date", header: t("common.date"), value: (o) => o.date, hideOnMobile: true },
  ];

  const statusOptions = Array.from(new Set(db.orders.map((o) => o.status))).map((v) => ({ value: v, label: t(`status.${v}`, v) }));

  return (
    <div className="mx-auto max-w-[104rem] space-y-5">
      <PageHeader
        title={t("nav.orders")}
        description="Manage customer orders and their fulfillment status."
        crumbs={[{ label: t("nav.operations") }, { label: t("nav.orders") }]}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Total orders" value={String(db.orders.length)} tone="info" icon={<ClipboardCheck className="h-4 w-4" />} />
        <KpiCard label="Paid" value={String(paid)} tone="success" icon={<CircleDollarSign className="h-4 w-4" />} />
        <KpiCard label="Unpaid" value={String(unpaid)} tone="warning" icon={<Package className="h-4 w-4" />} />
      </div>

      <DataTable
        rows={db.orders}
        columns={columns}
        searchKeys={(o) => `${o.code} ${look.customer[o.customerId]?.name ?? ""} ${o.shipment} ${o.destination}`}
        searchPlaceholder="Search code, customer, shipment…"
        filters={[{ id: "status", label: t("common.status"), options: statusOptions, accessor: (o) => o.status }]}
      />
    </div>
  );
}
