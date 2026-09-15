import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CircleAlert, SearchCheck, PackageCheck, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/farazz/page-header";
import { DataTable, type Column } from "@/components/farazz/data-table";
import { KpiCard, Field, SectionCard } from "@/components/farazz/primitives";
import { StatusBadge } from "@/components/farazz/status-badge";
import { ExportButton } from "@/components/farazz/export-button";
import { useData } from "@/lib/farazz/store";
import { useT } from "@/lib/i18n";
import type { ExceptionRec } from "@/lib/farazz/data";

export const Route = createFileRoute("/exceptions")({
  head: () => ({
    meta: [
      { title: "Exceptions — FARAZZ FLOW" },
      { name: "description", content: "Track and resolve operational exceptions across the network." },
    ],
  }),
  component: ExceptionsPage,
});

function ExceptionsPage() {
  const t = useT();
  const { db, update } = useData();
  const [selected, setSelected] = useState<ExceptionRec | null>(null);

  const open = db.exceptions.filter((e) => e.status === "open").length;
  const investigating = db.exceptions.filter((e) => e.status === "investigating").length;
  const resolved = db.exceptions.filter((e) => e.status === "resolved").length;

  const columns: Column<ExceptionRec>[] = [
    { key: "code", header: "Code", value: (e) => e.code, className: "num" },
    { key: "shipment", header: "Shipment", value: (e) => e.shipment, render: (e) => <span className="num">{e.shipment}</span> },
    { key: "category", header: "Category", value: (e) => e.category, render: (e) => <span className="font-medium text-foreground">{e.category}</span> },
    { key: "severity", header: t("common.severity"), value: (e) => e.severity, render: (e) => <StatusBadge value={e.severity} /> },
    { key: "status", header: t("common.status"), value: (e) => e.status, render: (e) => <StatusBadge value={e.status} /> },
    { key: "owner", header: t("common.owner"), value: (e) => e.owner, hideOnMobile: true },
    { key: "reason", header: t("common.reason"), value: (e) => e.reason, className: "max-w-[16rem] truncate", hideOnMobile: true },
    { key: "action", header: "Action", value: (e) => e.action, className: "max-w-[16rem] truncate", hideOnMobile: true },
  ];

  const statusOptions = Array.from(new Set(db.exceptions.map((e) => e.status))).map((v) => ({ value: v, label: t(`status.${v}`, v) }));
  const categoryOptions = Array.from(new Set(db.exceptions.map((e) => e.category))).map((v) => ({ value: v, label: v }));

  return (
    <div className="mx-auto max-w-[104rem] space-y-5">
      <PageHeader
        title={t("nav.exceptions")}
        description="Track and resolve operational exceptions across the network."
        crumbs={[{ label: t("nav.operations") }, { label: t("nav.exceptions") }]}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Open" value={String(open)} tone="critical" icon={<CircleAlert className="h-4 w-4" />} />
        <KpiCard label="Investigating" value={String(investigating)} tone="warning" icon={<SearchCheck className="h-4 w-4" />} />
        <KpiCard label="Resolved" value={String(resolved)} tone="success" icon={<PackageCheck className="h-4 w-4" />} />
      </div>

      <DataTable
        rows={db.exceptions}
        columns={columns}
        searchKeys={(e) => `${e.code} ${e.shipment} ${e.category} ${e.reason} ${e.owner}`}
        searchPlaceholder="Search code, shipment, category…"
        filters={[
          { id: "status", label: t("common.status"), options: statusOptions, accessor: (e) => e.status },
          { id: "category", label: "Category", options: categoryOptions, accessor: (e) => e.category },
        ]}
        onRowClick={setSelected}
        toolbarExtra={
          <ExportButton
            rows={db.exceptions}
            columns={[
              { key: "code", header: "Code", value: (e) => e.code },
              { key: "shipment", header: "Shipment", value: (e) => e.shipment },
              { key: "category", header: "Category", value: (e) => e.category },
              { key: "severity", header: "Severity", value: (e) => e.severity },
              { key: "status", header: "Status", value: (e) => e.status },
              { key: "owner", header: "Owner", value: (e) => e.owner },
              { key: "reason", header: "Reason", value: (e) => e.reason },
            ]}
            filename="exceptions.csv"
          />
        }
        rowActions={(e) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-warning"
              disabled={e.status !== "open"}
              onClick={() => {
                update("exceptions", e.id, { status: "investigating" }, e.code);
                toast.success(`Exception ${e.code} moved to investigating.`);
              }}
            >
              <SearchCheck className="h-3.5 w-3.5" aria-hidden />
              Investigate
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-success"
              disabled={e.status === "resolved"}
              onClick={() => {
                update("exceptions", e.id, { status: "resolved" }, e.code);
                toast.success(`Exception ${e.code} resolved.`);
              }}
            >
              <CheckCheck className="h-3.5 w-3.5" aria-hidden />
              Resolve
            </Button>
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
                <Field label="Shipment" value={selected.shipment} mono />
                <Field label="Category" value={selected.category} />
                <Field label={t("common.severity")} value={<StatusBadge value={selected.severity} />} />
                <Field label={t("common.owner")} value={selected.owner} />
                <Field label="Expected" value={selected.expected} />
                <Field label="Current" value={selected.current} />
                <Field label={t("common.reason")} value={selected.reason} />
                <Field label="Action" value={selected.action} />
                <Field label="Vehicle" value={selected.vehicle} mono />
              </dl>
              {selected.notes && (
                <SectionCard title={t("common.notes")}>
                  <p className="text-sm text-muted-foreground">{selected.notes}</p>
                </SectionCard>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}