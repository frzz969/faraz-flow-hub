import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Building2, MapPin, Wallet, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/farazz/page-header";
import { DataTable, type Column } from "@/components/farazz/data-table";
import { KpiCard, Field } from "@/components/farazz/primitives";
import { StatusBadge } from "@/components/farazz/status-badge";
import { ExportButton } from "@/components/farazz/export-button";
import { ConfirmDelete } from "@/components/farazz/confirm-delete";
import { useData, formatIDR } from "@/lib/farazz/store";
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

interface CustomerForm {
  code: string;
  name: string;
  contact: string;
  position: string;
  phone: string;
  email: string;
  billingAddress: string;
  city: string;
  locations: string;
  monthlySpend: string;
  performance: string;
}

const EMPTY: CustomerForm = {
  code: "", name: "", contact: "", position: "", phone: "", email: "",
  billingAddress: "", city: "", locations: "", monthlySpend: "0", performance: "0",
};

const toForm = (c: Customer): CustomerForm => ({
  code: c.code,
  name: c.name,
  contact: c.contact,
  position: c.position,
  phone: c.phone,
  email: c.email,
  billingAddress: c.billingAddress,
  city: c.city,
  locations: c.locations.join(", "),
  monthlySpend: String(c.monthlySpend),
  performance: String(c.performance),
});

function FormDialog({
  open,
  onOpenChange,
  editing,
  defaultCode,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Customer | null;
  defaultCode: string;
  onSave: (form: CustomerForm, editing: Customer | null) => void;
}) {
  const [form, setForm] = useState<CustomerForm>(
    () => (editing ? toForm(editing) : { ...EMPTY, code: defaultCode }),
  );
  const set = (k: keyof CustomerForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.name.trim() || !form.code.trim()) {
      toast.error("Name and code are required.");
      return;
    }
    onSave(form, editing);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? `Edit ${editing.name}` : "Add Customer"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="cus-code">Code *</Label>
            <Input id="cus-code" value={form.code} onChange={(e) => set("code", e.target.value)} placeholder="CUS-2026-001" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cus-name">Name *</Label>
            <Input id="cus-name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="PT Maju Bersama" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cus-contact">Contact</Label>
            <Input id="cus-contact" value={form.contact} onChange={(e) => set("contact", e.target.value)} placeholder="Budi Santoso" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cus-position">Position</Label>
            <Input id="cus-position" value={form.position} onChange={(e) => set("position", e.target.value)} placeholder="Logistics Manager" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cus-phone">Phone</Label>
            <Input id="cus-phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="0812-1100-2281" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cus-email">Email</Label>
            <Input id="cus-email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="ops@majubersama.co.id" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cus-city">City</Label>
            <Input id="cus-city" value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Jakarta" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cus-locations">Locations (comma-separated)</Label>
            <Input id="cus-locations" value={form.locations} onChange={(e) => set("locations", e.target.value)} placeholder="Jakarta, Bekasi, Depok" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="cus-address">Billing address</Label>
            <Input id="cus-address" value={form.billingAddress} onChange={(e) => set("billingAddress", e.target.value)} placeholder="Jl. Gatot Subroto Kav. 21, Jakarta Selatan" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cus-spend">Monthly spend (IDR)</Label>
            <Input id="cus-spend" type="number" min="0" step="100000" value={form.monthlySpend} onChange={(e) => set("monthlySpend", e.target.value)} placeholder="8500000" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cus-perf">Performance (%)</Label>
            <Input id="cus-perf" type="number" min="0" max="100" value={form.performance} onChange={(e) => set("performance", e.target.value)} placeholder="98" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={handleSave}>{editing ? "Save Changes" : "Create Customer"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CustomersPage() {
  const t = useT();
  const { db, create, update, remove, toggleActive } = useData();
  const [selected, setSelected] = useState<Customer | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);

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

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleSave = (form: CustomerForm, editing: Customer | null) => {
    const payload = {
      code: form.code,
      name: form.name,
      contact: form.contact,
      position: form.position,
      phone: form.phone,
      whatsapp: form.phone,
      email: form.email,
      billingAddress: form.billingAddress,
      city: form.city,
      locations: form.locations.split(",").map((s) => s.trim()).filter(Boolean),
      monthlySpend: Number(form.monthlySpend) || 0,
      performance: Number(form.performance) || 0,
    };
    if (editing) {
      update("customers", editing.id, payload, editing.name);
      toast.success(`Customer ${form.code} updated.`);
    } else {
      create("customers", payload, payload.name);
      toast.success(`Customer ${form.code} created.`);
    }
  };

  return (
    <div className="mx-auto max-w-[104rem] space-y-5">
      <PageHeader
        title={t("nav.customers")}
        description="Customer accounts, spend and performance."
        crumbs={[{ label: t("nav.business") }, { label: t("nav.customers") }]}
        actions={
          <Button size="sm" onClick={openCreate} className="gap-1.5">
            <Plus className="h-4 w-4" /> Add Customer
          </Button>
        }
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
        toolbarExtra={
          <ExportButton
            rows={db.customers}
            columns={[
              { key: "code", header: "Code", value: (c) => c.code },
              { key: "name", header: "Name", value: (c) => c.name },
              { key: "contact", header: "Contact", value: (c) => c.contact },
              { key: "city", header: "City", value: (c) => c.city },
              { key: "phone", header: "Phone", value: (c) => c.phone },
              { key: "monthlySpend", header: "Monthly spend", value: (c) => c.monthlySpend },
              { key: "performance", header: "Performance %", value: (c) => c.performance },
            ]}
            filename="customers.csv"
          />
        }
        rowActions={(c) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              aria-label={`Edit ${c.name}`}
              onClick={() => {
                setEditing(c);
                setFormOpen(true);
              }}
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-success"
              onClick={() => {
                toggleActive("customers", c.id, c.name);
                toast.success(c.active ? `Customer ${c.code} deactivated.` : `Customer ${c.code} activated.`);
              }}
            >
              {c.active ? "Deactivate" : "Activate"}
            </Button>
            <ConfirmDelete
              title={`Delete ${c.name}?`}
              confirmLabel="Delete"
              onConfirm={() => remove("customers", c.id, c.name)}
            />
          </div>
        )}
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

      <FormDialog
        key={editing?.id ?? "new"}
        open={formOpen}
        onOpenChange={(v) => { setFormOpen(v); if (!v) setEditing(null); }}
        editing={editing}
        defaultCode={db.customers.length > 0 ? `CUS-${String(parseInt(db.customers[0]?.code.replace(/\D/g, "") ?? "1000", 10) + db.customers.length)}` : "CUS-1000"}
        onSave={handleSave}
      />
    </div>
  );
}