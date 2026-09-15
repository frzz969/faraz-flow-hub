import { createFileRoute } from "@tanstack/react-router";
import { Receipt, Scale, Coins } from "lucide-react";
import { PageHeader } from "@/components/farazz/page-header";
import { DataTable, type Column } from "@/components/farazz/data-table";
import { KpiCard } from "@/components/farazz/primitives";
import { StatusBadge } from "@/components/farazz/status-badge";
import { useData, useLookups, formatIDR } from "@/lib/farazz/store";
import { useT } from "@/lib/i18n";
import type { PricingRule } from "@/lib/farazz/data";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — FARAZZ FLOW" },
      { name: "description", content: "Pricing rules and rate cards per service and zone." },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  const t = useT();
  const { db } = useData();
  const look = useLookups();

  const avgRate = Math.round(db.pricingRules.reduce((acc, p) => acc + p.rate, 0) / Math.max(1, db.pricingRules.length));

  const columns: Column<PricingRule>[] = [
    { key: "code", header: "Code", value: (p) => p.code, className: "num" },
    { key: "name", header: t("common.name"), value: (p) => p.name, render: (p) => <span className="font-medium text-foreground">{p.name}</span> },
    { key: "service", header: t("common.service"), value: (p) => look.service[p.serviceId]?.name ?? "—", hideOnMobile: true },
    { key: "zone", header: "Zone", value: (p) => p.zone, hideOnMobile: true },
    { key: "range", header: "Weight range", value: (p) => `${p.minKg}–${p.maxKg} kg`, render: (p) => <span className="num">{p.minKg}–{p.maxKg} kg</span>, hideOnMobile: true },
    { key: "rate", header: "Rate", value: (p) => p.rate, render: (p) => <span className="num">{formatIDR(p.rate)}</span>, align: "right" },
    { key: "status", header: t("common.status"), value: (p) => (p.active ? "active" : "inactive"), render: (p) => <StatusBadge value={p.active ? "active" : "inactive"} /> },
  ];

  return (
    <div className="mx-auto max-w-[104rem] space-y-5">
      <PageHeader
        title={t("nav.pricing")}
        description="Pricing rules and rate cards per service and zone."
        crumbs={[{ label: t("nav.business") }, { label: t("nav.pricing") }]}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Active rules" value={String(db.pricingRules.filter((p) => p.active).length)} tone="info" icon={<Receipt className="h-4 w-4" />} />
        <KpiCard label="Avg rate" value={formatIDR(avgRate) + "/kg"} tone="info" icon={<Coins className="h-4 w-4" />} />
        <KpiCard label="Zones covered" value={String(new Set(db.pricingRules.map((p) => p.zone)).size)} tone="info" icon={<Scale className="h-4 w-4" />} />
      </div>

      <DataTable
        rows={db.pricingRules}
        columns={columns}
        searchKeys={(p) => `${p.code} ${p.name} ${look.service[p.serviceId]?.name ?? ""} ${p.zone}`}
        searchPlaceholder="Search code, name, zone…"
      />
    </div>
  );
}