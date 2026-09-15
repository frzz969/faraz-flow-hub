import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { FileCheck2, CalendarRange, Wallet, Pencil, Plus } from "lucide-react";
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
import { useData, useLookups, formatIDR } from "@/lib/farazz/store";
import { useT } from "@/lib/i18n";
import type { ContractRec } from "@/lib/farazz/data";

export const Route = createFileRoute("/contracts")({
  head: () => ({
    meta: [
      { title: "Contracts — FARAZZ FLOW" },
      { name: "description", content: "Customer service agreements, terms and contract value." },
    ],
  }),
  component: ContractsPage,
});

interface CTRForm {
  code: string;
  customerId: string;
  serviceId: string;
  start: string;
  end: string;
  value: string;
  status: string;
}

const toForm = (c: ContractRec): CTRForm => ({
  code: c.code,
  customerId: c.customerId,
  serviceId: c.serviceId,
  start: c.start,
  end: c.end,
  value: String(c.value),
  status: c.status,
});

function FormDialog({
  open,
  editing,
  defaultCode,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  editing: ContractRec | null;
  defaultCode: string;
  onOpenChange: (v: boolean) => void;
  onSave: (form: CTRForm, editing: ContractRec | null) => void;
}) {
  const { db } = useData();
  const [form, setForm] = useState<CTRForm>(() =>
    editing
      ? toForm(editing)
      : {
          code: defaultCode,
          customerId: db.customers[0]?.id ?? "",
          serviceId: db.serviceTypes[0]?.id ?? "",
          start: "01 Jan 2026",
          end: "31 Dec 2026",
          value: "640000000",
          status: "active",
        },
  );
  const set = (k: keyof CTRForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.code.trim() || !form.customerId || !form.serviceId) {
      toast.error("Code, customer and service are required.");
      return;
    }
    onSave(form, editing);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? `Edit ${editing.code}` : "Add Contract"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="ctr-code">Code *</Label>
            <Input id="ctr-code" value={form.code} onChange={(e) => set("code", e.target.value)} placeholder="CTR-0120" />
          </div>
          <div className="space-y-1.5">
            <Label>Customer *</Label>
            <Select value={form.customerId} onValueChange={(v) => set("customerId", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {db.customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Service *</Label>
            <Select value={form.serviceId} onValueChange={(v) => set("serviceId", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {db.serviceTypes.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ctr-value">Annual value (IDR)</Label>
            <Input id="ctr-value" type="number" min="0" value={form.value} onChange={(e) => set("value", e.target.value)} placeholder="640000000" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ctr-start">Start date</Label>
            <Input id="ctr-start" value={form.start} onChange={(e) => set("start", e.target.value)} placeholder="01 Jan 2026" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ctr-end">End date</Label>
            <Input id="ctr-end" value={form.end} onChange={(e) => set("end", e.target.value)} placeholder="31 Dec 2026" />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="expiring">Expiring</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={handleSave}>{editing ? "Save Changes" : "Create Contract"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ContractsPage() {
  const t = useT();
  const { db, create, update, remove } = useData();
  const look = useLookups();
  const [selected, setSelected] = useState<ContractRec | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ContractRec | null>(null);

  const totalValue = db.contracts.reduce((acc, c) => acc + c.value, 0);
  const activeCount = db.contracts.filter((c) => c.status === "active").length;
  const defaultCode = db.contracts.length > 0 ? `CTR-${String(parseInt(db.contracts[0]?.code.replace(/\D/g, "") ?? "1", 10) + db.contracts.length).padStart(4, "0")}` : "CTR-0101";

  const columns: Column<ContractRec>[] = [
    { key: "code", header: "Code", value: (c) => c.code, className: "num", render: (c) => <span className="num font-medium text-foreground">{c.code}</span> },
    { key: "customer", header: "Customer", value: (c) => look.customer[c.customerId]?.name ?? "—", render: (c) => <span className="text-foreground">{look.customer[c.customerId]?.name ?? "—"}</span> },
    { key: "service", header: "Service", value: (c) => look.service[c.serviceId]?.name ?? "—", hideOnMobile: true },
    { key: "start", header: "Start", value: (c) => c.start, hideOnMobile: true },
    { key: "end", header: "End", value: (c) => c.end, hideOnMobile: true },
    { key: "value", header: "Value", value: (c) => c.value, render: (c) => <span className="num">{formatIDR(c.value)}</span>, align: "right" },
    { key: "status", header: t("common.status"), value: (c) => c.status, render: (c) => <StatusBadge value={c.status} /> },
  ];

  const handleSave = (form: CTRForm, editing: ContractRec | null) => {
    const payload = {
      code: form.code,
      customerId: form.customerId,
      serviceId: form.serviceId,
      start: form.start,
      end: form.end,
      value: Number(form.value) || 0,
      status: form.status,
    };
    if (editing) {
      update("contracts", editing.id, payload, editing.code);
      toast.success(`Contract ${form.code} updated.`);
    } else {
      create("contracts", payload, payload.code);
      toast.success(`Contract ${form.code} created.`);
    }
  };

  return (
    <div className="mx-auto max-w-[104rem] space-y-5">
      <PageHeader
        title={t("nav.contracts")}
        description="Customer service agreements, terms and contract value."
        crumbs={[{ label: t("nav.business") }, { label: t("nav.contracts") }]}
        actions={
          <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }} className="gap-1.5">
            <Plus className="h-4 w-4" /> Add Contract
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Total contracts" value={String(db.contracts.length)} tone="info" icon={<FileCheck2 className="h-4 w-4" />} />
        <KpiCard label="Active" value={String(activeCount)} tone="success" icon={<CalendarRange className="h-4 w-4" />} />
        <KpiCard label="Annual value" value={formatIDR(totalValue)} tone="info" icon={<Wallet className="h-4 w-4" />} />
      </div>

      <DataTable
        rows={db.contracts}
        columns={columns}
        searchKeys={(c) => `${c.code} ${look.customer[c.customerId]?.name ?? ""}`}
        searchPlaceholder="Search code, customer…"
        onRowClick={setSelected}
        toolbarExtra={
          <ExportButton
            rows={db.contracts}
            columns={[
              { key: "code", header: "Code", value: (c) => c.code },
              { key: "customer", header: "Customer", value: (c) => look.customer[c.customerId]?.name ?? "" },
              { key: "service", header: "Service", value: (c) => look.service[c.serviceId]?.name ?? "" },
              { key: "start", header: "Start", value: (c) => c.start },
              { key: "end", header: "End", value: (c) => c.end },
              { key: "value", header: "Value", value: (c) => c.value },
              { key: "status", header: "Status", value: (c) => c.status },
            ]}
            filename="contracts.csv"
          />
        }
        rowActions={(c) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              aria-label={`Edit ${c.code}`}
              onClick={() => { setEditing(c); setFormOpen(true); }}
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden />
            </Button>
            <ConfirmDelete
              title={`Delete ${c.code}?`}
              confirmLabel="Delete"
              onConfirm={() => remove("contracts", c.id, c.code)}
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
                  <span className="num">{selected.code}</span>
                  <StatusBadge value={selected.status} />
                </DialogTitle>
              </DialogHeader>
              <dl className="grid grid-cols-2 gap-4">
                <Field label="Customer" value={look.customer[selected.customerId]?.name ?? "—"} />
                <Field label="Service" value={look.service[selected.serviceId]?.name ?? "—"} />
                <Field label="Start" value={selected.start} />
                <Field label="End" value={selected.end} />
                <Field label="Annual value" value={formatIDR(selected.value)} mono />
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