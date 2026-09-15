import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/farazz/page-header";
import { SectionCard } from "@/components/farazz/primitives";
import { Checkbox } from "@/components/ui/checkbox";
import { useData } from "@/lib/farazz/store";
import { useT } from "@/lib/i18n";
import { ROLES, PERMISSION_MODULES, PERMISSION_LEVELS } from "@/lib/farazz/data";

export const Route = createFileRoute("/admin/roles")({
  head: () => ({
    meta: [
      { title: "Roles & Permissions — FARAZZ FLOW" },
      { name: "description", content: "Manage role-based access permissions across modules." },
    ],
  }),
  component: RolesPermissionPage,
});

function RolesPermissionPage() {
  const t = useT();
  const { db, setPermission } = useData();

  return (
    <div className="mx-auto max-w-[104rem] space-y-5">
      <PageHeader
        title={t("admin.roles")}
        description="Manage role-based access permissions across modules."
        crumbs={[{ label: t("nav.administration"), to: "/admin" }, { label: t("admin.roles") }]}
      />

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[52rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left">
              <th className="px-3 py-2.5 font-medium text-muted-foreground">Module</th>
              {ROLES.map((role) => (
                <th key={role} className="px-3 py-2.5 text-center font-medium text-muted-foreground">
                  <span className="whitespace-nowrap">{role}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSION_MODULES.map((mod) => (
              <tr key={mod} className="border-b border-border last:border-b-0">
                <td className="px-3 py-2 font-medium text-foreground">{mod}</td>
                {ROLES.map((role) => {
                  const levels = db.permissions[role]?.[mod] ?? [];
                  return (
                    <td key={role} className="px-3 py-2">
                      <div className="flex flex-wrap items-center justify-center gap-1.5">
                        {PERMISSION_LEVELS.map((level) => {
                          const on = levels.includes(level);
                          return (
                            <button
                              key={level}
                              type="button"
                              title={`${role} · ${mod} · ${level}`}
                              aria-pressed={on}
                              onClick={() => setPermission(role, mod, level, !on)}
                              className={`inline-flex h-5 items-center rounded px-1.5 text-[10px] font-semibold transition-colors ${
                                on
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground hover:bg-accent"
                              }`}
                            >
                              {level.slice(0, 1)}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p>
          Letters represent permission levels — <b className="font-medium text-foreground">V</b>iew, <b className="font-medium text-foreground">C</b>reate, <b className="font-medium text-foreground">E</b>dit, <b className="font-medium text-foreground">A</b>pprove, <b className="font-medium text-foreground">D</b>elete. Click a letter to toggle it. Super Admin retains all levels.
        </p>
      </div>
    </div>
  );
}