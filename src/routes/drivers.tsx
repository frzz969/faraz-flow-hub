import { createFileRoute } from "@tanstack/react-router";
import { Contact, Route as RouteIcon, Users } from "lucide-react";
import { PageHeader } from "@/components/farazz/page-header";
import { DataTable, type Column } from "@/components/farazz/data-table";
import { KpiCard } from "@/components/farazz/primitives";
import { StatusBadge } from "@/components/farazz/status-badge";
import { useData, useLookups, formatNum } from "@/lib/farazz/store";
import { useT } from "@/lib/i18n";
import type { Driver } from "@/lib/farazz/data";

export const Route = createFileRoute("/drivers")({
  head: () => ({
    meta: [
      { title: "Drivers — FARAZZ FLOW" },
      { name: "description", content: "Driver profiles, licenses, ratings and availability." },
    ],
  }),
  component: DriversPage,
});

function DriversPage() {
  const t = useT();
  const { db } = useData();
  const look = useLookups();

  const onRoute = db.drivers.filter((d) => d.status === "on_route").length;
  const available = db.drivers.filter((d) => d.status === "available").length;

  const columns: Column<Driver>[] = [
    { key: "code", header: "Code", value: (d) => d.code, className: "num" },
    { key: "name", header: t("common.name"), value: (d) => d.name, render: (d) => <span className="font-medium text-foreground">{d.name}</span> },
    { key: "phone", header: t("common.phone"), value: (d) => d.phone, className: "num", hideOnMobile: true },
    { key: "license", header: "License", value: (d) => d.license, hideOnMobile: true },
    { key: "base", header: "Base", value: (d) => look.warehouse[d.baseWarehouseId]?.code ?? "—", className: "num", hideOnMobile: true },
    { key: "rating", header: "Rating", value: (d) => d.rating, render: (d) => <span className="num">{d.rating.toFixed(1)} ★</span>, align: "right" },
    { key: "deliveries", header: "Deliveries", value: (d) => d.deliveries, render: (d) => <span className="num">{formatNum(d.deliveries)}</span>, align: "right", hideOnMobile: true },
    { key: "status", header: t("common.status"), value: (d) => d.status, render: (d) => <StatusBadge value={d.status} /> },
  ];

  const statusOptions = Array.from(new Set(db.drivers.map((d) => d.status))).map((v) => ({ value: v, label: t(`status.${v}`, v) }));

  return (
    <div className="mx-auto max-w-[104rem] space-y-5">
      <PageHeader
        title={t("nav.drivers")}
        description="Driver profiles, licenses, ratings and availability."
        crumbs={[{ label: t("nav.fleet") }, { label: t("nav.drivers") }]}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Total drivers" value={String(db.drivers.length)} tone="info" icon={<Contact className="h-4 w-4" />} />
        <KpiCard label="On route" value={String(onRoute)} tone="info" icon={<RouteIcon className="h-4 w-4" />} />
        <KpiCard label="Available" value={String(available)} tone="success" icon={<Users className="h-4 w-4" />} />
      </div>

      <DataTable
        rows={db.drivers}
        columns={columns}
        searchKeys={(d) => `${d.code} ${d.name} ${d.phone} ${d.license}`}
        searchPlaceholder="Search code, name, phone…"
        filters={[{ id: "status", label: t("common.status"), options: statusOptions, accessor: (d) => d.status }]}
      />
    </div>
  );
}