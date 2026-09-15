import { createFileRoute } from "@tanstack/react-router";
import { PackageCheck, Clock, ClipboardCheck, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/farazz/page-header";
import { DataTable, type Column } from "@/components/farazz/data-table";
import { KpiCard } from "@/components/farazz/primitives";
import { StatusBadge } from "@/components/farazz/status-badge";
import { ExportButton } from "@/components/farazz/export-button";
import { useData, useLookups } from "@/lib/farazz/store";
import { useT } from "@/lib/i18n";
import type { InboundRec } from "@/lib/farazz/data";

export const Route = createFileRoute("/inbound")({
  head: () => ({
    meta: [
      { title: "Inbound — FARAZZ FLOW" },
      { name: "description", content: "Inbound shipments, inspections and put-away across hubs." },
    ],
  }),
  component: InboundPage,
});

function InboundPage() {
  const t = useT();
  const { db, update } = useData();
  const look = useLookups();

  const expected = db.inbound.filter((i) => i.status === "expected").length;
  const received = db.inbound.filter((i) => i.status === "received" || i.status === "put_away").length;
  const inspection = db.inbound.filter((i) => i.status === "inspection").length;

  const columns: Column<InboundRec>[] = [
    { key: "code", header: "Code", value: (i) => i.code, className: "num" },
    {
      key: "supplier",
      header: t("nav.suppliers"),
      value: (i) => look.supplier[i.supplierId]?.name ?? "—",
      render: (i) => <span className="font-medium text-foreground">{look.supplier[i.supplierId]?.name ?? "—"}</span>,
    },
    { key: "reference", header: "Reference", value: (i) => i.reference, className: "num", hideOnMobile: true },
    { key: "warehouse", header: t("common.warehouse"), value: (i) => look.warehouse[i.warehouseId]?.code ?? "—", hideOnMobile: true },
    { key: "qty", header: t("common.quantity"), value: (i) => i.qty, render: (i) => <span className="num">{i.qty}</span>, align: "right", hideOnMobile: true },
    { key: "expected", header: "Expected", value: (i) => i.expected, hideOnMobile: true },
    { key: "inspection", header: "Inspection", value: (i) => i.inspection, hideOnMobile: true },
    { key: "status", header: t("common.status"), value: (i) => i.status, render: (i) => <StatusBadge value={i.status} /> },
  ];

  const statusOptions = Array.from(new Set(db.inbound.map((i) => i.status))).map((v) => ({ value: v, label: t(`status.${v}`, v) }));

  return (
    <div className="mx-auto max-w-[104rem] space-y-5">
      <PageHeader
        title={t("nav.inbound")}
        description="Inbound shipments, inspections and put-away across hubs."
        crumbs={[{ label: t("nav.warehouse") }, { label: t("nav.inbound") }]}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Expected" value={String(expected)} tone="info" icon={<Clock className="h-4 w-4" />} />
        <KpiCard label="In inspection" value={String(inspection)} tone="warning" icon={<ClipboardCheck className="h-4 w-4" />} />
        <KpiCard label="Received" value={String(received)} tone="success" icon={<PackageCheck className="h-4 w-4" />} />
      </div>

      <DataTable
        rows={db.inbound}
        columns={columns}
        searchKeys={(i) => `${i.code} ${i.reference} ${look.supplier[i.supplierId]?.name ?? ""}`}
        searchPlaceholder="Search code, reference, supplier…"
        filters={[{ id: "status", label: t("common.status"), options: statusOptions, accessor: (i) => i.status }]}
        toolbarExtra={
          <ExportButton
            rows={db.inbound}
            columns={[
              { key: "code", header: "Code", value: (i) => i.code },
              { key: "supplier", header: "Supplier", value: (i) => look.supplier[i.supplierId]?.name ?? "" },
              { key: "reference", header: "Reference", value: (i) => i.reference },
              { key: "warehouse", header: "Warehouse", value: (i) => look.warehouse[i.warehouseId]?.code ?? "" },
              { key: "qty", header: "Qty", value: (i) => i.qty },
              { key: "status", header: "Status", value: (i) => i.status },
              { key: "inspection", header: "Inspection", value: (i) => i.inspection },
            ]}
            filename="inbound.csv"
          />
        }
        rowActions={(i) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
              disabled={i.status === "put_away"}
              onClick={() => {
                const order = ["expected", "arrived", "scanning", "inspection", "received", "put_away"];
                const next = order[Math.min(order.indexOf(i.status) + 1, order.length - 1)];
                update("inbound", i.id, { status: next }, i.code);
                toast.success(`Inbound ${i.code} advanced to ${next}.`);
              }}
            >
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              Advance
            </Button>
          </div>
        )}
      />
    </div>
  );
}