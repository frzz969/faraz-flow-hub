import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Search, PackageSearch, Truck, MapPin, Clock, User } from "lucide-react";
import { PageHeader } from "@/components/farazz/page-header";
import { SectionCard, Field } from "@/components/farazz/primitives";
import { StatusBadge } from "@/components/farazz/status-badge";
import { Timeline } from "@/components/farazz/timeline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useData, useLookups } from "@/lib/farazz/store";

interface TrackingSearch {
  q?: string | undefined;
}

export const Route = createFileRoute("/tracking")({
  validateSearch: (search: Record<string, unknown>): TrackingSearch => ({
    q: typeof search["q"] === "string" && search["q"].length > 0 ? search["q"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Tracking — FARAZZ FLOW" },
      { name: "description", content: "Track any shipment by its tracking number." },
    ],
  }),
  component: TrackingPage,
});

function TrackingPage() {
  const search = useSearch({ from: "/tracking" });
  const q = typeof search["q"] === "string" ? search["q"] : undefined;
  const { db } = useData();
  const look = useLookups();
  const [query, setQuery] = useState(q ?? "");
  const [found, setFound] = useState<typeof db.shipments[0] | null>(null);
  const [searched, setSearched] = useState(false);

  // Auto-track when arriving with a ?q= parameter
  useEffect(() => {
    if (!q) return;
    setQuery(q);
    const shipment = db.shipments.find(
      (s) => s.tracking.toLowerCase() === q.toLowerCase() || s.id.toLowerCase() === q.toLowerCase()
    );
    setFound(shipment ?? null);
    setSearched(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const handleTrack = () => {
    const q = query.trim().toLowerCase();
    if (!q) return;
    const shipment = db.shipments.find(
      (s) => s.tracking.toLowerCase() === q || s.id.toLowerCase() === q
    );
    setFound(shipment ?? null);
    setSearched(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleTrack();
  };

  const flowSteps = ["created", "picked_up", "at_origin_hub", "sorting", "dispatched", "in_transit", "at_destination_hub", "out_for_delivery", "delivered"];

  return (
    <div className="mx-auto max-w-[64rem] space-y-5">
      <PageHeader
        title="Track Shipment"
        description="Enter a tracking number to see the current status and journey of your package."
        crumbs={[{ label: "Operations" }, { label: "Tracking" }]}
      />

      {/* Search */}
      <SectionCard>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter tracking number (e.g. NX-928173)"
              className="h-10 pl-9 text-sm"
              aria-label="Tracking number"
            />
          </div>
          <Button onClick={handleTrack} className="gap-1.5" disabled={!query.trim()}>
            <PackageSearch className="h-4 w-4" /> Track Package
          </Button>
        </div>
      </SectionCard>

      {/* Not found */}
      {searched && !found && (
        <SectionCard>
          <div className="py-8 text-center">
            <PackageSearch className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium text-foreground">Tracking number not found</p>
            <p className="mt-1 text-xs text-muted-foreground">
              No shipment matches "{query}". Please check the tracking number and try again.
            </p>
          </div>
        </SectionCard>
      )}

      {/* Found */}
      {found && (
        <>
          {/* Status banner */}
          <div className="rounded-lg border border-border bg-card p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="num text-lg font-semibold">{found.tracking}</h2>
                  <StatusBadge value={found.status} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {found.origin} → {found.destination} · {look.service[found.serviceId]?.name ?? "—"}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" aria-hidden />
                Last updated: {found.updatedAt}
              </div>
            </div>
          </div>

          {/* Current status */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SectionCard>
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-info-soft text-info"><PackageSearch className="h-5 w-5" /></span>
                <div>
                  <p className="text-xs text-muted-foreground">Current Status</p>
                  <p className="text-sm font-medium capitalize">{found.status.replace(/_/g, " ")}</p>
                </div>
              </div>
            </SectionCard>
            <SectionCard>
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-success-soft text-success"><MapPin className="h-5 w-5" /></span>
                <div>
                  <p className="text-xs text-muted-foreground">Current Location</p>
                  <p className="text-sm font-medium">{found.currentLocation}</p>
                </div>
              </div>
            </SectionCard>
            <SectionCard>
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-warning-soft text-warning"><Clock className="h-5 w-5" /></span>
                <div>
                  <p className="text-xs text-muted-foreground">Estimated Delivery</p>
                  <p className="text-sm font-medium">{found.eta}</p>
                </div>
              </div>
            </SectionCard>
            <SectionCard>
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-info-soft text-info"><Truck className="h-5 w-5" /></span>
                <div>
                  <p className="text-xs text-muted-foreground">Courier</p>
                  <p className="text-sm font-medium">{look.driver[found.driverId]?.name ?? "—"}</p>
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Journey flow */}
          <SectionCard title="Journey Progress" subtitle="Status flow overview">
            <div className="flex flex-wrap items-center gap-1.5">
              {flowSteps.map((step, i) => {
                const currentIdx = flowSteps.indexOf(found.status);
                const isDone = i <= currentIdx;
                const isCurrent = i === currentIdx;
                return (
                  <div key={step} className="flex items-center gap-1.5">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${isCurrent ? "bg-primary text-primary-foreground" : isDone ? "bg-success-soft text-success" : "bg-muted text-muted-foreground"}`}>
                      {step.replace(/_/g, " ")}
                    </span>
                    {i < flowSteps.length - 1 && <span className="text-muted-foreground/30">→</span>}
                  </div>
                );
              })}
            </div>
          </SectionCard>

          {/* Details */}
          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard title="Shipment Details">
              <dl className="grid grid-cols-2 gap-4">
                <Field label="Customer" value={look.customer[found.customerId]?.name ?? "—"} />
                <Field label="Service" value={look.service[found.serviceId]?.name ?? "—"} />
                <Field label="Origin" value={found.origin} />
                <Field label="Destination" value={found.destination} />
                <Field label="Weight" value={`${found.weight} kg`} mono />
                <Field label="Pieces" value={String(found.pieces)} mono />
                <Field label="Contents" value={found.contents} />
                <Field label="Charge" value={`Rp ${found.charge.toLocaleString("id-ID")}`} mono />
              </dl>
            </SectionCard>

            <SectionCard title="Vehicle & Driver">
              <dl className="grid grid-cols-2 gap-4">
                <Field label="Driver" value={look.driver[found.driverId]?.name ?? "—"} />
                <Field label="Vehicle" value={look.vehicle[found.vehicleId]?.code ?? "—"} mono />
                <Field label="Vehicle Model" value={look.vehicle[found.vehicleId]?.model ?? "—"} />
                <Field label="Route" value={look.route[found.routeId]?.code ?? "—"} mono />
              </dl>
            </SectionCard>
          </div>

          {/* Timeline */}
          <SectionCard title="Tracking Timeline" subtitle="Complete journey history">
            <Timeline
              items={found.events.map((e) => ({
                title: e.label,
                timestamp: e.timestamp,
                location: e.location,
                operator: e.operator,
                state: e.status === found.status ? "current" as const : "done" as const,
              }))}
            />
          </SectionCard>
        </>
      )}

      {/* Recent shipments hint */}
      {!searched && (
        <SectionCard title="Quick Track" subtitle="Click a recent shipment to track it">
          <div className="flex flex-wrap gap-2">
            {db.shipments.slice(0, 8).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => { setQuery(s.tracking); setFound(s); setSearched(true); }}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <StatusBadge value={s.status} dot={false} className="text-[10px]" />
                {s.tracking}
              </button>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
