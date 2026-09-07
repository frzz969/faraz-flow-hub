import { createFileRoute } from "@tanstack/react-router";
import { ClipboardCheck, CheckCircle2, XCircle, Clock } from "lucide-react";
import { PageHeader } from "@/components/farazz/page-header";
import { DataTable, type Column } from "@/components/farazz/data-table";
import { KpiCard } from "@/components/farazz/primitives";
import { StatusBadge } from "@/components/farazz/status-badge";
import { useData, formatIDR } from "@/lib/farazz/store";
import { useT } from "@/lib/i18n";
import type { Approval } from "@/lib/farazz/data";

export const Route = createFileRoute("/approvals")({
  head: () => ({
    meta: [
      { title: "Approvals — FARAZZ FLOW" },
      { name: "description", content: "Pending and historical approval requests." },
    ],
  }),
  component: ApprovalsPage,
});

function ApprovalsPage() {
  const t = useT();
  const { db } = useData();

  const pending = db.approvals.filter((a) => a.status === "pending").length;
  const approved = db.approvals.filter((a) => a.status === "approved").length;
  const rejected = db.approvals.filter((a) => a.status === "rejected").length;
  const pendingValue = db.approvals.filter((a) => a.status === "pending").reduce((acc, a) => acc + a.amount, 0);

  const columns: Column<Approval>[] = [
    { key: "code", header: "Code", value: (a) => a.code, className: "num", render: (a) => <span className="num font-medium text-foreground">{a.code}</span> },
    { key: "title", header: "Title", value: (a) => a.title, className: "max-w-[20rem] truncate" },
    { key: "requester", header: "Requester", value: (a) => a.requester, hideOnMobile: true },
    { key: "module", header: "Module", value: (a) => a.module, hideOnMobile: true },
    { key: "amount", header: t("common.amount"), value: (a) => a.amount, render: (a) => (a.amount > 0 ? <span className="num">{formatIDR(a.amount)}</span> : <span className="text-muted-foreground">—</span>), align: "right" },
    { key: "stage", header: "Stage", value: (a) => a.stage, hideOnMobile: true },
    { key: "status", header: t("common.status"), value: (a) => a.status, render: (a) => <StatusBadge value={a.status} /> },
    { key: "date", header: t("common.date"), value: (a) => a.date, hideOnMobile: true },
  ];

  const statusOptions = Array.from(new Set(db.approvals.map((a) => a.status))).map((v) => ({ value: v, label: t(`status.${v}`, v) }));

  return (
    <div className="mx-auto max-w-[104rem] space-y-5">
      <PageHeader
        title={t("nav.approvals")}
        description="Pending and historical approval requests."
        crumbs={[{ label: t("nav.workspace") }, { label: t("nav.approvals") }]}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Pending" value={String(pending)} tone="warning" icon={<Clock className="h-4 w-4" />} />
        <KpiCard label="Pending value" value={formatIDR(pendingValue)} tone="warning" icon={<ClipboardCheck className="h-4 w-4" />} />
        <KpiCard label="Approved" value={String(approved)} tone="success" icon={<CheckCircle2 className="h-4 w-4" />} />
        <KpiCard label="Rejected" value={String(rejected)} tone="critical" icon={<XCircle className="h-4 w-4" />} />
      </div>

      <DataTable
        rows={db.approvals}
        columns={columns}
        searchKeys={(a) => `${a.code} ${a.title} ${a.requester} ${a.module}`}
        searchPlaceholder="Search code, title, requester…"
        filters={[{ id: "status", label: t("common.status"), options: statusOptions, accessor: (a) => a.status }]}
      />
    </div>
  );
}