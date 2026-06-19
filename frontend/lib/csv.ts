// RFC 4180 CSV serialiser. BOM prefix ensures Excel opens UTF-8 correctly on Windows.
export function toCsv(headers: string[], rows: (string | null | undefined)[][]): string {
  const escape = (v: string | null | undefined) =>
    `"${String(v ?? "").replace(/"/g, '""')}"`;
  const line = (cols: (string | null | undefined)[]) => cols.map(escape).join(",");
  return "﻿" + [line(headers), ...rows.map(line)].join("\r\n");
}
