import { createFileRoute } from "@tanstack/react-router";
import { CreditCard, CheckCheck, HandCoins, Banknote } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/farazz/page-header";
import { DataTable, type Column } from "@/components/farazz/data-table";
import { KpiCard } from "@/components/farazz/primitives";
import { StatusBadge } from "@/components/farazz/status-badge";
import { ExportButton } from "@/components/farazz/export-button";
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
  const { db, update } = useData();
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
        toolbarExtra={
          <ExportButton
            rows={db.cods}
            columns={[
              { key: "code", header: "Code", value: (c) => c.code },
              { key: "shipment", header: "Shipment", value: (c) => c.shipment },
              { key: "customer", header: "Customer", value: (c) => look.customer[c.customerId]?.name ?? "" },
              { key: "amount", header: "Amount", value: (c) => c.amount },
              { key: "collected", header: "Collected", value: (c) => c.collected },
              { key: "driver", header: "Driver", value: (c) => look.driver[c.driverId]?.name ?? "" },
              { key: "status", header: "Status", value: (c) => c.status },
            ]}
            filename="cod.csv"
          />
        }
        rowActions={(c) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-warning"
              disabled={c.status !== "pending"}
              onClick={() => {
                update("cods", c.id, { status: "collected", collected: "10 Aug 2026" }, c.code);
                toast.success(`COD ${c.code} marked as collected.`);
              }}
            >
              <HandCoins className="h-3.5 w-3.5" aria-hidden />
              Collect
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-success"
              disabled={c.status !== "collected"}
              onClick={() => {
                update("cods", c.id, { status: "remitted" }, c.code);
                toast.success(`COD ${c.code} remitted to finance.`);
              }}
            >
              <Banknote className="h-3.5 w-3.5" aria-hidden />
              Remit
            </Button>
          </div>
        )}
      />
    </div>
  );
}