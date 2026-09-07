import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/farazz/page-header";
import { DataTable, type Column } from "@/components/farazz/data-table";
import { KpiCard } from "@/components/farazz/primitives";
import { StatusBadge } from "@/components/farazz/status-badge";
import { useData } from "@/lib/farazz/store";
import { useT } from "@/lib/i18n";
import type { UserRec } from "@/lib/farazz/data";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "Users — FARAZZ FLOW" },
      { name: "description", content: "Manage platform users and their status." },
    ],
  }),
  component: UsersPage,
});

function UsersPage() {
  const t = useT();
  const { db } = useData();

  const active = db.users.filter((u) => u.active).length;
  const roles = new Set(db.users.map((u) => u.role)).size;

  const columns: Column<UserRec>[] = [
    { key: "name", header: t("common.name"), value: (u) => u.name, render: (u) => <span className="font-medium text-foreground">{u.name}</span> },
    { key: "email", header: t("common.email"), value: (u) => u.email, className: "max-w-[18rem] truncate", hideOnMobile: true },
    { key: "role", header: t("common.role"), value: (u) => u.role, render: (u) => <span className="text-sm">{u.role}</span> },
    { key: "department", header: t("common.department"), value: (u) => u.department, hideOnMobile: true },
    { key: "lastActive", header: t("common.lastActive"), value: (u) => u.lastActive, hideOnMobile: true },
    { key: "status", header: t("common.status"), value: (u) => (u.active ? "active" : "inactive"), render: (u) => <StatusBadge value={u.active ? "active" : "inactive"} /> },
  ];

  const roleOptions = Array.from(new Set(db.users.map((u) => u.role))).map((v) => ({ value: v, label: v }));

  return (
    <div className="mx-auto max-w-[104rem] space-y-5">
      <PageHeader
        title={t("admin.users")}
        description="Manage platform users and their status."
        crumbs={[{ label: t("nav.administration"), to: "/admin" }, { label: t("admin.users") }]}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <KpiCard label="Total users" value={String(db.users.length)} tone="info" icon={<Users className="h-4 w-4" />} />
        <KpiCard label="Active" value={String(active)} hint={`${roles} roles`} tone="success" icon={<Users className="h-4 w-4" />} />
      </div>

      <DataTable
        rows={db.users}
        columns={columns}
        searchKeys={(u) => `${u.name} ${u.email} ${u.role} ${u.department}`}
        searchPlaceholder="Search name, email, role…"
        filters={[{ id: "role", label: t("common.role"), options: roleOptions, accessor: (u) => u.role }]}
      />
    </div>
  );
}