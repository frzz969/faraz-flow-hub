import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as seed from "./data";

export type CollectionKey =
  | "warehouses"
  | "customers"
  | "suppliers"
  | "serviceTypes"
  | "vehicles"
  | "drivers"
  | "routes"
  | "categories"
  | "products"
  | "stockMovements"
  | "shipments"
  | "orders"
  | "deliveries"
  | "exceptions"
  | "returns"
  | "inbound"
  | "sorting"
  | "outbound"
  | "invoices"
  | "payments"
  | "cods"
  | "users"
  | "approvals"
  | "tasks"
  | "documents"
  | "activity"
  | "auditLog"
  | "contracts"
  | "pricingRules";

export interface DBState {
  warehouses: seed.Warehouse[];
  customers: seed.Customer[];
  suppliers: seed.Supplier[];
  serviceTypes: seed.ServiceType[];
  vehicles: seed.Vehicle[];
  drivers: seed.Driver[];
  routes: seed.RouteRec[];
  categories: seed.Category[];
  products: seed.Product[];
  stockMovements: seed.StockMovement[];
  shipments: seed.Shipment[];
  orders: seed.Order[];
  deliveries: seed.Delivery[];
  exceptions: seed.ExceptionRec[];
  returns: seed.ReturnRec[];
  inbound: seed.InboundRec[];
  sorting: seed.SortingRec[];
  outbound: seed.OutboundRec[];
  invoices: seed.Invoice[];
  payments: seed.Payment[];
  cods: seed.CodRec[];
  users: seed.UserRec[];
  approvals: seed.Approval[];
  tasks: seed.TaskRec[];
  documents: seed.DocumentRec[];
  activity: seed.ActivityRec[];
  auditLog: seed.ActivityRec[];
  contracts: seed.ContractRec[];
  pricingRules: seed.PricingRule[];
  permissions: seed.PermissionMatrix;
  company: seed.CompanyProfile;
}

function initialState(): DBState {
  return {
    warehouses: seed.warehouses,
    customers: seed.customers,
    suppliers: seed.suppliers,
    serviceTypes: seed.serviceTypes,
    vehicles: seed.vehicles,
    drivers: seed.drivers,
    routes: seed.routes,
    categories: seed.categories,
    products: seed.products,
    stockMovements: seed.stockMovements,
    shipments: seed.shipments,
    orders: seed.orders,
    deliveries: seed.deliveries,
    exceptions: seed.exceptions,
    returns: seed.returns,
    inbound: seed.inbound,
    sorting: seed.sorting,
    outbound: seed.outbound,
    invoices: seed.invoices,
    payments: seed.payments,
    cods: seed.cods,
    users: seed.users,
    approvals: seed.approvals,
    tasks: seed.tasks,
    documents: seed.documents,
    activity: seed.activity,
    auditLog: seed.auditLog,
    contracts: seed.contracts,
    pricingRules: seed.pricingRules,
    permissions: seed.permissionMatrix,
    company: seed.companyProfile,
  };
}

const STORAGE_KEY = "nexora.db.v1";

type AnyRec = { id: string; [k: string]: unknown };

interface DataValue {
  db: DBState;
  create: (col: CollectionKey, record: Record<string, unknown>, label?: string) => string;
  update: (col: CollectionKey, id: string, patch: Record<string, unknown>, label?: string) => void;
  remove: (col: CollectionKey, id: string, label?: string) => void;
  toggleActive: (col: CollectionKey, id: string, label?: string) => void;
  setPermission: (role: string, module: string, level: string, on: boolean) => void;
  updateCompany: (patch: Partial<seed.CompanyProfile>) => void;
  resetDemo: () => void;
}

const DataContext = createContext<DataValue | null>(null);

const MODULE_LABEL: Partial<Record<CollectionKey, string>> = {
  warehouses: "Warehouses",
  customers: "Customers",
  suppliers: "Suppliers",
  serviceTypes: "Service Types",
  vehicles: "Vehicles",
  drivers: "Drivers",
  routes: "Routes",
  products: "Products",
  categories: "Categories",
  users: "Users",
  pricingRules: "Pricing",
  contracts: "Contracts",
};

export function DataProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DBState>(() => initialState());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setDb({ ...initialState(), ...(JSON.parse(raw) as DBState) });
    } catch {
      /* ignore corrupted local state */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch {
      /* storage full — prototype state stays in memory */
    }
  }, [db, hydrated]);

  const audit = useCallback(
    (state: DBState, action: string, col: CollectionKey, record: string, before: string, after: string): DBState => {
      const now = new Date();
      const entry: seed.ActivityRec = {
        id: `aud-${now.getTime()}`,
        time: now.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).replace(",", " ·"),
        user: "Dimas Prakoso",
        action,
        module: MODULE_LABEL[col] ?? col,
        record,
        before,
        after,
      };
      return { ...state, auditLog: [entry, ...state.auditLog].slice(0, 200), activity: [entry, ...state.activity].slice(0, 200) };
    },
    [],
  );

  const create: DataValue["create"] = useCallback(
    (col, record, label) => {
      const id = `${col}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      setDb((prev) => {
        const list = [{ id, active: true, ...record } as AnyRec, ...(prev[col] as unknown as AnyRec[])];
        const next = { ...prev, [col]: list } as DBState;
        return audit(next, "Created record", col, label ?? String(record['name'] ?? record['code'] ?? id), "—", label ?? String(record['name'] ?? id));
      });
      return id;
    },
    [audit],
  );

  const update: DataValue["update"] = useCallback(
    (col, id, patch, label) => {
      setDb((prev) => {
        const list = (prev[col] as unknown as AnyRec[]).map((r) => (r.id === id ? { ...r, ...patch } : r));
        const next = { ...prev, [col]: list } as DBState;
        return audit(next, "Updated record", col, label ?? id, "previous values", "updated values");
      });
    },
    [audit],
  );

  const remove: DataValue["remove"] = useCallback(
    (col, id, label) => {
      setDb((prev) => {
        const list = (prev[col] as unknown as AnyRec[]).filter((r) => r.id !== id);
        const next = { ...prev, [col]: list } as DBState;
        return audit(next, "Deleted record", col, label ?? id, "existing", "deleted");
      });
    },
    [audit],
  );

  const toggleActive: DataValue["toggleActive"] = useCallback(
    (col, id, label) => {
      setDb((prev) => {
        let nowActive = true;
        const list = (prev[col] as unknown as AnyRec[]).map((r) => {
          if (r.id !== id) return r;
          nowActive = !(r['active'] as boolean);
          return { ...r, active: nowActive, status: nowActive ? r['status'] : "inactive" };
        });
        const next = { ...prev, [col]: list } as DBState;
        return audit(next, nowActive ? "Activated record" : "Deactivated record", col, label ?? id, nowActive ? "Inactive" : "Active", nowActive ? "Active" : "Inactive");
      });
    },
    [audit],
  );

  const setPermission: DataValue["setPermission"] = useCallback((role, module, level, on) => {
    setDb((prev) => {
      const current = prev.permissions[role]?.[module] ?? [];
      const nextLevels = on ? Array.from(new Set([...current, level])) : current.filter((l) => l !== level);
      return {
        ...prev,
        permissions: { ...prev.permissions, [role]: { ...prev.permissions[role], [module]: nextLevels } },
      };
    });
  }, []);

  const updateCompany: DataValue["updateCompany"] = useCallback((patch) => {
    setDb((prev) => ({ ...prev, company: { ...prev.company, ...patch } }));
  }, []);

  const resetDemo = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setDb(initialState());
  }, []);

  const value = useMemo(
    () => ({ db, create, update, remove, toggleActive, setPermission, updateCompany, resetDemo }),
    [db, create, update, remove, toggleActive, setPermission, updateCompany, resetDemo],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside DataProvider");
  return ctx;
}

/** Lookup helpers — keep components free of manual joins. */
export function useLookups() {
  const { db } = useData();
  return useMemo(() => {
    const byId = <T extends { id: string }>(arr: T[]) => Object.fromEntries(arr.map((r) => [r.id, r])) as Record<string, T>;
    return {
      customer: byId(db.customers),
      warehouse: byId(db.warehouses),
      service: byId(db.serviceTypes),
      vehicle: byId(db.vehicles),
      driver: byId(db.drivers),
      route: byId(db.routes),
      supplier: byId(db.suppliers),
      category: byId(db.categories),
      product: byId(db.products),
    };
  }, [db]);
}

export const formatIDR = (n: number) =>
  "Rp " + new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(n);

export const formatNum = (n: number) => new Intl.NumberFormat("en-US").format(n);
