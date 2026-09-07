import { createFileRoute } from "@tanstack/react-router";
import { FileText, File } from "lucide-react";
import { PageHeader } from "@/components/farazz/page-header";
import { DataTable, type Column } from "@/components/farazz/data-table";
import { KpiCard } from "@/components/farazz/primitives";
import { useData } from "@/lib/farazz/store";
import { useT } from "@/lib/i18n";
import type { DocumentRec } from "@/lib/farazz/data";

export const Route = createFileRoute("/documents")({
  head: () => ({
    meta: [
      { title: "Documents — FARAZZ FLOW" },
      { name: "description", content: "Operational documents and records." },
    ],
  }),
  component: DocumentsPage,
});

function DocumentsPage() {
  const t = useT();
  const { db } = useData();

  const columns: Column<DocumentRec>[] = [
    { key: "code", header: "Code", value: (d) => d.code, className: "num" },
    {
      key: "name",
      header: t("common.name"),
      value: (d) => d.name,
      render: (d) => (
        <span className="inline-flex items-center gap-2 font-medium text-foreground">
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          {d.name}
        </span>
      ),
    },
    { key: "type", header: t("common.type"), value: (d) => d.type, hideOnMobile: true },
    { key: "linked", header: "Linked to", value: (d) => d.linked, className: "num", hideOnMobile: true },
    { key: "owner", header: t("common.owner"), value: (d) => d.owner, hideOnMobile: true },
    { key: "size", header: "Size", value: (d) => d.size, className: "num", hideOnMobile: true },
    { key: "date", header: t("common.date"), value: (d) => d.date, hideOnMobile: true },
  ];

  return (
    <div className="mx-auto max-w-[104rem] space-y-5">
      <PageHeader
        title={t("nav.documents")}
        description="Operational documents and records."
        crumbs={[{ label: t("nav.workspace") }, { label: t("nav.documents") }]}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <KpiCard label="Documents" value={String(db.documents.length)} tone="info" icon={<File className="h-4 w-4" />} />
        <KpiCard label="Types" value={String(new Set(db.documents.map((d) => d.type)).size)} tone="info" icon={<FileText className="h-4 w-4" />} />
      </div>

      <DataTable
        rows={db.documents}
        columns={columns}
        searchKeys={(d) => `${d.code} ${d.name} ${d.type} ${d.linked} ${d.owner}`}
        searchPlaceholder="Search name, code, type…"
      />
    </div>
  );
}