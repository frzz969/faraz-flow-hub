import { createFileRoute } from "@tanstack/react-router";
import { ListChecks, Clock, Tag } from "lucide-react";
import { PageHeader } from "@/components/farazz/page-header";
import { DataTable, type Column } from "@/components/farazz/data-table";
import { KpiCard } from "@/components/farazz/primitives";
import { StatusBadge } from "@/components/farazz/status-badge";
import { useData, formatIDR } from "@/lib/farazz/store";
import { useT } from "@/lib/i18n";
import type { ServiceType } from "@/lib/farazz/data";

export const Route = createFileRoute("/service-types")({
  head: () => ({
    meta: [
      { title: "Service Types — FARAZZ FLOW" },
      { name: "description", content: "Service offerings, SLA and rate structures." },
    ],
  }),
  component: ServiceTypesPage,
});

function ServiceTypesPage() {
  const t = useT();
  const { db } = useData();

  const columns: Column<ServiceType>[] = [
    { key: "code", header: "Code", value: (s) => s.code, className: "num", render: (s) => <span className="num font-medium text-foreground">{s.code}</span> },
    { key: "name", header: t("common.name"), value: (s) => s.name },
    { key: "sla", header: "SLA", value: (s) => s.slaHours, render: (s) => <span className="num">{s.slaHours} hours</span>, align: "right" },
    { key: "base", header: "Base rate", value: (s) => s.baseRate, render: (s) => <span className="num">{formatIDR(s.baseRate)}</span>, align: "right" },
    { key: "perKg", header: "Per kg", value: (s) => s.perKg, render: (s) => <span className="num">{formatIDR(s.perKg)}</span>, align: "right" },
    { key: "status", header: t("common.status"), value: (s) => (s.active ? "active" : "inactive"), render: (s) => <StatusBadge value={s.active ? "active" : "inactive"} /> },
  ];

  return (
    <div className="mx-auto max-w-[104rem] space-y-5">
      <PageHeader
        title={t("nav.serviceTypes")}
        description="Service offerings, SLA and rate structures."
        crumbs={[{ label: t("nav.business") }, { label: t("nav.serviceTypes") }]}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Active services" value={String(db.serviceTypes.filter((s) => s.active).length)} tone="info" icon={<ListChecks className="h-4 w-4" />} />
        <KpiCard label="Fastest SLA" value={Math.min(...db.serviceTypes.map((s) => s.slaHours)) + "h"} tone="info" icon={<Clock className="h-4 w-4" />} />
        <KpiCard label="From base rate" value={formatIDR(Math.min(...db.serviceTypes.map((s) => s.baseRate)))} tone="info" icon={<Tag className="h-4 w-4" />} />
      </div>

      <DataTable
        rows={db.serviceTypes}
        columns={columns}
        searchKeys={(s) => `${s.code} ${s.name}`}
        searchPlaceholder="Search code, name…"
      />
    </div>
  );
}