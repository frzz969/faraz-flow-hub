/**
 * FARAZZ FLOW — export utilities (CSV + PDF text receipt).
 */

/** Download a Blob as a named file. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Export an array of objects as a CSV file. */
export function exportCSV<T extends Record<string, unknown>>(
  rows: T[],
  columns: { key: string; header: string }[],
  filename: string,
) {
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const header = columns.map((c) => escape(c.header)).join(",");
  const body = rows.map((row) => columns.map((c) => escape(row[c.key])).join(",")).join("\n");
  const csv = `\uFEFF${header}\n${body}`;
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), filename);
}

/** Generate a simple text receipt for a single record. */
export function generateReceipt(
  title: string,
  fields: { label: string; value: string }[],
): string {
  const width = Math.max(title.length, ...fields.map((f) => f.label.length + f.value.length)) + 4;
  const line = "─".repeat(width);
  const lines = [
    line,
    title.toUpperCase().padStart(Math.floor((width + title.length) / 2)),
    line,
    ...fields.map((f) => `${f.label.padEnd(20)} ${f.value}`),
    line,
    `Generated: ${new Date().toLocaleString("en-GB")}`,
    `FARAZZ FLOW — Enterprise Logistics`,
  ];
  return lines.join("\n");
}

/** Export a text receipt as a downloadable .txt file. */
export function exportReceipt(
  title: string,
  fields: { label: string; value: string }[],
  filename: string,
) {
  const text = generateReceipt(title, fields);
  downloadBlob(new Blob([text], { type: "text/plain;charset=utf-8" }), filename);
}
