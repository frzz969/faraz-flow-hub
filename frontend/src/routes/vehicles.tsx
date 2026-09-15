import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Truck, Route as RouteIcon, Wrench, Gauge, Pencil, Plus } from "lucide-react";
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
import { useData, useLookups, formatNum } from "@/lib/farazz/store";
import { useT } from "@/lib/i18n";
import type { Vehicle } from "@/lib/farazz/data";

export const Route = createFileRoute("/vehicles")({
  head: () => ({
    meta: [
      { title: "Vehicles — FARAZZ FLOW" },
      { name: "description", content: "Fleet vehicles, assignment, fuel and service status." },
    ],
  }),
  component: VehiclesPage,
});

interface VehicleForm {
  code: string;
  model: string;
  plate: string;
  type: string;
  driverId: string;
  routeId: string;
  status: string;
  fuel: string;
  nextServiceKm: string;
}

const toForm = (v: Vehicle): VehicleForm => ({
  code: v.code,
  model: v.model,
  plate: v.plate,
  type: v.type,
  driverId: v.driverId ?? "",
  routeId: v.routeId ?? "",
  status: v.status,
  fuel: String(v.fuel),
  nextServiceKm: String(v.nextServiceKm),
});

function FormDialog({
  open,
  editing,
  defaultCode,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  editing: Vehicle | null;
  defaultCode: string;
  onOpenChange: (v: boolean) => void;
  onSave: (form: VehicleForm, editing: Vehicle | null) => void;
}) {
  const { db } = useData();
  const look = useLookups();
  const [form, setForm] = useState<VehicleForm>(() =>
    editing
      ? toForm(editing)
      : { code: defaultCode, model: "", plate: "", type: "Box Truck", driverId: "", routeId: "", status: "available", fuel: "100", nextServiceKm: "10000" },
  );
  const set = (k: keyof VehicleForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.code.trim() || !form.model.trim() || !form.plate.trim()) {
      toast.error("Code, model and plate are required.");
      return;
    }
    onSave(form, editing);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? `Edit ${editing.code}` : "Add Vehicle"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="veh-code">Code *</Label>
            <Input id="veh-code" value={form.code} onChange={(e) => set("code", e.target.value)} placeholder="VEH-001" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="veh-model">Model *</Label>
            <Input id="veh-model" value={form.model} onChange={(e) => set("model", e.target.value)} placeholder="Hino Dutro 130 MDL" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="veh-plate">Plate *</Label>
            <Input id="veh-plate" value={form.plate} onChange={(e) => set("plate", e.target.value)} placeholder="B 9940 TXK" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="veh-type">Type</Label>
            <Input id="veh-type" value={form.type} onChange={(e) => set("type", e.target.value)} placeholder="Box Truck" />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="idle">Idle</SelectItem>
                <SelectItem value="on_route">On route</SelectItem>
                <SelectItem value="workshop">Workshop</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Driver</Label>
            <Select value={form.driverId} onValueChange={(v) => set("driverId", v)}>
              <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">Unassigned</SelectItem>
                {db.drivers.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Route</Label>
            <Select value={form.routeId} onValueChange={(v) => set("routeId", v)}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">—</SelectItem>
                {db.routes.map((r) => <SelectItem key={r.id} value={r.id}>{r.code}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="veh-fuel">Fuel (%)</Label>
            <Input id="veh-fuel" type="number" min="0" max="100" value={form.fuel} onChange={(e) => set("fuel", e.target.value)} placeholder="100" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="veh-svc">Next service (km)</Label>
            <Input id="veh-svc" type="number" min="0" value={form.nextServiceKm} onChange={(e) => set("nextServiceKm", e.target.value)} placeholder="10000" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={handleSave}>{editing ? "Save Changes" : "Add Vehicle"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function VehiclesPage() {
  const t = useT();
  const { db, create, update, remove, toggleActive } = useData();
  const look = useLookups();
  const [selected, setSelected] = useState<Vehicle | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);

  const onRoute = db.vehicles.filter((v) => v.status === "on_route").length;
  const idle = db.vehicles.filter((v) => v.status === "idle" || v.status === "available").length;
  const workshop = db.vehicles.filter((v) => v.status === "workshop").length;
  const defaultCode = db.vehicles.length > 0 ? `VEH-${String(parseInt(db.vehicles[0]?.code.replace(/\D/g, "") ?? "1", 10) + db.vehicles.length).padStart(3, "0")}` : "VEH-001";

  const columns: Column<Vehicle>[] = [
    { key: "code", header: "Code", value: (v) => v.code, className: "num", render: (v) => <span className="num font-medium text-foreground">{v.code}</span> },
    { key: "model", header: "Model", value: (v) => v.model },
    { key: "plate", header: "Plate", value: (v) => v.plate, className: "num", hideOnMobile: true },
    { key: "type", header: "Type", value: (v) => v.type, hideOnMobile: true },
    { key: "driver", header: t("common.driver"), value: (v) => (v.driverId ? look.driver[v.driverId]?.name ?? "—" : "Unassigned"), hideOnMobile: true },
    { key: "route", header: t("common.route"), value: (v) => (v.routeId ? look.route[v.routeId]?.code ?? "—" : "—"), className: "num", hideOnMobile: true },
    {
      key: "fuel",
      header: "Fuel",
      value: (v) => v.fuel,
      render: (v) => (
        <div className="flex w-24 items-center gap-2">
          <ProgressBar value={v.fuel} tone={v.fuel < 25 ? "critical" : v.fuel < 50 ? "warning" : "success"} />
          <span className="num text-xs text-muted-foreground">{v.fuel}%</span>
        </div>
      ),
      hideOnMobile: true,
    },
    { key: "status", header: t("common.status"), value: (v) => v.status, render: (v) => <StatusBadge value={v.status} /> },
  ];

  const statusOptions = Array.from(new Set(db.vehicles.map((v) => v.status))).map((v) => ({ value: v, label: t(`status.${v}`, v) }));

  const handleSave = (form: VehicleForm, editing: Vehicle | null) => {
    const payload = {
      code: form.code,
      model: form.model,
      plate: form.plate,
      type: form.type,
      driverId: form.driverId && form.driverId !== "__none" ? form.driverId : null,
      routeId: form.routeId && form.routeId !== "__none" ? form.routeId : null,
      status: form.status as Vehicle["status"],
      fuel: Number(form.fuel) || 0,
      nextServiceKm: Number(form.nextServiceKm) || 0,
    };
    if (editing) {
      update("vehicles", editing.id, payload, editing.code);
      toast.success(`Vehicle ${form.code} updated.`);
    } else {
      create("vehicles", payload, payload.code);
      toast.success(`Vehicle ${form.code} added.`);
    }
  };

  return (
    <div className="mx-auto max-w-[104rem] space-y-5">
      <PageHeader
        title={t("nav.vehicles")}
        description="Fleet vehicles, assignment, fuel and service status."
        crumbs={[{ label: t("nav.fleet") }, { label: t("nav.vehicles") }]}
        actions={
          <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }} className="gap-1.5">
            <Plus className="h-4 w-4" /> Add Vehicle
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <KpiCard label="Total vehicles" value={String(db.vehicles.length)} tone="info" icon={<Truck className="h-4 w-4" />} />
        <KpiCard label="On route" value={String(onRoute)} tone="info" icon={<RouteIcon className="h-4 w-4" />} />
        <KpiCard label="Available" value={String(idle)} tone="success" icon={<Gauge className="h-4 w-4" />} />
        <KpiCard label="In workshop" value={String(workshop)} tone="critical" icon={<Wrench className="h-4 w-4" />} />
      </div>

      <DataTable
        rows={db.vehicles}
        columns={columns}
        searchKeys={(v) => `${v.code} ${v.model} ${v.plate} ${v.type} ${look.driver[v.driverId ?? ""]?.name ?? ""}`}
        searchPlaceholder="Search code, model, plate…"
        filters={[{ id: "status", label: t("common.status"), options: statusOptions, accessor: (v) => v.status }]}
        onRowClick={setSelected}
        toolbarExtra={
          <ExportButton
            rows={db.vehicles}
            columns={[
              { key: "code", header: "Code", value: (v) => v.code },
              { key: "model", header: "Model", value: (v) => v.model },
              { key: "plate", header: "Plate", value: (v) => v.plate },
              { key: "type", header: "Type", value: (v) => v.type },
              { key: "driver", header: "Driver", value: (v) => (v.driverId ? look.driver[v.driverId]?.name ?? "" : "") },
              { key: "status", header: "Status", value: (v) => v.status },
            ]}
            filename="vehicles.csv"
          />
        }
        rowActions={(v) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              aria-label={`Edit ${v.code}`}
              onClick={() => { setEditing(v); setFormOpen(true); }}
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-success"
              onClick={() => {
                toggleActive("vehicles", v.id, v.code);
                toast.success(v.active ? `Vehicle ${v.code} deactivated.` : `Vehicle ${v.code} activated.`);
              }}
            >
              {v.active ? "Deactivate" : "Activate"}
            </Button>
            <ConfirmDelete
              title={`Delete ${v.code}?`}
              confirmLabel="Delete"
              onConfirm={() => remove("vehicles", v.id, v.code)}
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
                <Field label="Model" value={selected.model} />
                <Field label="Plate" value={selected.plate} mono />
                <Field label="Type" value={selected.type} />
                <Field label={t("common.driver")} value={selected.driverId ? look.driver[selected.driverId]?.name ?? "—" : "Unassigned"} />
                <Field label={t("common.route")} value={selected.routeId ? look.route[selected.routeId]?.code ?? "—" : "—"} mono />
                <Field label="Fuel" value={`${selected.fuel}%`} mono />
                <Field label="Next service" value={`${formatNum(selected.nextServiceKm)} km`} mono />
                <Field label={t("common.active")} value={selected.active ? "Yes" : "No"} />
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