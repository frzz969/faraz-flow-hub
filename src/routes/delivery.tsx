import { createFileRoute } from "@tanstack/react-router";
import { Truck, PackageCheck, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/farazz/page-header";
import { DataTable, type Column } from "@/components/farazz/data-table";
import { KpiCard } from "@/components/farazz/primitives";
import { StatusBadge } from "@/components/farazz/status-badge";
import { useData, useLookups } from "@/lib/farazz/store";
import { useT } from "@/lib/i18n";
import type { Delivery } from "@/lib/farazz/data";

export const Route = createFileRoute("/delivery")({
  head: () => ({
    meta: [
      { title: "Delivery — FARAZZ FLOW" },
      { name: "description", content: "Delivery orders, drivers and proof of delivery across the network." },
    ],
  }),
  component: DeliveryPage,
});

function DeliveryPage() {
  const t = useT();
  const { db } = useData();
  const look = useLookups();

  const outForDelivery = db.deliveries.filter((d) => d.status === "out_for_delivery").length;
  const delivered = db.deliveries.filter((d) => d.status === "delivered").length;
  const failed = db.deliveries.filter((d) => d.status === "failed").length;

  const columns: Column<Delivery>[] = [
    { key: "code", header: "Code", value: (d) => d.code, className: "num" },
    { key: "shipment", header: "Shipment", value: (d) => d.shipment, render: (d) => <span className="num">{d.shipment}</span> },
    {
      key: "customer",
      header: t("common.customer"),
      value: (d) => look.customer[d.customerId]?.name ?? "—",
      render: (d) => <span className="font-medium text-foreground">{look.customer[d.customerId]?.name ?? "—"}</span>,
    },
    { key: "address", header: "Address", value: (d) => d.address, className: "max-w-[16rem] truncate", hideOnMobile: true },
    {
      key: "driver",
      header: t("common.driver"),
      value: (d) => look.driver[d.driverId]?.name ?? "—",
      render: (d) => look.driver[d.driverId]?.name ?? "—",
      hideOnMobile: true,
    },
    { key: "packages", header: "Packages", value: (d) => d.packages, render: (d) => <span className="num">{d.packages}</span>, align: "right", hideOnMobile: true },
    { key: "window", header: "Window", value: (d) => d.window, hideOnMobile: true },
    { key: "status", header: t("common.status"), value: (d) => d.status, render: (d) => <StatusBadge value={d.status} /> },
  ];

  const statusOptions = Array.from(new Set(db.deliveries.map((d) => d.status))).map((v) => ({ value: v, label: t(`status.${v}`, v) }));

  return (
    <div className="mx-auto max-w-[104rem] space-y-5">
      <PageHeader
        title={t("nav.delivery")}
        description="Delivery orders, drivers and proof of delivery across the network."
        crumbs={[{ label: t("nav.operations") }, { label: t("nav.delivery") }]}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Total deliveries" value={String(db.deliveries.length)} tone="info" icon={<Truck className="h-4 w-4" />} />
        <KpiCard label="Out for delivery" value={String(outForDelivery)} tone="info" icon={<Truck className="h-4 w-4" />} />
        <KpiCard label="Delivered" value={String(delivered)} tone="success" icon={<PackageCheck className="h-4 w-4" />} />
        <KpiCard label="Failed" value={String(failed)} tone="critical" icon={<RotateCcw className="h-4 w-4" />} />
      </div>

      <DataTable
        rows={db.deliveries}
        columns={columns}
        searchKeys={(d) => `${d.code} ${d.shipment} ${look.customer[d.customerId]?.name ?? ""} ${d.address}`}
        searchPlaceholder="Search code, shipment, address…"
        filters={[{ id: "status", label: t("common.status"), options: statusOptions, accessor: (d) => d.status }]}
      />
    </div>
  );
}