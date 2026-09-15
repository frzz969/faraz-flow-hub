import { useMemo, useState, type ReactNode } from "react";
import { ArrowUpDown, Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  value?: (row: T) => string | number;
  className?: string;
  hideOnMobile?: boolean;
  align?: "left" | "right";
}

export interface TableFilter<T> {
  id: string;
  label: string;
  options: { value: string; label: string }[];
  accessor: (row: T) => string;
}

export function DataTable<T extends { id: string }>({
  rows,
  columns,
  filters = [],
  searchKeys,
  searchPlaceholder,
  onRowClick,
  rowActions,
  pageSize = 10,
  toolbarExtra,
  emptyTitle,
  emptyHint,
}: {
  rows: T[];
  columns: Column<T>[];
  filters?: TableFilter<T>[];
  searchKeys: (row: T) => string;
  searchPlaceholder?: string;
  onRowClick?: (row: T) => void;
  rowActions?: (row: T) => ReactNode;
  pageSize?: number;
  toolbarExtra?: ReactNode;
  emptyTitle?: string;
  emptyHint?: string;
}) {
  const t = useT();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let list = rows;
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((r) => searchKeys(r).toLowerCase().includes(q));
    for (const f of filters) {
      const v = active[f.id];
      if (v && v !== "__all") list = list.filter((r) => f.accessor(r) === v);
    }
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col?.value) {
        list = [...list].sort((a, b) => {
          const av = col.value!(a);
          const bv = col.value!(b);
          const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
          return sort.dir === "asc" ? cmp : -cmp;
        });
      }
    }
    return list;
  }, [rows, query, active, filters, sort, columns, searchKeys]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pageCount);
  const paged = filtered.slice((current - 1) * pageSize, current * pageSize);

  const toggleSort = (key: string) =>
    setSort((s) => (s?.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));

  return (
    <div className="surface overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-border p-3 sm:p-4 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder={searchPlaceholder ?? t("common.search")}
            className="h-9 pl-9"
            aria-label={t("common.search")}
          />
        </div>
        {filters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <SlidersHorizontal className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" aria-hidden />
            {filters.map((f) => (
              <Select
                key={f.id}
                value={active[f.id] ?? "__all"}
                onValueChange={(v) => {
                  setActive((a) => ({ ...a, [f.id]: v }));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 w-[9.5rem] text-xs" aria-label={f.label}>
                  <SelectValue placeholder={f.label} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">{f.label}: {t("common.all")}</SelectItem>
                  {f.options.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}
          </div>
        )}
        {toolbarExtra}
      </div>

      {paged.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <p className="text-sm font-medium">{emptyTitle ?? t("common.noResults")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{emptyHint ?? t("common.noResultsHint")}</p>
        </div>
      ) : (
        <>
          {/* Desktop / tablet table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[46rem] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left">
                  {columns.map((c) => (
                    <th key={c.key} scope="col" className={cn("px-4 py-2.5 text-xs font-medium whitespace-nowrap text-muted-foreground", c.align === "right" && "text-right")}>
                      {c.value ? (
                        <button type="button" onClick={() => toggleSort(c.key)} className="inline-flex items-center gap-1 transition-colors hover:text-foreground">
                          {c.header}
                          <ArrowUpDown className={cn("h-3 w-3", sort?.key === c.key ? "opacity-100" : "opacity-40")} aria-hidden />
                        </button>
                      ) : (
                        c.header
                      )}
                    </th>
                  ))}
                  {rowActions && <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">{t("common.actions")}</th>}
                </tr>
              </thead>
              <tbody>
                {paged.map((row) => (
                  <tr
                    key={row.id}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn("border-b border-border/70 last:border-0 transition-colors hover:bg-accent/60", onRowClick && "cursor-pointer")}
                  >
                    {columns.map((c) => (
                      <td key={c.key} className={cn("px-4 py-3 align-middle", c.align === "right" && "text-right", c.className)}>
                        {c.render ? c.render(row) : String(c.value?.(row) ?? "")}
                      </td>
                    ))}
                    {rowActions && (
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        {rowActions(row)}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="divide-y divide-border md:hidden">
            {paged.map((row) => (
              <li key={row.id} className="p-4">
                <button
                  type="button"
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className="w-full space-y-2 text-left"
                >
                  {columns
                    .filter((c) => !c.hideOnMobile)
                    .map((c, i) => (
                      <div key={c.key} className={cn("grid grid-cols-[7rem_minmax(0,1fr)] items-start gap-2", i === 0 && "pb-1")}>
                        <span className="text-xs text-muted-foreground">{c.header}</span>
                        <span className={cn("min-w-0 text-sm", i === 0 && "font-medium")}>
                          {c.render ? c.render(row) : String(c.value?.(row) ?? "")}
                        </span>
                      </div>
                    ))}
                </button>
                {rowActions && <div className="mt-3 flex justify-end">{rowActions(row)}</div>}
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-border px-4 py-3">
        <p className="truncate text-xs text-muted-foreground">
          {filtered.length} {t("common.rows")} · {t("common.page")} {current} {t("common.of")} {pageCount}
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" disabled={current <= 1} onClick={() => setPage(current - 1)}>
            {t("common.previous")}
          </Button>
          <Button variant="outline" size="sm" disabled={current >= pageCount} onClick={() => setPage(current + 1)}>
            {t("common.next")}
          </Button>
        </div>
      </div>
    </div>
  );
}
