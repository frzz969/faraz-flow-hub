import { createFileRoute } from "@tanstack/react-router";
import { Globe, Bell, Database, Check } from "lucide-react";
import { PageHeader } from "@/components/farazz/page-header";
import { SectionCard } from "@/components/farazz/primitives";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useI18n, LANGUAGES } from "@/lib/i18n";
import { useData } from "@/lib/farazz/store";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — FARAZZ FLOW" },
      { name: "description", content: "Platform preferences for language, notifications and data." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const t = useT();
  const { lang, setLang } = useI18n();
  const { resetDemo } = useData();

  return (
    <div className="mx-auto max-w-[104rem] space-y-5">
      <PageHeader
        title={t("nav.settings")}
        description="Platform preferences for language, notifications and data."
        crumbs={[{ label: t("nav.settings") }]}
      />

      <SectionCard title={t("common.language")} subtitle="Choose the interface language">
        <div className="grid gap-3 sm:grid-cols-2">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => {
                setLang(l.code);
                toast.success(`Language set to ${l.label}.`);
              }}
              className={`flex items-center justify-between rounded-md border px-4 py-3 text-left transition-colors ${
                lang === l.code ? "border-primary bg-primary/5" : "border-border hover:bg-accent"
              }`}
            >
              <span className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2.5">
                <span className="text-xl">{l.flag}</span>
                <span className="text-sm font-medium">{l.label}</span>
              </span>
              {lang === l.code ? <Check className="h-4 w-4 text-primary" aria-hidden /> : null}
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Notifications" subtitle="Control which alerts you receive">
        <ul className="space-y-4">
          <SettingRow icon={<Bell className="h-4 w-4" aria-hidden />} label="Shipment status alerts" desc="Notify me when a shipment changes status or is delayed." defaultChecked />
          <SettingRow icon={<Bell className="h-4 w-4" aria-hidden />} label="Exception alerts" desc="Notify me immediately when an exception is logged on my operations." defaultChecked />
          <SettingRow icon={<Bell className="h-4 w-4" aria-hidden />} label="Finance reminders" desc="Daily digests for open invoices, COD and outstanding payments." />
          <SettingRow icon={<Globe className="h-4 w-4" aria-hidden />} label="Weekly report" desc="Receive the weekly operational summary every Monday." defaultChecked />
        </ul>
      </SectionCard>

      <SectionCard title="Data" subtitle="Demo workspace">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-2.5">
            <Database className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <div>
              <p className="text-sm font-medium">Reset demo data</p>
              <p className="text-xs text-muted-foreground">Restore all seed data to its initial state.</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              resetDemo();
              toast.success("Demo data has been reset.");
            }}
          >
            Reset
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}

function SettingRow({
  icon,
  label,
  desc,
  defaultChecked,
}: {
  icon: React.ReactNode;
  label: string;
  desc: string;
  defaultChecked?: boolean;
}) {
  return (
    <li className="flex items-center justify-between gap-4">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 text-muted-foreground">{icon}</span>
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
      {typeof defaultChecked === "boolean" ? (
        <Switch defaultChecked={defaultChecked} aria-label={label} />
      ) : (
        <Switch aria-label={label} />
      )}
    </li>
  );
}