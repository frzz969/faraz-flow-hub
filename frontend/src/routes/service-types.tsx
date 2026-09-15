import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ListChecks, Clock, Tag, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/farazz/page-header";
import { DataTable, type Column } from "@/components/farazz/data-table";
import { KpiCard } from "@/components/farazz/primitives";
import { StatusBadge } from "@/components/farazz/status-badge";
import { ExportButton } from "@/components/farazz/export-button";
import { useData, formatIDR } from "@/lib/farazz/store";
import { useT } from "@/lib/i18n";
import type { ServiceType } from "@/lib/farazz/data";

export const Route = createFileRoute("/service-types")({
  head: () => ({
    meta: [
      { title: "Service Types — FARAZZ FLOW" },
      { name: "description", content: "Service offerings, SLA and rate structures." },
    ],
  }),
  component: ServiceTypesPage,
});

interface STForm {
  code: string;
  name: string;
  slaHours: string;
  baseRate: string;
  perKg: string;
}

const toForm = (s: ServiceType): STForm => ({
  code: s.code,
  name: s.name,
  slaHours: String(s.slaHours),
  baseRate: String(s.baseRate),
  perKg: String(s.perKg),
});

function FormDialog({
  open,
  editing,
  defaultCode,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  editing: ServiceType | null;
  defaultCode: string;
  onOpenChange: (v: boolean) => void;
  onSave: (form: STForm, editing: ServiceType | null) => void;
}) {
  const [form, setForm] = useState<STForm>(() =>
    editing
      ? toForm(editing)
      : { code: defaultCode, name: "", slaHours: "24", baseRate: "50000", perKg: "8000" },
  );
  const set = (k: keyof STForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

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
          <DialogTitle>{editing ? `Edit ${editing.name}` : "Add Service Type"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="st-code">Code *</Label>
            <Input id="st-code" value={form.code} onChange={(e) => set("code", e.target.value)} placeholder="EXP-24" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="st-name">Name *</Label>
            <Input id="st-name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Express 24" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="st-sla">SLA (hours)</Label>
            <Input id="st-sla" type="number" min="1" value={form.slaHours} onChange={(e) => set("slaHours", e.target.value)} placeholder="24" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="st-base">Base rate (IDR)</Label>
            <Input id="st-base" type="number" min="0" value={form.baseRate} onChange={(e) => set("baseRate", e.target.value)} placeholder="50000" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="st-perkg">Per kg (IDR)</Label>
            <Input id="st-perkg" type="number" min="0" value={form.perKg} onChange={(e) => set("perKg", e.target.value)} placeholder="8000" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={handleSave}>{editing ? "Save Changes" : "Add Service"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ServiceTypesPage() {
  const t = useT();
  const { db, create, update, toggleActive } = useData();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceType | null>(null);

  const defaultCode = db.serviceTypes.length > 0 ? `SRV-${String(parseInt(db.serviceTypes[0]?.code.replace(/\D/g, "") ?? "1", 10) + db.serviceTypes.length)}` : "SRV-100";

  const columns: Column<ServiceType>[] = [
    { key: "code", header: "Code", value: (s) => s.code, className: "num", render: (s) => <span className="num font-medium text-foreground">{s.code}</span> },
    { key: "name", header: t("common.name"), value: (s) => s.name },
    { key: "sla", header: "SLA", value: (s) => s.slaHours, render: (s) => <span className="num">{s.slaHours} hours</span>, align: "right" },
    { key: "base", header: "Base rate", value: (s) => s.baseRate, render: (s) => <span className="num">{formatIDR(s.baseRate)}</span>, align: "right" },
    { key: "perKg", header: "Per kg", value: (s) => s.perKg, render: (s) => <span className="num">{formatIDR(s.perKg)}</span>, align: "right" },
    { key: "status", header: t("common.status"), value: (s) => (s.active ? "active" : "inactive"), render: (s) => <StatusBadge value={s.active ? "active" : "inactive"} /> },
  ];

  const handleSave = (form: STForm, editing: ServiceType | null) => {
    const payload = {
      code: form.code,
      name: form.name,
      slaHours: Number(form.slaHours) || 24,
      baseRate: Number(form.baseRate) || 0,
      perKg: Number(form.perKg) || 0,
    };
    if (editing) {
      update("serviceTypes", editing.id, payload, editing.name);
      toast.success(`Service ${form.code} updated.`);
    } else {
      create("serviceTypes", payload, payload.name);
      toast.success(`Service ${form.code} added.`);
    }
  };

  return (
    <div className="mx-auto max-w-[104rem] space-y-5">
      <PageHeader
        title={t("nav.serviceTypes")}
        description="Service offerings, SLA and rate structures."
        crumbs={[{ label: t("nav.business") }, { label: t("nav.serviceTypes") }]}
        actions={
          <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }} className="gap-1.5">
            <Plus className="h-4 w-4" /> Add Service
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Active services" value={String(db.serviceTypes.filter((s) => s.active).length)} tone="info" icon={<ListChecks className="h-4 w-4" />} />
        <KpiCard label="Fastest SLA" value={db.serviceTypes.length ? Math.min(...db.serviceTypes.map((s) => s.slaHours)) + "h" : "—"} tone="info" icon={<Clock className="h-4 w-4" />} />
        <KpiCard label="From base rate" value={db.serviceTypes.length ? formatIDR(Math.min(...db.serviceTypes.map((s) => s.baseRate))) : "—"} tone="info" icon={<Tag className="h-4 w-4" />} />
      </div>

      <DataTable
        rows={db.serviceTypes}
        columns={columns}
        searchKeys={(s) => `${s.code} ${s.name}`}
        searchPlaceholder="Search code, name…"
        toolbarExtra={
          <ExportButton
            rows={db.serviceTypes}
            columns={[
              { key: "code", header: "Code", value: (s) => s.code },
              { key: "name", header: "Name", value: (s) => s.name },
              { key: "slaHours", header: "SLA hours", value: (s) => s.slaHours },
              { key: "baseRate", header: "Base rate", value: (s) => s.baseRate },
              { key: "perKg", header: "Per kg", value: (s) => s.perKg },
            ]}
            filename="service-types.csv"
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
                toggleActive("serviceTypes", s.id, s.name);
                toast.success(s.active ? `Service ${s.code} deactivated.` : `Service ${s.code} activated.`);
              }}
            >
              {s.active ? "Deactivate" : "Activate"}
            </Button>
          </div>
        )}
      />

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