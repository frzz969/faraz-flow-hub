import { createFileRoute } from "@tanstack/react-router";
import { FileText, CalendarClock, Download, FileBarChart } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/farazz/page-header";
import { SectionCard } from "@/components/farazz/primitives";
import { Button } from "@/components/ui/button";
import { useData, useLookups } from "@/lib/farazz/store";
import { exportCSV } from "@/lib/farazz/export";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports — FARAZZ FLOW" },
      { name: "description", content: "Scheduled and on-demand operational reports." },
    ],
  }),
  component: ReportsPage,
});

const REPORT_TEMPLATES = [
  { name: "Shipment Performance Report", desc: "Created vs delivered volumes and on-time rate, grouped by hub.", schedule: "Daily · 06:00", format: "PDF / XLSX" },
  { name: "Warehouse Utilization Report", desc: "Capacity, inbound, sorting and outbound load per hub.", schedule: "Daily · 06:30", format: "XLSX" },
  { name: "Fleet Utilization Report", desc: "Vehicle assignment, fuel and service intervals.", schedule: "Weekly · Mon 07:00", format: "XLSX" },
  { name: "Financial Summary", desc: "Billing, invoices, payments and COD reconciliation.", schedule: "Monthly · 1st 06:00", format: "PDF" },
  { name: "Exception Report", desc: "All open and resolved exceptions with resolution time.", schedule: "Weekly · Fri 07:00", format: "PDF" },
  { name: "Driver Performance Report", desc: "Driver ratings, delivery counts and on-time delivery.", schedule: "Monthly · 1st 07:30", format: "PDF / XLSX" },
];

function ReportsPage() {
  const t = useT();
  const { db } = useData();
  const look = useLookups();

  const exportReport = (name: string) => {
    switch (name) {
      case "Shipment Performance Report":
        exportCSV(
          db.shipments.map((s) => ({
            tracking: s.tracking,
            customer: look.customer[s.customerId]?.name ?? "",
            origin: s.origin,
            destination: s.destination,
            status: s.status,
            eta: s.eta,
            weight: s.weight,
            charge: s.charge,
          })),
          [
            { key: "tracking", header: "Tracking" },
            { key: "customer", header: "Customer" },
            { key: "origin", header: "Origin" },
            { key: "destination", header: "Destination" },
            { key: "status", header: "Status" },
            { key: "eta", header: "ETA" },
            { key: "weight", header: "Weight (kg)" },
            { key: "charge", header: "Charge" },
          ],
          "shipment-performance.csv",
        );
        break;
      case "Warehouse Utilization Report":
        exportCSV(
          db.warehouses.map((w) => ({
            code: w.code,
            name: w.name,
            city: w.city,
            capacity: w.capacity,
            used: w.used,
            utilization: Math.round((w.used / w.capacity) * 100),
            inbound: w.inbound,
            sorting: w.sorting,
            outbound: w.outbound,
            status: w.status,
          })),
          [
            { key: "code", header: "Code" },
            { key: "name", header: "Name" },
            { key: "city", header: "City" },
            { key: "capacity", header: "Capacity" },
            { key: "used", header: "Used" },
            { key: "utilization", header: "Utilization %" },
            { key: "inbound", header: "Inbound" },
            { key: "sorting", header: "Sorting" },
            { key: "outbound", header: "Outbound" },
            { key: "status", header: "Status" },
          ],
          "warehouse-utilization.csv",
        );
        break;
      case "Fleet Utilization Report":
        exportCSV(
          db.vehicles.map((v) => ({
            code: v.code,
            model: v.model,
            plate: v.plate,
            type: v.type,
            driver: v.driverId ? look.driver[v.driverId]?.name ?? "" : "",
            route: v.routeId ? look.route[v.routeId]?.code ?? "" : "",
            status: v.status,
            fuel: v.fuel,
            nextServiceKm: v.nextServiceKm,
          })),
          [
            { key: "code", header: "Code" },
            { key: "model", header: "Model" },
            { key: "plate", header: "Plate" },
            { key: "type", header: "Type" },
            { key: "driver", header: "Driver" },
            { key: "route", header: "Route" },
            { key: "status", header: "Status" },
            { key: "fuel", header: "Fuel %" },
            { key: "nextServiceKm", header: "Next service (km)" },
          ],
          "fleet-utilization.csv",
        );
        break;
      case "Financial Summary":
        exportCSV(
          db.invoices.map((i) => ({
            code: i.code,
            customer: look.customer[i.customerId]?.name ?? "",
            issued: i.issued,
            due: i.due,
            total: i.total,
            tax: i.tax,
            status: i.status,
          })),
          [
            { key: "code", header: "Code" },
            { key: "customer", header: "Customer" },
            { key: "issued", header: "Issued" },
            { key: "due", header: "Due" },
            { key: "total", header: "Total" },
            { key: "tax", header: "Tax" },
            { key: "status", header: "Status" },
          ],
          "financial-summary.csv",
        );
        break;
      case "Exception Report":
        exportCSV(
          db.exceptions.map((e) => ({
            code: e.code,
            shipment: e.shipment,
            category: e.category,
            severity: e.severity,
            status: e.status,
            owner: e.owner,
            reason: e.reason,
            action: e.action,
          })),
          [
            { key: "code", header: "Code" },
            { key: "shipment", header: "Shipment" },
            { key: "category", header: "Category" },
            { key: "severity", header: "Severity" },
            { key: "status", header: "Status" },
            { key: "owner", header: "Owner" },
            { key: "reason", header: "Reason" },
            { key: "action", header: "Action" },
          ],
          "exception-report.csv",
        );
        break;
      case "Driver Performance Report":
        exportCSV(
          db.drivers.map((d) => ({
            code: d.code,
            name: d.name,
            phone: d.phone,
            rating: d.rating,
            deliveries: d.deliveries,
            status: d.status,
          })),
          [
            { key: "code", header: "Code" },
            { key: "name", header: "Name" },
            { key: "phone", header: "Phone" },
            { key: "rating", header: "Rating" },
            { key: "deliveries", header: "Deliveries" },
            { key: "status", header: "Status" },
          ],
          "driver-performance.csv",
        );
        break;
      default:
        exportCSV(
          db.shipments.map((s) => ({ tracking: s.tracking, status: s.status, updatedAt: s.updatedAt })),
          [
            { key: "tracking", header: "Tracking" },
            { key: "status", header: "Status" },
            { key: "updatedAt", header: "Last updated" },
          ],
          "report.csv",
        );
    }
    toast.success(`${name} exported.`);
  };

  const onDemand = (label: string) => {
    if (label === "Shipments today") {
      exportCSV(
        db.shipments.map((s) => ({
          tracking: s.tracking,
          customer: look.customer[s.customerId]?.name ?? "",
          status: s.status,
          currentLocation: s.currentLocation,
          eta: s.eta,
        })),
        [
          { key: "tracking", header: "Tracking" },
          { key: "customer", header: "Customer" },
          { key: "status", header: "Status" },
          { key: "currentLocation", header: "Location" },
          { key: "eta", header: "ETA" },
        ],
        "shipments-today.csv",
      );
    } else if (label === "Open exceptions") {
      exportCSV(
        db.exceptions.filter((e) => e.status !== "resolved").map((e) => ({
          code: e.code,
          shipment: e.shipment,
          category: e.category,
          severity: e.severity,
          status: e.status,
          owner: e.owner,
          reason: e.reason,
        })),
        [
          { key: "code", header: "Code" },
          { key: "shipment", header: "Shipment" },
          { key: "category", header: "Category" },
          { key: "severity", header: "Severity" },
          { key: "status", header: "Status" },
          { key: "owner", header: "Owner" },
          { key: "reason", header: "Reason" },
        ],
        "open-exceptions.csv",
      );
    } else {
      exportCSV(
        db.invoices.filter((i) => i.status !== "paid").map((i) => ({
          code: i.code,
          customer: look.customer[i.customerId]?.name ?? "",
          issued: i.issued,
          due: i.due,
          total: i.total,
          status: i.status,
        })),
        [
          { key: "code", header: "Code" },
          { key: "customer", header: "Customer" },
          { key: "issued", header: "Issued" },
          { key: "due", header: "Due" },
          { key: "total", header: "Total" },
          { key: "status", header: "Status" },
        ],
        "outstanding-invoices.csv",
      );
    }
    toast.success(`${label} report exported.`);
  };

  return (
    <div className="mx-auto max-w-[104rem] space-y-5">
      <PageHeader
        title={t("nav.reports")}
        description="Scheduled and on-demand operational reports."
        crumbs={[{ label: t("nav.analytics") }, { label: t("nav.reports") }]}
      />

      <SectionCard title="Report templates" subtitle={`${REPORT_TEMPLATES.length} available`}>
        <ul className="divide-y divide-border">
          {REPORT_TEMPLATES.map((r) => (
            <li key={r.name} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:gap-4">
              <div className="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)] items-start gap-2.5">
                <span className="mt-0.5 text-muted-foreground">
                  <FileBarChart className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{r.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{r.desc}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <CalendarClock className="h-3.5 w-3.5" aria-hidden /> {r.schedule}
                </span>
                <span className="hidden sm:inline">{r.format}</span>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => exportReport(r.name)}>
                  <Download className="h-3.5 w-3.5" aria-hidden /> Export
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="On-demand reports" subtitle="Generate a report for the current data snapshot">
        <div className="grid gap-3 sm:grid-cols-3">
          {["Shipments today", "Open exceptions", "Outstanding invoices"].map((label) => (
            <Button
              key={label}
              variant="outline"
              className="justify-start gap-2"
              onClick={() => onDemand(label)}
            >
              <FileText className="h-4 w-4 text-muted-foreground" aria-hidden />
              {label}
            </Button>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}