import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Route as RouteIcon, MapPin, Clock, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/farazz/page-header";
import { DataTable, type Column } from "@/components/farazz/data-table";
import { KpiCard, Field, ProgressBar } from "@/components/farazz/primitives";
import { StatusBadge } from "@/components/farazz/status-badge";
import { ExportButton } from "@/components/farazz/export-button";
import { ConfirmDelete } from "@/components/farazz/confirm-delete";
import { useData, formatNum } from "@/lib/farazz/store";
import { useT } from "@/lib/i18n";
import type { RouteRec } from "@/lib/farazz/data";

export const Route = createFileRoute("/routes")({
  head: () => ({
    meta: [
      { title: "Routes — FARAZZ FLOW" },
      { name: "description", content: "Line haul routes, stops, distances and on-time performance." },
    ],
  }),
  component: RoutesPage,
});

interface RouteForm {
  code: string;
  name: string;
  stops: string;
  distanceKm: string;
  estHours: string;
}

const toForm = (r: RouteRec): RouteForm => ({
  code: r.code,
  name: r.name,
  stops: r.stops.join(", "),
  distanceKm: String(r.distanceKm),
  estHours: String(r.estHours),
});

function FormDialog({
  open,
  editing,
  defaultCode,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  editing: RouteRec | null;
  defaultCode: string;
  onOpenChange: (v: boolean) => void;
  onSave: (form: RouteForm, editing: RouteRec | null) => void;
}) {
  const [form, setForm] = useState<RouteForm>(() =>
    editing
      ? toForm(editing)
      : { code: defaultCode, name: "", stops: "", distanceKm: "0", estHours: "8" },
  );
  const set = (k: keyof RouteForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

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
          <DialogTitle>{editing ? `Edit ${editing.code}` : "Add Route"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="rt-code">Code *</Label>
            <Input id="rt-code" value={form.code} onChange={(e) => set("code", e.target.value)} placeholder="JKT-SMG-1" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rt-name">Name *</Label>
            <Input id="rt-name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Jakarta → Semarang" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="rt-stops">Stops (comma-separated)</Label>
            <Input id="rt-stops" value={form.stops} onChange={(e) => set("stops", e.target.value)} placeholder="Jakarta, Cirebon, Tegal, Semarang" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rt-dist">Distance (km)</Label>
            <Input id="rt-dist" type="number" min="0" value={form.distanceKm} onChange={(e) => set("distanceKm", e.target.value)} placeholder="450" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rt-hours">Est. hours</Label>
            <Input id="rt-hours" type="number" min="0" step="0.5" value={form.estHours} onChange={(e) => set("estHours", e.target.value)} placeholder="8" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={handleSave}>{editing ? "Save Changes" : "Add Route"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RoutesPage() {
  const t = useT();
  const { db, create, update, remove } = useData();
  const [selected, setSelected] = useState<RouteRec | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RouteRec | null>(null);

  const totalDistance = db.routes.reduce((acc, r) => acc + r.distanceKm, 0);
  const avgOnTime = Math.round((db.routes.reduce((acc, r) => acc + r.onTimeRate, 0) / Math.max(1, db.routes.length)) * 10) / 10;
  const defaultCode = db.routes.length > 0 ? `RT-${String(parseInt(db.routes[0]?.code.replace(/\D/g, "") ?? "1", 10) + db.routes.length)}` : "RT-100";

  const columns: Column<RouteRec>[] = [
    { key: "code", header: "Code", value: (r) => r.code, className: "num", render: (r) => <span className="num font-medium text-foreground">{r.code}</span> },
    { key: "name", header: t("common.name"), value: (r) => r.name },
    { key: "stops", header: "Stops", value: (r) => r.stops.join(", "), className: "max-w-[18rem] truncate", hideOnMobile: true },
    { key: "distance", header: "Distance", value: (r) => r.distanceKm, render: (r) => <span className="num">{formatNum(r.distanceKm)} km</span>, align: "right" },
    { key: "est", header: "Est. hours", value: (r) => r.estHours, render: (r) => <span className="num">{r.estHours}h</span>, align: "right", hideOnMobile: true },
    { key: "actual", header: "Actual", value: (r) => r.actualHours, render: (r) => <span className="num">{r.actualHours}h</span>, align: "right", hideOnMobile: true },
    {
      key: "onTime",
      header: "On-time",
      value: (r) => r.onTimeRate,
      render: (r) => (
        <div className="flex w-28 items-center gap-2">
          <ProgressBar value={r.onTimeRate} tone={r.onTimeRate < 90 ? "warning" : "success"} />
          <span className="num text-xs text-muted-foreground">{r.onTimeRate}%</span>
        </div>
      ),
      hideOnMobile: true,
    },
    { key: "shipments", header: "Active shipments", value: (r) => r.activeShipments, render: (r) => <span className="num">{formatNum(r.activeShipments)}</span>, align: "right", hideOnMobile: true },
  ];

  const handleSave = (form: RouteForm, editing: RouteRec | null) => {
    const payload = {
      code: form.code,
      name: form.name,
      stops: form.stops.split(",").map((s) => s.trim()).filter(Boolean),
      distanceKm: Number(form.distanceKm) || 0,
      estHours: Number(form.estHours) || 0,
    };
    if (editing) {
      update("routes", editing.id, payload, editing.code);
      toast.success(`Route ${form.code} updated.`);
    } else {
      create("routes", payload, payload.code);
      toast.success(`Route ${form.code} added.`);
    }
  };

  return (
    <div className="mx-auto max-w-[104rem] space-y-5">
      <PageHeader
        title={t("nav.routes")}
        description="Line haul routes, stops, distances and on-time performance."
        crumbs={[{ label: t("nav.fleet") }, { label: t("nav.routes") }]}
        actions={
          <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }} className="gap-1.5">
            <Plus className="h-4 w-4" /> Add Route
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Total routes" value={String(db.routes.length)} tone="info" icon={<RouteIcon className="h-4 w-4" />} />
        <KpiCard label="Covered distance" value={formatNum(totalDistance) + " km"} tone="info" icon={<MapPin className="h-4 w-4" />} />
        <KpiCard label="Avg on-time" value={avgOnTime + "%"} tone="success" icon={<Clock className="h-4 w-4" />} />
      </div>

      <DataTable
        rows={db.routes}
        columns={columns}
        searchKeys={(r) => `${r.code} ${r.name} ${r.stops.join(" ")}`}
        searchPlaceholder="Search code, name, stops…"
        onRowClick={setSelected}
        toolbarExtra={
          <ExportButton
            rows={db.routes}
            columns={[
              { key: "code", header: "Code", value: (r) => r.code },
              { key: "name", header: "Name", value: (r) => r.name },
              { key: "stops", header: "Stops", value: (r) => r.stops.join("; ") },
              { key: "distanceKm", header: "Distance (km)", value: (r) => r.distanceKm },
              { key: "estHours", header: "Est hours", value: (r) => r.estHours },
              { key: "onTimeRate", header: "On-time %", value: (r) => r.onTimeRate },
            ]}
            filename="routes.csv"
          />
        }
        rowActions={(r) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              aria-label={`Edit ${r.code}`}
              onClick={() => { setEditing(r); setFormOpen(true); }}
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden />
            </Button>
            <StatusBadge value="active" dot={false} className="text-[10px]" />
            <ConfirmDelete
              title={`Delete ${r.code}?`}
              confirmLabel="Delete"
              onConfirm={() => remove("routes", r.id, r.code)}
            />
          </div>
        )}
      />

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="num">{selected.code}</DialogTitle>
              </DialogHeader>
              <dl className="grid grid-cols-2 gap-4">
                <Field label={t("common.name")} value={selected.name} />
                <Field label="Distance" value={`${formatNum(selected.distanceKm)} km`} mono />
                <Field label="Est. hours" value={`${selected.estHours}h`} mono />
                <Field label="Actual hours" value={`${selected.actualHours}h`} mono />
                <Field label="On-time rate" value={`${selected.onTimeRate}%`} mono />
                <Field label="Active shipments" value={formatNum(selected.activeShipments)} mono />
              </dl>
              <Field label="Stops" value={selected.stops.map((s, i) => `${i + 1}. ${s}`).join(" — ")} />
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