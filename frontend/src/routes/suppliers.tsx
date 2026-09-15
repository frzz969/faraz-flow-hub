import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Landmark, ShieldCheck, Clock, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/farazz/page-header";
import { DataTable, type Column } from "@/components/farazz/data-table";
import { KpiCard, Field } from "@/components/farazz/primitives";
import { StatusBadge } from "@/components/farazz/status-badge";
import { ExportButton } from "@/components/farazz/export-button";
import { ConfirmDelete } from "@/components/farazz/confirm-delete";
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

interface SupplierForm {
  code: string;
  name: string;
  contact: string;
  position: string;
  phone: string;
  email: string;
  city: string;
  services: string;
  reliability: string;
  responseHours: string;
}

const toForm = (s: Supplier): SupplierForm => ({
  code: s.code,
  name: s.name,
  contact: s.contact,
  position: s.position,
  phone: s.phone,
  email: s.email,
  city: s.city,
  services: s.services,
  reliability: String(s.reliability),
  responseHours: String(s.responseHours),
});

function FormDialog({
  open,
  editing,
  defaultCode,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  editing: Supplier | null;
  defaultCode: string;
  onOpenChange: (v: boolean) => void;
  onSave: (form: SupplierForm, editing: Supplier | null) => void;
}) {
  const [form, setForm] = useState<SupplierForm>(() =>
    editing
      ? toForm(editing)
      : { code: defaultCode, name: "", contact: "", position: "", phone: "", email: "", city: "", services: "", reliability: "100", responseHours: "24" },
  );
  const set = (k: keyof SupplierForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

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
          <DialogTitle>{editing ? `Edit ${editing.name}` : "Add Supplier"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="sup-code">Code *</Label>
            <Input id="sup-code" value={form.code} onChange={(e) => set("code", e.target.value)} placeholder="SUP-2026-001" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sup-name">Name *</Label>
            <Input id="sup-name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="PT Kargo Nusantara" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sup-contact">Contact</Label>
            <Input id="sup-contact" value={form.contact} onChange={(e) => set("contact", e.target.value)} placeholder="Siti Rahayu" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sup-position">Position</Label>
            <Input id="sup-position" value={form.position} onChange={(e) => set("position", e.target.value)} placeholder="Partner Manager" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sup-phone">Phone</Label>
            <Input id="sup-phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="0858-2244-5510" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sup-email">Email</Label>
            <Input id="sup-email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="ops@kargonusantara.co.id" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sup-city">City</Label>
            <Input id="sup-city" value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Tangerang" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sup-services">Services</Label>
            <Input id="sup-services" value={form.services} onChange={(e) => set("services", e.target.value)} placeholder="Linehaul, Fleet rental" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sup-rel">Reliability (%)</Label>
            <Input id="sup-rel" type="number" min="0" max="100" value={form.reliability} onChange={(e) => set("reliability", e.target.value)} placeholder="100" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sup-resp">Response hours</Label>
            <Input id="sup-resp" type="number" min="0" value={form.responseHours} onChange={(e) => set("responseHours", e.target.value)} placeholder="24" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={handleSave}>{editing ? "Save Changes" : "Create Supplier"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SuppliersPage() {
  const t = useT();
  const { db, create, update, remove, toggleActive } = useData();
  const [selected, setSelected] = useState<Supplier | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);

  const avgReliability = Math.round((db.suppliers.reduce((acc, s) => acc + s.reliability, 0) / Math.max(1, db.suppliers.length)) * 10) / 10;
  const defaultCode = db.suppliers.length > 0 ? `SUP-${String(parseInt(db.suppliers[0]?.code.replace(/\D/g, "") ?? "1000", 10) + db.suppliers.length)}` : "SUP-1000";

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

  const handleSave = (form: SupplierForm, editing: Supplier | null) => {
    const payload = {
      code: form.code,
      name: form.name,
      contact: form.contact,
      position: form.position,
      phone: form.phone,
      whatsapp: form.phone,
      email: form.email,
      city: form.city,
      services: form.services,
      reliability: Number(form.reliability) || 100,
      responseHours: Number(form.responseHours) || 24,
    };
    if (editing) {
      update("suppliers", editing.id, payload, editing.name);
      toast.success(`Supplier ${form.code} updated.`);
    } else {
      create("suppliers", payload, payload.name);
      toast.success(`Supplier ${form.code} created.`);
    }
  };

  return (
    <div className="mx-auto max-w-[104rem] space-y-5">
      <PageHeader
        title={t("nav.suppliers")}
        description="Supplier accounts, reliability and contracts."
        crumbs={[{ label: t("nav.business") }, { label: t("nav.suppliers") }]}
        actions={
          <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }} className="gap-1.5">
            <Plus className="h-4 w-4" /> Add Supplier
          </Button>
        }
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
        toolbarExtra={
          <ExportButton
            rows={db.suppliers}
            columns={[
              { key: "code", header: "Code", value: (s) => s.code },
              { key: "name", header: "Name", value: (s) => s.name },
              { key: "contact", header: "Contact", value: (s) => s.contact },
              { key: "city", header: "City", value: (s) => s.city },
              { key: "services", header: "Services", value: (s) => s.services },
              { key: "reliability", header: "Reliability %", value: (s) => s.reliability },
            ]}
            filename="suppliers.csv"
          />
        }
        rowActions={(s) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              aria-label={`Edit ${s.name}`}
              onClick={() => { setEditing(s); setFormOpen(true); }}
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-success"
              onClick={() => {
                toggleActive("suppliers", s.id, s.name);
                toast.success(s.active ? `Supplier ${s.code} deactivated.` : `Supplier ${s.code} activated.`);
              }}
            >
              {s.active ? "Deactivate" : "Activate"}
            </Button>
            <ConfirmDelete
              title={`Delete ${s.name}?`}
              confirmLabel="Delete"
              onConfirm={() => remove("suppliers", s.id, s.name)}
            />
          </div>
        )}
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

      <FormDialog
        key={editing?.id ?? "new"}
        open={formOpen}
        editing={editing}
        defaultCode={defaultCode}
        onOpenChange={(v) => { setFormOpen(v); if (!v) setEditing(null); }}
        onSave={handleSave}
      />
    </div>
  );
}