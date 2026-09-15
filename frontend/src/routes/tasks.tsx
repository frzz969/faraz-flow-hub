import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ListChecks, Zap, CheckCircle2, Plus, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/farazz/page-header";
import { DataTable, type Column } from "@/components/farazz/data-table";
import { KpiCard } from "@/components/farazz/primitives";
import { StatusBadge } from "@/components/farazz/status-badge";
import { ExportButton } from "@/components/farazz/export-button";
import { ConfirmDelete } from "@/components/farazz/confirm-delete";
import { useData } from "@/lib/farazz/store";
import { useT } from "@/lib/i18n";
import type { TaskRec } from "@/lib/farazz/data";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "Tasks — FARAZZ FLOW" },
      { name: "description", content: "Operational tasks and assignments." },
    ],
  }),
  component: TasksPage,
});

interface TaskForm {
  title: string;
  assignee: string;
  module: string;
  due: string;
  priority: string;
}

function FormDialog({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (form: TaskForm) => void;
}) {
  const { db } = useData();
  const [form, setForm] = useState<TaskForm>({
    title: "",
    assignee: db.users[0]?.name ?? "",
    module: "Operations",
    due: "12 Aug 2026",
    priority: "medium",
  });
  const set = (k: keyof TaskForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.title.trim()) {
      toast.error("Task title is required.");
      return;
    }
    onSave(form);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Task</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="tsk-title">Title *</Label>
            <Input id="tsk-title" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Reconcile COD remittance batch" />
          </div>
          <div className="space-y-1.5">
            <Label>Assignee</Label>
            <Select value={form.assignee} onValueChange={(v) => set("assignee", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {db.users.map((u) => <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Module</Label>
            <Select value={form.module} onValueChange={(v) => set("module", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Operations", "Warehouse", "Fleet", "Delivery", "Finance", "Customer Service", "Pricing"].map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tsk-due">Due</Label>
            <Input id="tsk-due" value={form.due} onChange={(e) => set("due", e.target.value)} placeholder="12 Aug 2026" />
          </div>
          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Select value={form.priority} onValueChange={(v) => set("priority", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={handleSave}>Create Task</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TasksPage() {
  const t = useT();
  const { db, create, update, remove } = useData();
  const [formOpen, setFormOpen] = useState(false);

  const open = db.tasks.filter((tk) => tk.status === "open").length;
  const processing = db.tasks.filter((tk) => tk.status === "processing").length;
  const high = db.tasks.filter((tk) => tk.priority === "high" && tk.status !== "completed").length;

  const defaultCode = db.tasks.length > 0 ? `TSK-${String(parseInt(db.tasks[0]?.code.replace(/\D/g, "") ?? "1", 10) + db.tasks.length)}` : "TSK-5000";

  const columns: Column<TaskRec>[] = [
    { key: "code", header: "Code", value: (tk) => tk.code, className: "num", render: (tk) => <span className="num font-medium text-foreground">{tk.code}</span> },
    { key: "title", header: "Title", value: (tk) => tk.title, className: "max-w-[22rem] truncate" },
    { key: "assignee", header: "Assignee", value: (tk) => tk.assignee, hideOnMobile: true },
    { key: "module", header: "Module", value: (tk) => tk.module, hideOnMobile: true },
    { key: "due", header: "Due", value: (tk) => tk.due, hideOnMobile: true },
    { key: "priority", header: t("common.priority"), value: (tk) => tk.priority, render: (tk) => <StatusBadge value={tk.priority} /> },
    { key: "status", header: t("common.status"), value: (tk) => tk.status, render: (tk) => <StatusBadge value={tk.status} /> },
  ];

  const statusOptions = Array.from(new Set(db.tasks.map((tk) => tk.status))).map((v) => ({ value: v, label: t(`status.${v}`, v) }));
  const priorityOptions = ["high", "medium", "low"].map((v) => ({ value: v, label: t(`status.${v}`, v) }));

  return (
    <div className="mx-auto max-w-[104rem] space-y-5">
      <PageHeader
        title={t("nav.tasks")}
        description="Operational tasks and assignments."
        crumbs={[{ label: t("nav.workspace") }, { label: t("nav.tasks") }]}
        actions={
          <Button size="sm" onClick={() => setFormOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> New Task
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Open" value={String(open)} tone="info" icon={<ListChecks className="h-4 w-4" />} />
        <KpiCard label="In progress" value={String(processing)} tone="warning" icon={<ListChecks className="h-4 w-4" />} />
        <KpiCard label="High priority" value={String(high)} tone="critical" icon={<Zap className="h-4 w-4" />} />
      </div>

      <DataTable
        rows={db.tasks}
        columns={columns}
        searchKeys={(tk) => `${tk.code} ${tk.title} ${tk.assignee} ${tk.module}`}
        searchPlaceholder="Search code, title, assignee…"
        filters={[
          { id: "status", label: t("common.status"), options: statusOptions, accessor: (tk) => tk.status },
          { id: "priority", label: t("common.priority"), options: priorityOptions, accessor: (tk) => tk.priority },
        ]}
        toolbarExtra={
          <ExportButton
            rows={db.tasks}
            columns={[
              { key: "code", header: "Code", value: (tk) => tk.code },
              { key: "title", header: "Title", value: (tk) => tk.title },
              { key: "assignee", header: "Assignee", value: (tk) => tk.assignee },
              { key: "module", header: "Module", value: (tk) => tk.module },
              { key: "due", header: "Due", value: (tk) => tk.due },
              { key: "priority", header: "Priority", value: (tk) => tk.priority },
              { key: "status", header: "Status", value: (tk) => tk.status },
            ]}
            filename="tasks.csv"
          />
        }
        rowActions={(tk) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-success"
              disabled={tk.status === "completed"}
              onClick={() => {
                update("tasks", tk.id, { status: "completed" }, tk.code);
                toast.success(`Task ${tk.code} completed.`);
              }}
            >
              <CheckCheck className="h-3.5 w-3.5" aria-hidden />
              Complete
            </Button>
            <ConfirmDelete
              title={`Delete ${tk.code}?`}
              confirmLabel="Delete"
              onConfirm={() => remove("tasks", tk.id, tk.code)}
            />
          </div>
        )}
      />

      <FormDialog open={formOpen} onOpenChange={setFormOpen} onSave={(form) => {
        create("tasks", {
          code: defaultCode,
          title: form.title,
          assignee: form.assignee,
          module: form.module,
          due: form.due,
          priority: form.priority as TaskRec["priority"],
          status: "open",
        }, form.title);
        toast.success(`Task ${defaultCode} created.`);
      }} />
    </div>
  );
}