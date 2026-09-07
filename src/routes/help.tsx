import { createFileRoute } from "@tanstack/react-router";
import { MessageCircleQuestion, LifeBuoy, MailCheck } from "lucide-react";
import { PageHeader } from "@/components/farazz/page-header";
import { SectionCard } from "@/components/farazz/primitives";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help Center — FARAZZ FLOW" },
      { name: "description", content: "Guides, FAQs and support contact for FARAZZ FLOW." },
    ],
  }),
  component: HelpPage,
});

const FAQS = [
  { q: "How do I create a new shipment?", a: "Go to Shipments and use the Create button, or raise an order in Orders first and let it generate the shipment automatically." },
  { q: "What happens when a delivery is delayed?", a: "The system logs an exception automatically. Review it in Exceptions, assign corrective action, and the shipment status updates accordingly." },
  { q: "How is billing calculated?", a: "Shipments are billed using the active pricing rules for the service type — base rate plus weight, distance, insurance and additional services." },
  { q: "How do I reset my demo data?", a: "Open Settings → Data and click Reset. All seed data is restored to its initial state." },
  { q: "Can I change the interface language?", a: "Yes — go to Settings → Language and choose English or Bahasa Indonesia." },
  { q: "Where can I see the audit trail?", a: "Administration → Audit Log shows every administrative change across modules." },
];

function HelpPage() {
  const t = useT();

  return (
    <div className="mx-auto max-w-[104rem] space-y-5">
      <PageHeader
        title={t("nav.help")}
        description="Guides, FAQs and support contact for FARAZZ FLOW."
        crumbs={[{ label: t("nav.help") }]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Frequently asked questions" subtitle={`${FAQS.length} questions`}>
          <ul className="divide-y divide-border">
            {FAQS.map((f) => (
              <li key={f.q} className="py-3 first:pt-0 last:pb-0">
                <p className="flex items-start gap-2 text-sm font-medium">
                  <MessageCircleQuestion className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  {f.q}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{f.a}</p>
              </li>
            ))}
          </ul>
        </SectionCard>

        <div className="space-y-4">
          <SectionCard title="Contact support" subtitle="We usually reply within one business day">
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-md border border-border px-4 py-3">
                <MailCheck className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <div>
                  <p className="text-sm font-medium">operations@farazzflow.example.com</p>
                  <p className="text-xs text-muted-foreground">Operations support</p>
                </div>
              </div>
              <Button variant="outline" className="w-full justify-center gap-2">
                <LifeBuoy className="h-4 w-4 text-muted-foreground" aria-hidden /> Open a support ticket
              </Button>
            </div>
          </SectionCard>

          <SectionCard title="Getting started" subtitle="Quick orientation">
            <ul className="list-inside list-disc space-y-1.5 text-sm text-muted-foreground">
              <li>Explore the dashboard for today's operational overview.</li>
              <li>Use the search bar on each table to filter records quickly.</li>
              <li>Most lists let you open a record for full details.</li>
              <li>Administration holds users, roles, company profile and audit log.</li>
            </ul>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}