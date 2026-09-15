import { useState, useMemo, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, X, PackageSearch, Contact, Truck, Building2, Warehouse as WarehouseIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useData } from "@/lib/farazz/store";

interface SearchResult {
  type: string;
  label: string;
  sublabel: string;
  to: string;
  icon: ReactNode;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { db } = useData();
  const navigate = useNavigate();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const items: SearchResult[] = [];

    // Search shipments
    db.shipments.forEach((s) => {
      if (`${s.tracking} ${s.origin} ${s.destination} ${s.contents} ${s.status}`.toLowerCase().includes(q)) {
        items.push({ type: "Shipment", label: s.tracking, sublabel: `${s.origin} → ${s.destination} · ${s.status}`, to: "/shipments", icon: <PackageSearch className="h-4 w-4" /> });
      }
    });

    // Search customers
    db.customers.forEach((c) => {
      if (`${c.name} ${c.code} ${c.city} ${c.contact} ${c.email}`.toLowerCase().includes(q)) {
        items.push({ type: "Customer", label: c.name, sublabel: `${c.code} · ${c.city}`, to: "/customers", icon: <Building2 className="h-4 w-4" /> });
      }
    });

    // Search drivers
    db.drivers.forEach((d) => {
      if (`${d.name} ${d.code} ${d.phone}`.toLowerCase().includes(q)) {
        items.push({ type: "Driver", label: d.name, sublabel: `${d.code} · ${d.status}`, to: "/drivers", icon: <Contact className="h-4 w-4" /> });
      }
    });

    // Search vehicles
    db.vehicles.forEach((v) => {
      if (`${v.code} ${v.model} ${v.plate} ${v.type}`.toLowerCase().includes(q)) {
        items.push({ type: "Vehicle", label: v.code, sublabel: `${v.model} · ${v.plate}`, to: "/vehicles", icon: <Truck className="h-4 w-4" /> });
      }
    });

    // Search warehouses
    db.warehouses.forEach((w) => {
      if (`${w.name} ${w.code} ${w.city}`.toLowerCase().includes(q)) {
        items.push({ type: "Warehouse", label: w.name, sublabel: `${w.code} · ${w.city}`, to: "/warehouses", icon: <WarehouseIcon className="h-4 w-4" /> });
      }
    });

    return items.slice(0, 12);
  }, [query, db]);

  const handleSelect = (to: string) => {
    setOpen(false);
    setQuery("");
    navigate({ to });
  };

  return (
    <div className="relative hidden max-w-md min-w-0 flex-1 lg:block">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 w-full items-center gap-2 rounded-md border border-border bg-background px-3 text-sm text-muted-foreground transition-colors hover:bg-accent"
        aria-label="Search"
      >
        <Search className="h-4 w-4 shrink-0" aria-hidden />
        <span className="truncate">Search orders, customers, drivers…</span>
        <kbd className="ml-auto hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline">⌘K</kbd>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50" onClick={() => { setOpen(false); setQuery(""); }} />
          <div className="fixed left-1/2 top-[15%] z-50 w-full max-w-lg -translate-x-1/2 rounded-xl border border-border bg-card shadow-2xl">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search shipments, customers, drivers, vehicles…"
                className="h-8 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
                aria-label="Global search"
              />
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => { setOpen(false); setQuery(""); }} aria-label="Close search">
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {query.trim().length < 2 ? (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">Type at least 2 characters to search…</p>
              ) : results.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">No results found for "{query}"</p>
              ) : (
                <ul className="space-y-0.5">
                  {results.map((r, i) => (
                    <li key={`${r.type}-${r.label}-${i}`}>
                      <button
                        type="button"
                        onClick={() => handleSelect(r.to)}
                        className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-accent"
                      >
                        <span className="shrink-0 text-muted-foreground">{r.icon}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">{r.label}</p>
                          <p className="text-xs text-muted-foreground truncate">{r.type} · {r.sublabel}</p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
