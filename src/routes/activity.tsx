import { createFileRoute } from "@tanstack/react-router";
import { Activity, Users, Bell } from "lucide-react";
import { PageHeader } from "@/components/farazz/page-header";
import { KpiCard, SectionCard } from "@/components/farazz/primitives";
import { Timeline } from "@/components/farazz/timeline";
import { useData, formatNum } from "@/lib/farazz/store";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/activity")({
  head: () => ({
    meta: [
      { title: "Activity Log — FARAZZ FLOW" },
      { name: "description", content: "Recent operational activity across all modules." },
    ],
  }),
  component: ActivityPage,
});

function ActivityPage() {
  const t = useT();
  const { db } = useData();

  const uniqueUsers = new Set(db.activity.map((a) => a.user)).size;
  const uniqueModules = new Set(db.activity.map((a) => a.module)).size;

  return (
    <div className="mx-auto max-w-[104rem] space-y-5">
      <PageHeader
        title={t("nav.activityLog")}
        description="Recent operational activity across all modules."
        crumbs={[{ label: t("nav.workspace") }, { label: t("nav.activityLog") }]}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Events" value={formatNum(db.activity.length)} tone="info" icon={<Activity className="h-4 w-4" />} />
        <KpiCard label="Users active" value={String(uniqueUsers)} tone="info" icon={<Users className="h-4 w-4" />} />
        <KpiCard label="Modules touched" value={String(uniqueModules)} tone="info" icon={<Bell className="h-4 w-4" />} />
      </div>

      <SectionCard title={t("dash.recentActivity")} subtitle={`${formatNum(db.activity.length)} events`}>
        <Timeline
          items={db.activity.map((a) => ({
            title: `${a.user} — ${a.action}`,
            timestamp: a.time,
            location: a.module,
            operator: a.record,
            description: a.before !== "—" ? `${a.before} → ${a.after}` : "",
            state: "done" as const,
          }))}
        />
      </SectionCard>
    </div>
  );
}