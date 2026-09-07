import { createFileRoute } from "@tanstack/react-router";
import { ListChecks, Zap, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/farazz/page-header";
import { DataTable, type Column } from "@/components/farazz/data-table";
import { KpiCard } from "@/components/farazz/primitives";
import { StatusBadge } from "@/components/farazz/status-badge";
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

function TasksPage() {
  const t = useT();
  const { db } = useData();

  const open = db.tasks.filter((tk) => tk.status === "open").length;
  const processing = db.tasks.filter((tk) => tk.status === "processing").length;
  const high = db.tasks.filter((tk) => tk.priority === "high" && tk.status !== "completed").length;

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
      />
    </div>
  );
}