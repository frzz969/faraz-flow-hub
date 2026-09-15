import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Contact, Route as RouteIcon, Users, Pencil, Plus } from "lucide-react";
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
import { useData, useLookups, formatNum } from "@/lib/farazz/store";
import { useT } from "@/lib/i18n";
import type { Driver } from "@/lib/farazz/data";

export const Route = createFileRoute("/drivers")({
  head: () => ({
    meta: [
      { title: "Drivers — FARAZZ FLOW" },
      { name: "description", content: "Driver profiles, licenses, ratings and availability." },
    ],
  }),
  component: DriversPage,
});

interface DriverForm {
  code: string;
  name: string;
  phone: string;
  license: string;
  baseWarehouseId: string;
  status: string;
  rating: string;
}

const toForm = (d: Driver): DriverForm => ({
  code: d.code,
  name: d.name,
  phone: d.phone,
  license: d.license,
  baseWarehouseId: d.baseWarehouseId,
  status: d.status,
  rating: String(d.rating),
});

function FormDialog({
  open,
  editing,
  defaultCode,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  editing: Driver | null;
  defaultCode: string;
  onOpenChange: (v: boolean) => void;
  onSave: (form: DriverForm, editing: Driver | null) => void;
}) {
  const { db } = useData();
  const [form, setForm] = useState<DriverForm>(() =>
    editing
      ? toForm(editing)
      : { code: defaultCode, name: "", phone: "", license: "", baseWarehouseId: db.warehouses[0]?.id ?? "", status: "available", rating: "5" },
  );
  const set = (k: keyof DriverForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.code.trim() || !form.name.trim()) {
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
          <DialogTitle>{editing ? `Edit ${editing.name}` : "Add Driver"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="drv-code">Code *</Label>
            <Input id="drv-code" value={form.code} onChange={(e) => set("code", e.target.value)} placeholder="DRV-026" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="drv-name">Name *</Label>
            <Input id="drv-name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Ahmad Fauzi" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="drv-phone">Phone</Label>
            <Input id="drv-phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="0812-4455-0099" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="drv-license">License</Label>
            <Input id="drv-license" value={form.license} onChange={(e) => set("license", e.target.value)} placeholder="B 2910 SIK" />
          </div>
          <div className="space-y-1.5">
            <Label>Base warehouse</Label>
            <Select value={form.baseWarehouseId} onValueChange={(v) => set("baseWarehouseId", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {db.warehouses.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="idle">Idle</SelectItem>
                <SelectItem value="on_route">On route</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="drv-rating">Rating (0–5)</Label>
            <Input id="drv-rating" type="number" min="0" max="5" step="0.1" value={form.rating} onChange={(e) => set("rating", e.target.value)} placeholder="4.8" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={handleSave}>{editing ? "Save Changes" : "Create Driver"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DriversPage() {
  const t = useT();
  const { db, create, update, remove, toggleActive } = useData();
  const look = useLookups();
  const [selected, setSelected] = useState<Driver | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);

  const onRoute = db.drivers.filter((d) => d.status === "on_route").length;
  const available = db.drivers.filter((d) => d.status === "available").length;
  const defaultCode = db.drivers.length > 0 ? `DRV-${String(parseInt(db.drivers[0]?.code.replace(/\D/g, "") ?? "1", 10) + db.drivers.length).padStart(3, "0")}` : "DRV-001";

  const columns: Column<Driver>[] = [
    { key: "code", header: "Code", value: (d) => d.code, className: "num" },
    { key: "name", header: t("common.name"), value: (d) => d.name, render: (d) => <span className="font-medium text-foreground">{d.name}</span> },
    { key: "phone", header: t("common.phone"), value: (d) => d.phone, className: "num", hideOnMobile: true },
    { key: "license", header: "License", value: (d) => d.license, hideOnMobile: true },
    { key: "base", header: "Base", value: (d) => look.warehouse[d.baseWarehouseId]?.code ?? "—", className: "num", hideOnMobile: true },
    { key: "rating", header: "Rating", value: (d) => d.rating, render: (d) => <span className="num">{d.rating.toFixed(1)} ★</span>, align: "right" },
    { key: "deliveries", header: "Deliveries", value: (d) => d.deliveries, render: (d) => <span className="num">{formatNum(d.deliveries)}</span>, align: "right", hideOnMobile: true },
    { key: "status", header: t("common.status"), value: (d) => d.status, render: (d) => <StatusBadge value={d.status} /> },
  ];

  const statusOptions = Array.from(new Set(db.drivers.map((d) => d.status))).map((v) => ({ value: v, label: t(`status.${v}`, v) }));

  const handleSave = (form: DriverForm, editing: Driver | null) => {
    const payload = {
      code: form.code,
      name: form.name,
      phone: form.phone,
      license: form.license,
      baseWarehouseId: form.baseWarehouseId,
      status: form.status as Driver["status"],
      rating: Number(form.rating) || 5,
    };
    if (editing) {
      update("drivers", editing.id, payload, editing.name);
      toast.success(`Driver ${form.code} updated.`);
    } else {
      create("drivers", payload, payload.name);
      toast.success(`Driver ${form.code} created.`);
    }
  };

  return (
    <div className="mx-auto max-w-[104rem] space-y-5">
      <PageHeader
        title={t("nav.drivers")}
        description="Driver profiles, licenses, ratings and availability."
        crumbs={[{ label: t("nav.fleet") }, { label: t("nav.drivers") }]}
        actions={
          <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }} className="gap-1.5">
            <Plus className="h-4 w-4" /> Add Driver
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Total drivers" value={String(db.drivers.length)} tone="info" icon={<Contact className="h-4 w-4" />} />
        <KpiCard label="On route" value={String(onRoute)} tone="info" icon={<RouteIcon className="h-4 w-4" />} />
        <KpiCard label="Available" value={String(available)} tone="success" icon={<Users className="h-4 w-4" />} />
      </div>

      <DataTable
        rows={db.drivers}
        columns={columns}
        searchKeys={(d) => `${d.code} ${d.name} ${d.phone} ${d.license}`}
        searchPlaceholder="Search code, name, phone…"
        filters={[{ id: "status", label: t("common.status"), options: statusOptions, accessor: (d) => d.status }]}
        onRowClick={setSelected}
        toolbarExtra={
          <ExportButton
            rows={db.drivers}
            columns={[
              { key: "code", header: "Code", value: (d) => d.code },
              { key: "name", header: "Name", value: (d) => d.name },
              { key: "phone", header: "Phone", value: (d) => d.phone },
              { key: "license", header: "License", value: (d) => d.license },
              { key: "rating", header: "Rating", value: (d) => d.rating },
              { key: "status", header: "Status", value: (d) => d.status },
            ]}
            filename="drivers.csv"
          />
        }
        rowActions={(d) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              aria-label={`Edit ${d.name}`}
              onClick={() => { setEditing(d); setFormOpen(true); }}
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-success"
              onClick={() => {
                toggleActive("drivers", d.id, d.name);
                toast.success(d.active ? `Driver ${d.code} deactivated.` : `Driver ${d.code} activated.`);
              }}
            >
              {d.active ? "Deactivate" : "Activate"}
            </Button>
            <ConfirmDelete
              title={`Delete ${d.name}?`}
              confirmLabel="Delete"
              onConfirm={() => remove("drivers", d.id, d.name)}
            />
          </div>
        )}
      />

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span>{selected.name}</span>
                  <StatusBadge value={selected.status} />
                </DialogTitle>
              </DialogHeader>
              <dl className="grid grid-cols-2 gap-4">
                <Field label="Code" value={selected.code} mono />
                <Field label="Phone" value={selected.phone} mono />
                <Field label="License" value={selected.license} />
                <Field label="Base" value={look.warehouse[selected.baseWarehouseId]?.name ?? "—"} />
                <Field label="Rating" value={`${selected.rating.toFixed(1)} ★`} mono />
                <Field label="Deliveries" value={formatNum(selected.deliveries)} mono />
              </dl>
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