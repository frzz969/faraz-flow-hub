import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { exportCSV } from "@/lib/farazz/export";

export interface ExportColumn<T> {
  key: string;
  header: string;
  value: (row: T) => unknown;
}

export function ExportButton<T>({
  rows,
  columns,
  filename,
  label = "Export",
  onClick,
}: {
  rows: T[];
  columns: ExportColumn<T>[];
  filename: string;
  label?: string;
  onClick?: () => void;
}) {
  const handle = () => {
    onClick?.();
    if (rows.length === 0) {
      toast.info("Nothing to export — the filtered list is empty.");
      return;
    }
    exportCSV(
      rows.map((r) =>
        Object.fromEntries(columns.map((c) => [c.key, c.value(r)])),
      ) as Record<string, unknown>[],
      columns.map((c) => ({ key: c.key, header: c.header })),
      filename,
    );
    toast.success(`Exported ${rows.length} rows to ${filename}`);
  };

  return (
    <Button variant="outline" size="sm" onClick={handle} className="gap-1.5">
      <Download className="h-3.5 w-3.5" aria-hidden />
      {label}
    </Button>
  );
}