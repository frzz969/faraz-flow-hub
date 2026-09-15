import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Warehouse as WarehouseIcon, TriangleAlert, AlertOctagon, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/farazz/page-header";
import { DataTable, type Column } from "@/components/farazz/data-table";
import { KpiCard, Field, ProgressBar } from "@/components/farazz/primitives";
import { StatusBadge } from "@/components/farazz/status-badge";
import { ExportButton } from "@/components/farazz/export-button";
import { ConfirmDelete } from "@/components/farazz/confirm-delete";
import { useData, formatNum } from "@/lib/farazz/store";
import { useT } from "@/lib/i18n";
import type { Warehouse } from "@/lib/farazz/data";

export const Route = createFileRoute("/warehouses")({
  head: () => ({
    meta: [
      { title: "Warehouses — FARAZZ FLOW" },
      { name: "description", content: "Manage warehouse hubs, capacity and operational status." },
    ],
  }),
  component: WarehousesPage,
});

interface WHForm {
  code: string;
  name: string;
  city: string;
  region: string;
  capacity: string;
  used: string;
  status: string;
}

const toForm = (w: Warehouse): WHForm => ({
  code: w.code,
  name: w.name,
  city: w.city,
  region: w.region,
  capacity: String(w.capacity),
  used: String(w.used),
  status: w.status,
});

function FormDialog({
  open,
  editing,
  defaultCode,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  editing: Warehouse | null;
  defaultCode: string;
  onOpenChange: (v: boolean) => void;
  onSave: (form: WHForm, editing: Warehouse | null) => void;
}) {
  const [form, setForm] = useState<WHForm>(() =>
    editing
      ? toForm(editing)
      : { code: defaultCode, name: "", city: "", region: "", capacity: "10000", used: "0", status: "operational" },
  );
  const set = (k: keyof WHForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

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
          <DialogTitle>{editing ? `Edit ${editing.name}` : "Add Warehouse"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="wh-code">Code *</Label>
            <Input id="wh-code" value={form.code} onChange={(e) => set("code", e.target.value)} placeholder="WH-JKT" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wh-name">Name *</Label>
            <Input id="wh-name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Jakarta Hub" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wh-city">City</Label>
            <Input id="wh-city" value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Jakarta" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wh-region">Region</Label>
            <Input id="wh-region" value={form.region} onChange={(e) => set("region", e.target.value)} placeholder="Greater Jakarta" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wh-cap">Capacity (m²)</Label>
            <Input id="wh-cap" type="number" min="1" value={form.capacity} onChange={(e) => set("capacity", e.target.value)} placeholder="10000" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wh-used">Used (m²)</Label>
            <Input id="wh-used" type="number" min="0" value={form.used} onChange={(e) => set("used", e.target.value)} placeholder="0" />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="operational">Operational</SelectItem>
                <SelectItem value="congested">Congested</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={handleSave}>{editing ? "Save Changes" : "Add Warehouse"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function WarehousesPage() {
  const t = useT();
  const { db, create, update, remove, toggleActive } = useData();
  const [selected, setSelected] = useState<Warehouse | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Warehouse | null>(null);

  const congested = db.warehouses.filter((w) => w.status === "congested").length;
  const critical = db.warehouses.filter((w) => w.status === "critical").length;
  const defaultCode = db.warehouses.length > 0 ? `WH-${String(parseInt(db.warehouses[0]?.code.replace(/\D/g, "") ?? "1", 10) + db.warehouses.length).padStart(3, "0")}` : "WH-001";

  const columns: Column<Warehouse>[] = [
    { key: "code", header: "Code", value: (w) => w.code, className: "num" },
    { key: "name", header: t("common.name"), value: (w) => w.name, render: (w) => <span className="font-medium text-foreground">{w.name}</span> },
    { key: "city", header: "City", value: (w) => w.city, hideOnMobile: true },
    {
      key: "util",
      header: t("common.utilization"),
      value: (w) => Math.round((w.used / w.capacity) * 100),
      render: (w) => {
        const pct = Math.round((w.used / w.capacity) * 100);
        return (
          <div className="flex w-28 items-center gap-2">
            <ProgressBar value={pct} tone={pct > 88 ? "critical" : pct > 70 ? "warning" : "primary"} />
            <span className="num text-xs text-muted-foreground">{pct}%</span>
          </div>
        );
      },
    },
    { key: "capacity", header: t("common.capacity"), value: (w) => w.capacity, render: (w) => <span className="num">{formatNum(w.capacity)}</span>, align: "right", hideOnMobile: true },
    { key: "status", header: t("common.status"), value: (w) => w.status, render: (w) => <StatusBadge value={w.status} /> },
  ];

  const handleSave = (form: WHForm, editing: Warehouse | null) => {
    const payload = {
      code: form.code,
      name: form.name,
      city: form.city,
      region: form.region,
      capacity: Number(form.capacity) || 1,
      used: Number(form.used) || 0,
      status: form.status as Warehouse["status"],
    };
    if (editing) {
      update("warehouses", editing.id, payload, editing.name);
      toast.success(`Warehouse ${form.code} updated.`);
    } else {
      create("warehouses", payload, payload.name);
      toast.success(`Warehouse ${form.code} added.`);
    }
  };

  return (
    <div className="mx-auto max-w-[104rem] space-y-5">
      <PageHeader
        title={t("nav.warehouses")}
        description="Manage warehouse hubs, capacity and operational status."
        crumbs={[{ label: t("nav.warehouse") }, { label: t("nav.warehouses") }]}
        actions={
          <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }} className="gap-1.5">
            <Plus className="h-4 w-4" /> Add Warehouse
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Total hubs" value={String(db.warehouses.length)} tone="info" icon={<WarehouseIcon className="h-4 w-4" />} />
        <KpiCard label="Congested" value={String(congested)} tone="warning" icon={<TriangleAlert className="h-4 w-4" />} />
        <KpiCard label="Critical" value={String(critical)} tone="critical" icon={<AlertOctagon className="h-4 w-4" />} />
      </div>

      <DataTable
        rows={db.warehouses}
        columns={columns}
        searchKeys={(w) => `${w.code} ${w.name} ${w.city} ${w.region}`}
        searchPlaceholder="Search code, name, city…"
        onRowClick={setSelected}
        toolbarExtra={
          <ExportButton
            rows={db.warehouses}
            columns={[
              { key: "code", header: "Code", value: (w) => w.code },
              { key: "name", header: "Name", value: (w) => w.name },
              { key: "city", header: "City", value: (w) => w.city },
              { key: "region", header: "Region", value: (w) => w.region },
              { key: "capacity", header: "Capacity", value: (w) => w.capacity },
              { key: "used", header: "Used", value: (w) => w.used },
              { key: "status", header: "Status", value: (w) => w.status },
            ]}
            filename="warehouses.csv"
          />
        }
        rowActions={(w) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              aria-label={`Edit ${w.name}`}
              onClick={() => { setEditing(w); setFormOpen(true); }}
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-success"
              onClick={() => {
                toggleActive("warehouses", w.id, w.name);
                toast.success(w.active ? `Warehouse ${w.code} deactivated.` : `Warehouse ${w.code} activated.`);
              }}
            >
              {w.active ? "Deactivate" : "Activate"}
            </Button>
            <ConfirmDelete
              title={`Delete ${w.name}?`}
              confirmLabel="Delete"
              onConfirm={() => remove("warehouses", w.id, w.name)}
            />
          </div>
        )}
      />

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="num">{selected.code}</span>
                  <StatusBadge value={selected.status} />
                </DialogTitle>
              </DialogHeader>
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Field label={t("common.name")} value={selected.name} />
                <Field label="City" value={selected.city} />
                <Field label="Region" value={selected.region} />
                <Field label={t("common.capacity")} value={formatNum(selected.capacity)} mono />
                <Field label="Used" value={formatNum(selected.used)} mono />
                <Field label={t("common.utilization")} value={`${Math.round((selected.used / selected.capacity) * 100)}%`} mono />
              </dl>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Field label="Inbound" value={formatNum(selected.inbound)} mono />
                <Field label="Sorting" value={formatNum(selected.sorting)} mono />
                <Field label="Outbound" value={formatNum(selected.outbound)} mono />
                <Field label="Waiting" value={formatNum(selected.waiting)} mono />
                <Field label="Delayed" value={formatNum(selected.delayed)} mono />
                <Field label={t("common.active")} value={selected.active ? "Yes" : "No"} />
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