import { createFileRoute, useRouterState } from "@tanstack/react-router";
import { PageHeader } from "@/components/farazz/page-header";
import { SectionCard } from "@/components/farazz/primitives";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/$")({
  head: () => ({
    meta: [
      { title: "Module — FARAZZ FLOW" },
      { name: "description", content: "FARAZZ FLOW operational module." },
      { property: "og:title", content: "Module — FARAZZ FLOW" },
      { property: "og:description", content: "FARAZZ FLOW operational module." },
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
        description="This module is part of the FARAZZ FLOW workspace and is being wired to the shared operational data layer."
        crumbs={[{ label: "FARAZZ FLOW", to: "/" }, { label: label }]}
      />
      <SectionCard title={t("common.noResults")}>
        <p className="text-sm text-muted-foreground">{t("common.noResultsHint")}</p>
      </SectionCard>
    </div>
  );
}
