import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { UserRound, Phone, Mail, Building2, CalendarDays, ShieldCheck, LogOut } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/farazz/page-header";
import { SectionCard, KpiCard, Field } from "@/components/farazz/primitives";
import { Button } from "@/components/ui/button";
import { useData, formatNum } from "@/lib/farazz/store";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — FARAZZ FLOW" },
      { name: "description", content: "Your account details and activity on FARAZZ FLOW." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const t = useT();
  const navigate = useNavigate();
  const { db } = useData();

  const me = db.users.find((u) => u.role === "Super Admin") ?? db.users[0];
  const myLog = db.activity.filter((a) => a.user === (me?.name ?? ""));

  return (
    <div className="mx-auto max-w-[104rem] space-y-5">
      <PageHeader
        title={t("nav.profile")}
        description="Your account details and activity on FARAZZ FLOW."
        crumbs={[{ label: t("nav.profile") }]}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <SectionCard title="Account">
          <div className="flex flex-col items-center gap-3 py-2 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
              {(me?.name ?? "?")
                .split(" ")
                .map((x) => x[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">{me?.name ?? "—"}</p>
              <p className="text-sm text-muted-foreground">{me?.role ?? "—"} · {me?.department ?? "—"}</p>
            </div>
          </div>
          <dl className="mt-4 grid gap-3">
            <Field label={t("common.email")} value={me?.email ?? "—"} />
            <Field label={t("common.phone")} value={me?.phone ?? "—"} />
            <Field label={t("common.role")} value={me?.role ?? "—"} />
            <Field label={t("common.lastActive")} value={me?.lastActive ?? "—"} />
          </dl>
          <div className="mt-4">
            <Button
              variant="outline"
              className="w-full justify-center gap-2"
              onClick={() => {
                localStorage.removeItem("farazz.session.email");
                navigate({ to: "/login" });
              }}
            >
              <LogOut className="h-4 w-4 text-muted-foreground" aria-hidden /> Sign out
            </Button>
          </div>
        </SectionCard>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <KpiCard label="Activity" value={formatNum(myLog.length)} tone="info" icon={<UserRound className="h-4 w-4" />} />
            <KpiCard label={t("common.department")} value={me?.department ?? "—"} tone="info" icon={<Building2 className="h-4 w-4" />} />
            <KpiCard label={t("nav.admin")} value={me?.role === "Super Admin" ? "Full access" : "Restricted"} tone="info" icon={<ShieldCheck className="h-4 w-4" />} />
          </div>

          <SectionCard title="Account details" subtitle="Reference data from the users directory">
            <dl className="grid gap-3 sm:grid-cols-2">
              <Field label="User ID" value={me?.id ?? "—"} mono />
              <Field label="Status" value={me?.status ?? "—"} />
              <Field label="Member since" value={me?.created ?? "—"} />
              <Field label={t("common.department")} value={me?.department ?? "—"} />
            </dl>
          </SectionCard>

          <SectionCard title="Quick actions" subtitle="Requests and preferences">
            <div className="grid gap-3 sm:grid-cols-3">
              <QuickAction icon={<Mail className="h-4 w-4" aria-hidden />} label="Email preferences" />
              <QuickAction icon={<Phone className="h-4 w-4" aria-hidden />} label="Update contact" />
              <QuickAction icon={<CalendarDays className="h-4 w-4" aria-hidden />} label="View calendar" />
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

function QuickAction({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={() => toast.info(`${label} — available in the production build.`)}
      className="flex items-center gap-2 rounded-md border border-border px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      {icon}
      {label}
    </button>
  );
}