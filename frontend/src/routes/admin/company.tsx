import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Building2, Save } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/farazz/page-header";
import { SectionCard } from "@/components/farazz/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useData } from "@/lib/farazz/store";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/admin/company")({
  head: () => ({
    meta: [
      { title: "Company Profile — FARAZZ FLOW" },
      { name: "description", content: "Update the company profile for the FARAZZ FLOW platform." },
    ],
  }),
  component: CompanyPage,
});

const FIELD_DEFS = [
  { key: "name", label: "Company name" },
  { key: "companyId", label: "Company ID" },
  { key: "address", label: "Address" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "website", label: "Website" },
  { key: "taxId", label: "Tax ID" },
  { key: "currency", label: "Currency" },
  { key: "timezone", label: "Timezone" },
  { key: "dateFormat", label: "Date format" },
] as const;

function CompanyPage() {
  const t = useT();
  const { db, updateCompany } = useData();
  const [form, setForm] = useState({
    name: "",
    companyId: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    taxId: "",
    currency: "",
    timezone: "",
    dateFormat: "",
  });

  useEffect(() => {
    setForm({
      name: db.company.name,
      companyId: db.company.companyId,
      address: db.company.address,
      phone: db.company.phone,
      email: db.company.email,
      website: db.company.website,
      taxId: db.company.taxId,
      currency: db.company.currency,
      timezone: db.company.timezone,
      dateFormat: db.company.dateFormat,
    });
  }, [db.company]);

  const save = () => {
    let changed = 0;
    updateCompany({
      name: form.name ?? "",
      companyId: form.companyId ?? "",
      address: form.address ?? "",
      phone: form.phone ?? "",
      email: form.email ?? "",
      website: form.website ?? "",
      taxId: form.taxId ?? "",
      currency: form.currency ?? "",
      timezone: form.timezone ?? "",
      dateFormat: form.dateFormat ?? "",
    });
    for (const f of FIELD_DEFS) {
      if (form[f.key] !== db.company[f.key]) changed += 1;
    }
    toast.success(changed > 0 ? `Company profile updated (${changed} field${changed === 1 ? "" : "s"}).` : "No changes to save.");
  };

  return (
    <div className="mx-auto max-w-[104rem] space-y-5">
      <PageHeader
        title={t("admin.company")}
        description="Update the company profile for the FARAZZ FLOW platform."
        crumbs={[{ label: t("nav.administration"), to: "/admin" }, { label: t("admin.company") }]}
      />

      <SectionCard title="Company profile" subtitle="Shown on invoices, reports and the dashboard">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FIELD_DEFS.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label htmlFor={`company-${f.key}`} className="text-xs text-muted-foreground">
                {f.label}
              </Label>
              <Input
                id={`company-${f.key}`}
                value={form[f.key] ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={save} className="gap-1.5">
            <Save className="h-4 w-4" aria-hidden /> Save changes
          </Button>
        </div>
      </SectionCard>

      <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        <Building2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p>Changes are saved to the local demo workspace and reset on refresh.</p>
      </div>
    </div>
  );
}