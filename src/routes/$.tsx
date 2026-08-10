import { createFileRoute, useRouterState } from "@tanstack/react-router";
import { PageHeader } from "@/components/nexora/page-header";
import { SectionCard } from "@/components/nexora/primitives";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/$")({
  head: () => ({
    meta: [
      { title: "Module — NEXORA FLOW" },
      { name: "description", content: "NEXORA FLOW operational module." },
      { property: "og:title", content: "Module — NEXORA FLOW" },
      { property: "og:description", content: "NEXORA FLOW operational module." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ModulePlaceholder,
});

function ModulePlaceholder() {
  const t = useT();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const label = pathname.split("/").filter(Boolean).map((p) => p.replace(/-/g, " ")).join(" · ");

  return (
    <div className="mx-auto max-w-[104rem] space-y-5">
      <PageHeader
        title={label.replace(/\b\w/g, (c) => c.toUpperCase())}
        description="This module is part of the NEXORA FLOW workspace and is being wired to the shared operational data layer."
        crumbs={[{ label: "NEXORA FLOW", to: "/" }, { label: label }]}
      />
      <SectionCard title={t("common.noResults")}>
        <p className="text-sm text-muted-foreground">{t("common.noResultsHint")}</p>
      </SectionCard>
    </div>
  );
}
