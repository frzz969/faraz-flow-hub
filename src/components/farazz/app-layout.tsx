import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity, Archive, ArrowLeftRight, BarChart3, Bell, Boxes, Building2, ChevronDown, CircleAlert,
  ClipboardCheck, Contact, CreditCard, FileText, Gauge, HelpCircle, Home, Landmark, LayoutGrid,
  ListChecks, Menu, PackageCheck, PackageSearch, Receipt, Route as RouteIcon, Search, Settings,
  Shield, Sparkles, Truck, Users, Warehouse, Wrench, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { LANGUAGES, useI18n } from "@/lib/i18n";

type Item = { to: string; labelKey: string; icon: typeof Home };
type Group = { titleKey: string; items: Item[] };

const GROUPS: Group[] = [
  { titleKey: "nav.overview", items: [{ to: "/", labelKey: "nav.dashboard", icon: Home }] },
  {
    titleKey: "nav.operations",
    items: [
      { to: "/shipments", labelKey: "nav.shipments", icon: PackageSearch },
      { to: "/orders", labelKey: "nav.orders", icon: ClipboardCheck },
      { to: "/delivery", labelKey: "nav.delivery", icon: Truck },
      { to: "/exceptions", labelKey: "nav.exceptions", icon: CircleAlert },
      { to: "/returns", labelKey: "nav.returns", icon: ArrowLeftRight },
    ],
  },
  {
    titleKey: "nav.warehouse",
    items: [
      { to: "/warehouses", labelKey: "nav.warehouses", icon: Warehouse },
      { to: "/inbound", labelKey: "nav.inbound", icon: PackageCheck },
      { to: "/sorting", labelKey: "nav.sorting", icon: LayoutGrid },
      { to: "/outbound", labelKey: "nav.outbound", icon: Archive },
      { to: "/inventory", labelKey: "nav.inventory", icon: Boxes },
      { to: "/stock-movement", labelKey: "nav.stockMovement", icon: Activity },
    ],
  },
  {
    titleKey: "nav.fleet",
    items: [
      { to: "/vehicles", labelKey: "nav.vehicles", icon: Truck },
      { to: "/drivers", labelKey: "nav.drivers", icon: Contact },
      { to: "/routes", labelKey: "nav.routes", icon: RouteIcon },
      { to: "/dispatch", labelKey: "nav.dispatch", icon: Gauge },
      { to: "/maintenance", labelKey: "nav.maintenance", icon: Wrench },
    ],
  },
  {
    titleKey: "nav.business",
    items: [
      { to: "/customers", labelKey: "nav.customers", icon: Building2 },
      { to: "/suppliers", labelKey: "nav.suppliers", icon: Landmark },
      { to: "/service-types", labelKey: "nav.serviceTypes", icon: ListChecks },
      { to: "/pricing", labelKey: "nav.pricing", icon: Receipt },
      { to: "/contracts", labelKey: "nav.contracts", icon: FileText },
    ],
  },
  {
    titleKey: "nav.finance",
    items: [
      { to: "/billing", labelKey: "nav.billing", icon: CreditCard },
      { to: "/invoices", labelKey: "nav.invoices", icon: Receipt },
      { to: "/payments", labelKey: "nav.payments", icon: Landmark },
      { to: "/cod", labelKey: "nav.cod", icon: CreditCard },
    ],
  },
  {
    titleKey: "nav.analytics",
    items: [
      { to: "/analytics", labelKey: "nav.analyticsOperations", icon: BarChart3 },
      { to: "/reports", labelKey: "nav.reports", icon: FileText },
    ],
  },
  {
    titleKey: "nav.workspace",
    items: [
      { to: "/approvals", labelKey: "nav.approvals", icon: ClipboardCheck },
      { to: "/tasks", labelKey: "nav.tasks", icon: ListChecks },
      { to: "/documents", labelKey: "nav.documents", icon: FileText },
      { to: "/activity", labelKey: "nav.activityLog", icon: Activity },
    ],
  },
  {
    titleKey: "nav.administration",
    items: [
      { to: "/admin", labelKey: "admin.dashboard", icon: Shield },
      { to: "/admin/users", labelKey: "admin.users", icon: Users },
      { to: "/admin/roles", labelKey: "admin.roles", icon: Shield },
      { to: "/admin/company", labelKey: "admin.company", icon: Building2 },
      { to: "/admin/audit", labelKey: "admin.audit", icon: Activity },
    ],
  },
];

const MOBILE_ITEMS: Item[] = [
  { to: "/", labelKey: "nav.dashboard", icon: Home },
  { to: "/shipments", labelKey: "nav.shipments", icon: PackageSearch },
  { to: "/warehouses", labelKey: "nav.warehouses", icon: Warehouse },
  { to: "/exceptions", labelKey: "nav.exceptions", icon: CircleAlert },
];

function BrandMark({ collapsed }: { collapsed?: boolean }) {
  return (
    <Link to="/" className="flex min-w-0 items-center gap-2.5">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
          <path d="M4 18V6l8 7 8-7v12" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      {!collapsed && (
        <span className="min-w-0">
          <span className="block truncate font-display text-sm font-semibold tracking-tight">FARAZZ FLOW</span>
          <span className="block truncate text-[10px] text-muted-foreground">Logistics Operations</span>
        </span>
      )}
    </Link>
  );
}

function NavList({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const { t } = useI18n();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="space-y-5 px-2 pb-6">
      {GROUPS.map((g) => (
        <div key={g.titleKey}>
          {!collapsed && (
            <p className="px-2 pb-1.5 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">{t(g.titleKey)}</p>
          )}
          <ul className="space-y-0.5">
            {g.items.map((item) => {
              const isActive = item.to === "/" ? pathname === "/" : pathname === item.to || pathname.startsWith(item.to + "/");
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    onClick={onNavigate}
                    title={collapsed ? t(item.labelKey) : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                      collapsed && "justify-center",
                      isActive
                        ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                    )}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} aria-hidden />
                    {!collapsed && <span className="truncate">{t(item.labelKey)}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AskFarazzButton({ compact }: { compact?: boolean }) {
  const { t } = useI18n();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 border-ai/30 bg-ai-soft text-ai hover:bg-ai-soft hover:text-ai">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          {!compact && t("ai.ask")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-ai" aria-hidden /> {t("ai.ask")}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{t("ai.comingSoon")}</p>
        <ul className="space-y-2">
          {["ai.q1", "ai.q2", "ai.q3", "ai.q4"].map((k) => (
            <li key={k}>
              <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">{t(k)}</div>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">{t("ai.subtitle")}</p>
      </DialogContent>
    </Dialog>
  );
}

function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();
  const current = LANGUAGES.find((l) => l.code === lang);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 px-2" aria-label={t("common.language")}>
          <span aria-hidden>{current?.flag}</span>
          <span className="hidden text-xs font-medium sm:inline">{lang.toUpperCase()}</span>
          <ChevronDown className="h-3 w-3 opacity-60" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t("common.language")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LANGUAGES.map((l) => (
          <DropdownMenuItem key={l.code} onClick={() => setLang(l.code)} className={cn(l.code === lang && "font-medium")}>
            <span className="mr-2" aria-hidden>{l.flag}</span>
            {l.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen w-full bg-canvas">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 lg:flex",
          collapsed ? "w-[4.25rem]" : "w-64",
        )}
      >
        <div className={cn("flex h-14 items-center border-b border-sidebar-border px-3", collapsed && "justify-center px-0")}>
          <BrandMark collapsed={collapsed} />
        </div>
        <div className="flex-1 overflow-y-auto pt-4">
          <NavList collapsed={collapsed} />
        </div>
        <div className={cn("space-y-0.5 border-t border-sidebar-border p-2")}>
          {[
            { to: "/settings", labelKey: "nav.settings", icon: Settings },
            { to: "/help", labelKey: "nav.help", icon: HelpCircle },
            { to: "/profile", labelKey: "nav.profile", icon: Users },
          ].map((i) => {
            const Icon = i.icon;
            const isActive = pathname === i.to;
            return (
              <Link
                key={i.to}
                to={i.to}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent/60",
                  collapsed && "justify-center",
                  isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {!collapsed && <span className="truncate">{t(i.labelKey)}</span>}
              </Link>
            );
          })}
          <Button
            variant="ghost"
            size="sm"
            className={cn("mt-1 w-full justify-start gap-2.5 text-muted-foreground", collapsed && "justify-center")}
            onClick={() => setCollapsed((c) => !c)}
            aria-label="Toggle sidebar"
          >
            {collapsed ? <Menu className="h-4 w-4" aria-hidden /> : <><X className="h-4 w-4" aria-hidden /> Collapse</>}
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-card/95 px-3 backdrop-blur sm:px-5">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
                <Menu className="h-5 w-5" aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 overflow-y-auto bg-sidebar p-0">
              <SheetTitle className="sr-only">FARAZZ FLOW navigation</SheetTitle>
              <div className="flex h-14 items-center border-b border-sidebar-border px-3">
                <BrandMark />
              </div>
              <div className="pt-4">
                <NavList collapsed={false} onNavigate={() => setMobileOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          <div className="lg:hidden">
            <BrandMark />
          </div>

          <div className="relative ml-auto hidden max-w-md min-w-0 flex-1 lg:ml-0 lg:block">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input className="h-9 pl-9" placeholder={t("common.searchPlaceholder")} aria-label={t("common.search")} />
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <AskFarazzButton compact />
            <LanguageSwitcher />
            <Button variant="ghost" size="icon" className="relative" aria-label={t("common.notifications")}>
              <Bell className="h-4 w-4" aria-hidden />
              <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-critical" aria-hidden />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-accent" aria-label={t("nav.profile")}>
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary">DP</span>
                  <span className="hidden text-left leading-tight xl:block">
                    <span className="block text-xs font-medium">Dimas Prakoso</span>
                    <span className="block text-[10px] text-muted-foreground">Super Admin</span>
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>Dimas Prakoso · Super Admin</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to="/profile">{t("nav.profile")}</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/settings">{t("nav.settings")}</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/admin">{t("nav.adminConsole")}</Link></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-3 pt-4 pb-24 sm:px-5 sm:pt-6 lg:pb-8">{children}</main>

        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-card lg:hidden">
          {MOBILE_ITEMS.map((i) => {
            const Icon = i.icon;
            const isActive = i.to === "/" ? pathname === "/" : pathname.startsWith(i.to);
            return (
              <Link key={i.to} to={i.to} className={cn("flex flex-col items-center gap-0.5 py-2 text-[10px]", isActive ? "text-primary" : "text-muted-foreground")}>
                <Icon className="h-4 w-4" aria-hidden />
                <span className="truncate px-1">{t(i.labelKey)}</span>
              </Link>
            );
          })}
          <button onClick={() => setMobileOpen(true)} className="flex flex-col items-center gap-0.5 py-2 text-[10px] text-muted-foreground">
            <Menu className="h-4 w-4" aria-hidden />
            <span>More</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
