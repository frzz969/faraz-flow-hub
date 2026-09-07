import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Receipt, Banknote, Percent } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/farazz/page-header";
import { DataTable, type Column } from "@/components/farazz/data-table";
import { KpiCard, Field } from "@/components/farazz/primitives";
import { StatusBadge } from "@/components/farazz/status-badge";
import { useData, useLookups, formatIDR } from "@/lib/farazz/store";
import { useT } from "@/lib/i18n";
import type { Invoice } from "@/lib/farazz/data";

export const Route = createFileRoute("/invoices")({
  head: () => ({
    meta: [
      { title: "Invoices — FARAZZ FLOW" },
      { name: "description", content: "Invoice register with full charge breakdown." },
    ],
  }),
  component: InvoicesPage,
});

function InvoicesPage() {
  const t = useT();
  const { db } = useData();
  const look = useLookups();
  const [selected, setSelected] = useState<Invoice | null>(null);

  const total = db.invoices.reduce((acc, i) => acc + i.total, 0);
  const taxTotal = db.invoices.reduce((acc, i) => acc + i.tax, 0);

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
        title={t("nav.invoices")}
        description="Invoice register with full charge breakdown."
        crumbs={[{ label: t("nav.finance") }, { label: t("nav.invoices") }]}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Invoices issued" value={String(db.invoices.length)} tone="info" icon={<Receipt className="h-4 w-4" />} />
        <KpiCard label="Total value" value={formatIDR(total)} tone="info" icon={<Banknote className="h-4 w-4" />} />
        <KpiCard label="Tax collected" value={formatIDR(taxTotal)} tone="info" icon={<Percent className="h-4 w-4" />} />
      </div>

      <DataTable
        rows={db.invoices}
        columns={columns}
        searchKeys={(i) => `${i.code} ${look.customer[i.customerId]?.name ?? ""}`}
        searchPlaceholder="Search code, customer…"
        filters={[{ id: "status", label: t("common.status"), options: statusOptions, accessor: (i) => i.status }]}
        onRowClick={setSelected}
      />

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="num">{selected.code}</span>
                  <StatusBadge value={selected.status} />
                </DialogTitle>
              </DialogHeader>
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Field label={t("common.customer")} value={look.customer[selected.customerId]?.name ?? "—"} />
                <Field label="Issued" value={selected.issued} />
                <Field label="Due" value={selected.due} />
              </dl>
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Field label="Base charge" value={formatIDR(selected.base)} mono />
                <Field label="Weight charge" value={formatIDR(selected.weightCharge)} mono />
                <Field label="Distance charge" value={formatIDR(selected.distanceCharge)} mono />
                <Field label="Insurance" value={formatIDR(selected.insurance)} mono />
                <Field label="Additional" value={formatIDR(selected.additional)} mono />
                <Field label="Tax (11%)" value={formatIDR(selected.tax)} mono />
              </dl>
              <div className="rounded-md border border-border bg-muted/40 px-4 py-3">
                <p className="text-xs text-muted-foreground uppercase">Total</p>
                <p className="num mt-1 text-xl font-semibold">{formatIDR(selected.total)}</p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}