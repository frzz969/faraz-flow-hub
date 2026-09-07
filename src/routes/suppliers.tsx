import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Landmark, ShieldCheck, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/farazz/page-header";
import { DataTable, type Column } from "@/components/farazz/data-table";
import { KpiCard, Field } from "@/components/farazz/primitives";
import { StatusBadge } from "@/components/farazz/status-badge";
import { useData, formatNum } from "@/lib/farazz/store";
import { useT } from "@/lib/i18n";
import type { Supplier } from "@/lib/farazz/data";

export const Route = createFileRoute("/suppliers")({
  head: () => ({
    meta: [
      { title: "Suppliers — FARAZZ FLOW" },
      { name: "description", content: "Supplier accounts, reliability and contracts." },
    ],
  }),
  component: SuppliersPage,
});

function SuppliersPage() {
  const t = useT();
  const { db } = useData();
  const [selected, setSelected] = useState<Supplier | null>(null);

  const avgReliability = Math.round((db.suppliers.reduce((acc, s) => acc + s.reliability, 0) / Math.max(1, db.suppliers.length)) * 10) / 10;

  const columns: Column<Supplier>[] = [
    { key: "code", header: "Code", value: (s) => s.code, className: "num" },
    { key: "name", header: t("common.name"), value: (s) => s.name, render: (s) => <span className="font-medium text-foreground">{s.name}</span> },
    { key: "contact", header: "Contact", value: (s) => s.contact, hideOnMobile: true },
    { key: "city", header: "City", value: (s) => s.city, hideOnMobile: true },
    { key: "services", header: "Services", value: (s) => s.services, className: "max-w-[16rem] truncate", hideOnMobile: true },
    { key: "reliability", header: "Reliability", value: (s) => s.reliability, render: (s) => <span className="num">{s.reliability}%</span>, align: "right" },
    { key: "response", header: "Response", value: (s) => s.responseHours, render: (s) => <span className="num">{s.responseHours}h</span>, align: "right", hideOnMobile: true },
    { key: "status", header: t("common.status"), value: (s) => (s.active ? "active" : "inactive"), render: (s) => <StatusBadge value={s.active ? "active" : "inactive"} /> },
  ];

  return (
    <div className="mx-auto max-w-[104rem] space-y-5">
      <PageHeader
        title={t("nav.suppliers")}
        description="Supplier accounts, reliability and contracts."
        crumbs={[{ label: t("nav.business") }, { label: t("nav.suppliers") }]}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Total suppliers" value={String(db.suppliers.filter((s) => s.active).length)} tone="info" icon={<Landmark className="h-4 w-4" />} />
        <KpiCard label="Avg reliability" value={avgReliability + "%"} tone="success" icon={<ShieldCheck className="h-4 w-4" />} />
        <KpiCard label="Avg response" value="—" tone="info" icon={<Clock className="h-4 w-4" />} />
      </div>

      <DataTable
        rows={db.suppliers}
        columns={columns}
        searchKeys={(s) => `${s.code} ${s.name} ${s.city} ${s.services}`}
        searchPlaceholder="Search code, name, city…"
        onRowClick={setSelected}
      />

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.name}</DialogTitle>
              </DialogHeader>
              <dl className="grid grid-cols-2 gap-4">
                <Field label="Code" value={selected.code} mono />
                <Field label="Contact" value={selected.contact} />
                <Field label="Position" value={selected.position} />
                <Field label="Phone" value={selected.phone} mono />
                <Field label="Email" value={selected.email} />
                <Field label="City" value={selected.city} />
                <Field label="Tax ID" value={selected.taxId} mono />
                <Field label="Bank" value={selected.bank} mono />
                <Field label="Services" value={selected.services} />
                <Field label="Reliability" value={`${selected.reliability}%`} mono />
              </dl>
              <div className="grid grid-cols-3 gap-4">
                <Field label="Response" value={`${selected.responseHours}h`} mono />
                <Field label="Transactions" value={formatNum(selected.transactions)} mono />
                <Field label="Contracts" value={formatNum(selected.contracts)} mono />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}