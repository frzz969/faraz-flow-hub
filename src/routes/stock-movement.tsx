import { createFileRoute } from "@tanstack/react-router";
import { Activity, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { PageHeader } from "@/components/farazz/page-header";
import { DataTable, type Column } from "@/components/farazz/data-table";
import { KpiCard } from "@/components/farazz/primitives";
import { StatusBadge } from "@/components/farazz/status-badge";
import { useData, useLookups } from "@/lib/farazz/store";
import { useT } from "@/lib/i18n";
import type { StockMovement } from "@/lib/farazz/data";

export const Route = createFileRoute("/stock-movement")({
  head: () => ({
    meta: [
      { title: "Stock Movement — FARAZZ FLOW" },
      { name: "description", content: "Every stock in/out transaction across warehouses." },
    ],
  }),
  component: StockMovementPage,
});

function StockMovementPage() {
  const t = useT();
  const { db } = useData();
  const look = useLookups();

  const inboundQty = db.stockMovements.filter((m) => m.qty > 0).length;
  const outboundQty = db.stockMovements.filter((m) => m.qty < 0).length;

  const columns: Column<StockMovement>[] = [
    { key: "date", header: t("common.date"), value: (m) => m.date },
    {
      key: "product",
      header: "Product",
      value: (m) => look.product[m.productId]?.sku ?? "—",
      render: (m) => <span className="font-medium text-foreground">{look.product[m.productId]?.name ?? "—"}</span>,
    },
    { key: "type", header: "Type", value: (m) => m.type, render: (m) => <StatusBadge value={m.type} /> },
    { key: "qty", header: t("common.quantity"), value: (m) => m.qty, render: (m) => <span className={"num " + (m.qty < 0 ? "text-critical" : "text-success")}>{m.qty > 0 ? "+" : ""}{m.qty}</span>, align: "right" },
    { key: "reference", header: "Reference", value: (m) => m.reference, className: "num", hideOnMobile: true },
    { key: "user", header: "User", value: (m) => m.user, hideOnMobile: true },
    { key: "warehouse", header: t("common.warehouse"), value: (m) => look.warehouse[m.warehouseId]?.code ?? "—", hideOnMobile: true },
  ];

  const typeOptions = Array.from(new Set(db.stockMovements.map((m) => m.type))).map((v) => ({ value: v, label: v }));

  return (
    <div className="mx-auto max-w-[104rem] space-y-5">
      <PageHeader
        title={t("nav.stockMovement")}
        description="Every stock in/out transaction across warehouses."
        crumbs={[{ label: t("nav.warehouse") }, { label: t("nav.stockMovement") }]}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Total movements" value={String(db.stockMovements.length)} tone="info" icon={<Activity className="h-4 w-4" />} />
        <KpiCard label="Stock in" value={String(inboundQty)} tone="success" icon={<ArrowDownToLine className="h-4 w-4" />} />
        <KpiCard label="Stock out" value={String(outboundQty)} tone="warning" icon={<ArrowUpFromLine className="h-4 w-4" />} />
      </div>

      <DataTable
        rows={db.stockMovements}
        columns={columns}
        searchKeys={(m) => `${m.reference} ${look.product[m.productId]?.sku ?? ""} ${look.product[m.productId]?.name ?? ""} ${m.user}`}
        searchPlaceholder="Search reference, product, user…"
        filters={[{ id: "type", label: "Type", options: typeOptions, accessor: (m) => m.type }]}
      />
    </div>
  );
}