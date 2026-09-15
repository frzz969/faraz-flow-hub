import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { UserRound, Phone, Mail, Building2, CalendarDays, ShieldCheck, LogOut, Save } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/farazz/page-header";
import { SectionCard, KpiCard, Field } from "@/components/farazz/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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

const PREFS_KEY = "farazz.profile.prefs";

const EMAIL_PREFS = [
  { key: "status", label: "Shipment status updates", defaultChecked: true },
  { key: "exceptions", label: "Exception notifications", defaultChecked: true },
  { key: "finance", label: "Finance reminders", defaultChecked: false },
  { key: "weekly", label: "Weekly digest", defaultChecked: true },
];

function loadPrefs(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return JSON.parse(raw) as Record<string, boolean>;
  } catch {
    // ignore
  }
  return {};
}

function ProfilePage() {
  const t = useT();
  const navigate = useNavigate();
  const { db, update } = useData();

  const me = db.users.find((u) => u.role === "Super Admin") ?? db.users[0];
  const myLog = db.activity.filter((a) => a.user === (me?.name ?? ""));

  const [contactOpen, setContactOpen] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [phone, setPhone] = useState(me?.phone ?? "");
  const [email, setEmail] = useState(me?.email ?? "");
  const [prefs, setPrefs] = useState<Record<string, boolean>>(loadPrefs());

  const saveContact = () => {
    if (!me) return;
    update("users", me.id, { phone, email }, me.name);
    setContactOpen(false);
    toast.success("Contact information updated.");
  };

  const savePrefs = () => {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    setPrefsOpen(false);
    toast.success("Email preferences saved.");
  };

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
              <QuickAction icon={<Mail className="h-4 w-4" aria-hidden />} label="Email preferences" onClick={() => { setPrefs(loadPrefs()); setPrefsOpen(true); }} />
              <QuickAction icon={<Phone className="h-4 w-4" aria-hidden />} label="Update contact" onClick={() => { setPhone(me?.phone ?? ""); setEmail(me?.email ?? ""); setContactOpen(true); }} />
              <QuickAction icon={<CalendarDays className="h-4 w-4" aria-hidden />} label="View calendar" onClick={() => navigate({ to: "/tasks" })} />
            </div>
          </SectionCard>
        </div>
      </div>

      {/* Update contact dialog */}
      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Update contact information</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="prof-phone">{t("common.phone")}</Label>
              <Input id="prof-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0812-1000-2200" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prof-email">{t("common.email")}</Label>
              <Input id="prof-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@farazzflow.example.com" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setContactOpen(false)}>Cancel</Button>
            <Button size="sm" className="gap-1.5" onClick={saveContact}>
              <Save className="h-3.5 w-3.5" aria-hidden /> Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email preferences dialog */}
      <Dialog open={prefsOpen} onOpenChange={setPrefsOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email preferences</DialogTitle>
          </DialogHeader>
          <ul className="space-y-4">
            {EMAIL_PREFS.map((p) => {
              const checked = prefs[p.key] ?? p.defaultChecked;
              return (
                <li key={p.key} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">{p.label}</p>
                    <p className="text-xs text-muted-foreground">Email me about {p.label.toLowerCase()}.</p>
                  </div>
                  <Switch
                    checked={checked}
                    onCheckedChange={(v) => setPrefs((prev) => ({ ...prev, [p.key]: v }))}
                    aria-label={p.label}
                  />
                </li>
              );
            })}
          </ul>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setPrefsOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={savePrefs}>Save Preferences</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function QuickAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-md border border-border px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      {icon}
      {label}
    </button>
  );
}