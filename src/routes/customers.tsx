import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Building2, MapPin, Wallet } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/farazz/page-header";
import { DataTable, type Column } from "@/components/farazz/data-table";
import { KpiCard, Field } from "@/components/farazz/primitives";
import { StatusBadge } from "@/components/farazz/status-badge";
import { useData, formatIDR, formatNum } from "@/lib/farazz/store";
import { useT } from "@/lib/i18n";
import type { Customer } from "@/lib/farazz/data";

export const Route = createFileRoute("/customers")({
  head: () => ({
    meta: [
      { title: "Customers — FARAZZ FLOW" },
      { name: "description", content: "Customer accounts, spend and performance." },
    ],
  }),
  component: CustomersPage,
});

function CustomersPage() {
  const t = useT();
  const { db } = useData();
  const [selected, setSelected] = useState<Customer | null>(null);

  const totalSpend = db.customers.reduce((acc, c) => acc + c.monthlySpend, 0);

  const columns: Column<Customer>[] = [
    { key: "code", header: "Code", value: (c) => c.code, className: "num" },
    { key: "name", header: t("common.name"), value: (c) => c.name, render: (c) => <span className="font-medium text-foreground">{c.name}</span> },
    { key: "contact", header: "Contact", value: (c) => c.contact, hideOnMobile: true },
    { key: "city", header: "City", value: (c) => c.city, hideOnMobile: true },
    { key: "phone", header: t("common.phone"), value: (c) => c.phone, className: "num", hideOnMobile: true },
    {
      key: "spend",
      header: "Monthly spend",
      value: (c) => c.monthlySpend,
      render: (c) => <span className="num">{formatIDR(c.monthlySpend)}</span>,
      align: "right",
    },
    { key: "performance", header: "Performance", value: (c) => c.performance, render: (c) => <span className="num">{c.performance}%</span>, align: "right", hideOnMobile: true },
    { key: "status", header: t("common.status"), value: (c) => (c.active ? "active" : "inactive"), render: (c) => <StatusBadge value={c.active ? "active" : "inactive"} /> },
  ];

  return (
    <div className="mx-auto max-w-[104rem] space-y-5">
      <PageHeader
        title={t("nav.customers")}
        description="Customer accounts, spend and performance."
        crumbs={[{ label: t("nav.business") }, { label: t("nav.customers") }]}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Total customers" value={String(db.customers.filter((c) => c.active).length)} tone="info" icon={<Building2 className="h-4 w-4" />} />
        <KpiCard label="Combined monthly spend" value={formatIDR(totalSpend)} tone="info" icon={<Wallet className="h-4 w-4" />} />
        <KpiCard label="Locations served" value={String(db.customers.reduce((acc, c) => acc + c.locations.length, 0))} tone="info" icon={<MapPin className="h-4 w-4" />} />
      </div>

      <DataTable
        rows={db.customers}
        columns={columns}
        searchKeys={(c) => `${c.code} ${c.name} ${c.city} ${c.contact}`}
        searchPlaceholder="Search code, name, city, contact…"
        onRowClick={setSelected}
      />

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.name}</DialogTitle>
              </DialogHeader>
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Field label="Code" value={selected.code} mono />
                <Field label="Contact" value={selected.contact} />
                <Field label="Position" value={selected.position} />
                <Field label="Phone" value={selected.phone} mono />
                <Field label="Email" value={selected.email} />
                <Field label="City" value={selected.city} />
                <Field label="Billing address" value={selected.billingAddress} />
                <Field label="Monthly spend" value={formatIDR(selected.monthlySpend)} mono />
                <Field label="Performance" value={`${selected.performance}%`} mono />
              </dl>
              <Field label="Locations" value={selected.locations.join(" — ")} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}