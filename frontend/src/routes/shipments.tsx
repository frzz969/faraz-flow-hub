import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PackageSearch, Truck, PackageCheck, Clock, Plus, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/farazz/page-header";
import { DataTable, type Column } from "@/components/farazz/data-table";
import { KpiCard, Field, SectionCard } from "@/components/farazz/primitives";
import { StatusBadge } from "@/components/farazz/status-badge";
import { Timeline } from "@/components/farazz/timeline";
import { ExportButton } from "@/components/farazz/export-button";
import { useData, useLookups, formatNum } from "@/lib/farazz/store";
import { useT } from "@/lib/i18n";
import type { Shipment } from "@/lib/farazz/data";

export const Route = createFileRoute("/shipments")({
  head: () => ({
    meta: [
      { title: "Shipments — FARAZZ FLOW" },
      { name: "description", content: "Track and manage all shipments across the FARAZZ FLOW network." },
    ],
  }),
  component: ShipmentsPage,
});

function ShipmentsPage() {
  const t = useT();
  const navigate = useNavigate();
  const { db } = useData();
  const look = useLookups();
  const [selected, setSelected] = useState<Shipment | null>(null);

  const inTransit = db.shipments.filter((s) => s.status === "in_transit").length;
  const delivered = db.shipments.filter((s) => s.status === "delivered").length;
  const delayed = db.shipments.filter((s) => s.status === "delayed").length;

  const columns: Column<Shipment>[] = [
    { key: "tracking", header: "Tracking", value: (s) => s.tracking, className: "num" },
    {
      key: "customer",
      header: t("common.customer"),
      value: (s) => look.customer[s.customerId]?.name ?? "—",
      render: (s) => <span className="font-medium text-foreground">{look.customer[s.customerId]?.name ?? "—"}</span>,
    },
    { key: "origin", header: t("common.origin"), value: (s) => s.origin, hideOnMobile: true },
    { key: "destination", header: t("common.destination"), value: (s) => s.destination, hideOnMobile: true },
    { key: "service", header: t("common.service"), value: (s) => look.service[s.serviceId]?.name ?? "—", hideOnMobile: true },
    { key: "weight", header: t("common.weight"), value: (s) => s.weight, render: (s) => <span className="num">{formatNum(s.weight)} kg</span>, align: "right", hideOnMobile: true },
    { key: "status", header: t("common.status"), value: (s) => s.status, render: (s) => <StatusBadge value={s.status} /> },
    { key: "eta", header: t("common.eta"), value: (s) => s.eta, hideOnMobile: true },
  ];

  const statusOptions = Array.from(new Set(db.shipments.map((s) => s.status))).map((v) => ({ value: v, label: t(`status.${v}`, v) }));

  return (
    <div className="mx-auto max-w-[104rem] space-y-5">
      <PageHeader
        title={t("nav.shipments")}
        description="Track and manage all shipments across the network."
        crumbs={[{ label: t("nav.operations") }, { label: t("nav.shipments") }]}
        actions={
          <Button size="sm" onClick={() => navigate({ to: "/shipments-create" })} className="gap-1.5">
            <Plus className="h-4 w-4" /> New Shipment
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label={t("dash.kpi.shipments")} value={formatNum(db.shipments.length)} tone="info" icon={<PackageSearch className="h-4 w-4" />} />
        <KpiCard label={t("dash.kpi.inTransit")} value={formatNum(inTransit)} tone="info" icon={<Truck className="h-4 w-4" />} />
        <KpiCard label={t("dash.kpi.delivered")} value={formatNum(delivered)} tone="success" icon={<PackageCheck className="h-4 w-4" />} />
        <KpiCard label="Delayed" value={formatNum(delayed)} tone="critical" icon={<Clock className="h-4 w-4" />} />
        <KpiCard label="Exceptions" value={formatNum(db.shipments.filter((s) => s.status === "exception").length)} tone="warning" icon={<PackageSearch className="h-4 w-4" />} />
      </div>

      <DataTable
        rows={db.shipments}
        columns={columns}
        searchKeys={(s) => `${s.tracking} ${look.customer[s.customerId]?.name ?? ""} ${s.destination} ${s.origin}`}
        searchPlaceholder="Search tracking, customer, destination…"
        filters={[{ id: "status", label: t("common.status"), options: statusOptions, accessor: (s) => s.status }]}
        onRowClick={setSelected}
        toolbarExtra={
          <ExportButton
            rows={db.shipments}
            columns={[
              { key: "tracking", header: "Tracking", value: (s) => s.tracking },
              { key: "customer", header: "Customer", value: (s) => look.customer[s.customerId]?.name ?? "" },
              { key: "origin", header: "Origin", value: (s) => s.origin },
              { key: "destination", header: "Destination", value: (s) => s.destination },
              { key: "weight", header: "Weight (kg)", value: (s) => s.weight },
              { key: "status", header: "Status", value: (s) => s.status },
              { key: "eta", header: "ETA", value: (s) => s.eta },
            ]}
            filename="shipments.csv"
          />
        }
        rowActions={(s) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                navigate({ to: "/tracking", search: { q: s.tracking } });
              }}
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              Track
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
                  <span className="num">Shipment {selected.tracking}</span>
                  <StatusBadge value={selected.status} />
                </DialogTitle>
              </DialogHeader>
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Field label={t("common.customer")} value={look.customer[selected.customerId]?.name ?? "—"} />
                <Field label={t("common.origin")} value={selected.origin} />
                <Field label={t("common.destination")} value={selected.destination} />
                <Field label={t("common.service")} value={look.service[selected.serviceId]?.name ?? "—"} />
                <Field label={t("common.weight")} value={`${formatNum(selected.weight)} kg`} mono />
                <Field label="Pieces" value={formatNum(selected.pieces)} mono />
                <Field label="Contents" value={selected.contents} />
                <Field label="Current location" value={selected.currentLocation} />
                <Field label={t("common.eta")} value={selected.eta} />
                <Field label="Charge" value={"Rp " + formatNum(selected.charge)} mono />
              </dl>
              <SectionCard title={t("common.timeline")}>
                <Timeline
                  items={selected.events.map((e) => ({
                    title: e.label,
                    timestamp: e.timestamp,
                    location: e.location,
                    operator: e.operator,
                  }))}
                />
              </SectionCard>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
