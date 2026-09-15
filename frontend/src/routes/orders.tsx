import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ClipboardCheck, Package, CircleDollarSign, Plus, CheckCircle2, Banknote } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/farazz/page-header";
import { DataTable, type Column } from "@/components/farazz/data-table";
import { KpiCard } from "@/components/farazz/primitives";
import { StatusBadge } from "@/components/farazz/status-badge";
import { ExportButton } from "@/components/farazz/export-button";
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
  const navigate = useNavigate();
  const { db, update } = useData();
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
        actions={
          <Button size="sm" onClick={() => navigate({ to: "/shipments-create" })} className="gap-1.5">
            <Plus className="h-4 w-4" /> New Order
          </Button>
        }
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
        toolbarExtra={
          <ExportButton
            rows={db.orders}
            columns={[
              { key: "code", header: "Code", value: (o) => o.code },
              { key: "customer", header: "Customer", value: (o) => look.customer[o.customerId]?.name ?? "" },
              { key: "origin", header: "Origin", value: (o) => o.origin },
              { key: "destination", header: "Destination", value: (o) => o.destination },
              { key: "amount", header: "Amount", value: (o) => o.amount },
              { key: "payment", header: "Payment", value: (o) => o.payment },
              { key: "status", header: "Status", value: (o) => o.status },
            ]}
            filename="orders.csv"
          />
        }
        rowActions={(o) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-success"
              disabled={o.payment === "paid"}
              onClick={() => {
                update("orders", o.id, { payment: "paid" }, o.code);
                toast.success(`Order ${o.code} marked as paid.`);
              }}
            >
              <Banknote className="h-3.5 w-3.5" aria-hidden />
              Mark Paid
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
              disabled={o.status === "confirmed" || o.status === "completed" || o.status === "cancelled"}
              onClick={() => {
                const next = o.status === "created" ? "confirmed" : "processing";
                update("orders", o.id, { status: next }, o.code);
                toast.success(`Order ${o.code} moved to ${next}.`);
              }}
            >
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
              Confirm
            </Button>
          </div>
        )}
      />
    </div>
  );
}
