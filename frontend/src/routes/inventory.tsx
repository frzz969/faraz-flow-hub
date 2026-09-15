import { createFileRoute } from "@tanstack/react-router";
import { Boxes, PackageX, PackageCheck } from "lucide-react";
import { PageHeader } from "@/components/farazz/page-header";
import { DataTable, type Column } from "@/components/farazz/data-table";
import { KpiCard } from "@/components/farazz/primitives";
import { StatusBadge } from "@/components/farazz/status-badge";
import { useData, useLookups, formatNum } from "@/lib/farazz/store";
import { useT } from "@/lib/i18n";
import type { Product } from "@/lib/farazz/data";

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory — FARAZZ FLOW" },
      { name: "description", content: "Product inventory, stock levels and warehouse availability." },
    ],
  }),
  component: InventoryPage,
});

function InventoryPage() {
  const t = useT();
  const { db } = useData();
  const look = useLookups();

  const lowStock = db.products.filter((p) => p.available <= p.minStock);
  const totalUnits = db.products.reduce((acc, p) => acc + p.total, 0);

  const columns: Column<Product>[] = [
    { key: "sku", header: "SKU", value: (p) => p.sku, className: "num" },
    { key: "name", header: t("common.name"), value: (p) => p.name, render: (p) => <span className="font-medium text-foreground">{p.name}</span> },
    { key: "category", header: "Category", value: (p) => look.category[p.categoryId]?.name ?? "—", hideOnMobile: true },
    { key: "brand", header: "Brand", value: (p) => p.brand, hideOnMobile: true },
    { key: "warehouse", header: t("common.warehouse"), value: (p) => look.warehouse[p.warehouseId]?.code ?? "—", hideOnMobile: true },
    { key: "available", header: "Available", value: (p) => p.available, render: (p) => <span className="num">{p.available}</span>, align: "right" },
    { key: "total", header: "Total", value: (p) => p.total, render: (p) => <span className="num">{formatNum(p.total)}</span>, align: "right", hideOnMobile: true },
    {
      key: "level",
      header: t("common.status"),
      value: (p) => (p.available <= p.minStock ? "low" : "available"),
      render: (p) => (p.available <= p.minStock ? <StatusBadge value="low" /> : <StatusBadge value="available" />),
    },
  ];

  const categoryOptions = db.categories.map((c) => ({ value: c.id, label: c.name }));

  return (
    <div className="mx-auto max-w-[104rem] space-y-5">
      <PageHeader
        title={t("nav.inventory")}
        description="Product inventory, stock levels and warehouse availability."
        crumbs={[{ label: t("nav.warehouse") }, { label: t("nav.inventory") }]}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="SKUs tracked" value={String(db.products.length)} tone="info" icon={<Boxes className="h-4 w-4" />} />
        <KpiCard label="Units on hand" value={formatNum(totalUnits)} tone="info" icon={<Boxes className="h-4 w-4" />} />
        <KpiCard label="Low stock" value={String(lowStock.length)} tone="critical" icon={<PackageX className="h-4 w-4" />} />
      </div>

      <DataTable
        rows={db.products}
        columns={columns}
        searchKeys={(p) => `${p.sku} ${p.name} ${p.brand} ${look.category[p.categoryId]?.name ?? ""}`}
        searchPlaceholder="Search SKU, name, brand…"
        filters={[
          { id: "category", label: "Category", options: categoryOptions, accessor: (p) => p.categoryId },
          { id: "warehouse", label: t("common.warehouse"), options: db.warehouses.map((w) => ({ value: w.id, label: w.name })), accessor: (p) => p.warehouseId },
        ]}
      />
    </div>
  );
}