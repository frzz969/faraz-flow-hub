import { createFileRoute } from "@tanstack/react-router";
import { ScrollText } from "lucide-react";
import { PageHeader } from "@/components/farazz/page-header";
import { KpiCard, SectionCard } from "@/components/farazz/primitives";
import { Timeline } from "@/components/farazz/timeline";
import { useData } from "@/lib/farazz/store";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/admin/audit")({
  head: () => ({
    meta: [
      { title: "Audit Log — FARAZZ FLOW" },
      { name: "description", content: "Full audit trail of administrative changes." },
    ],
  }),
  component: AuditLogPage,
});

function AuditLogPage() {
  const t = useT();
  const { db } = useData();

  const uniqueUsers = new Set(db.auditLog.map((a) => a.user)).size;
  const uniqueModules = new Set(db.auditLog.map((a) => a.module)).size;

  return (
    <div className="mx-auto max-w-[104rem] space-y-5">
      <PageHeader
        title={t("admin.audit")}
        description="Full audit trail of administrative changes."
        crumbs={[{ label: t("nav.administration"), to: "/admin" }, { label: t("admin.audit") }]}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Events" value={String(db.auditLog.length)} tone="info" icon={<ScrollText className="h-4 w-4" />} />
        <KpiCard label="Users" value={String(uniqueUsers)} tone="info" icon={<ScrollText className="h-4 w-4" />} />
        <KpiCard label="Modules" value={String(uniqueModules)} tone="info" icon={<ScrollText className="h-4 w-4" />} />
      </div>

      <SectionCard title="Audit trail" subtitle="Newest first">
        <Timeline
          items={db.auditLog.map((a) => ({
            title: `${a.user} — ${a.action}`,
            timestamp: a.time,
            location: a.module,
            operator: a.record,
            description: a.before !== "—" ? `${a.before} → ${a.after}` : "",
          }))}
        />
      </SectionCard>
    </div>
  );
}