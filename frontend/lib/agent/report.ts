import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ReportPeriod = "24h" | "7d" | "30d";

const PERIOD_LABELS: Record<ReportPeriod, string> = {
  "24h": "Last 24 Hours",
  "7d":  "Last 7 Days",
  "30d": "Last 30 Days",
};

function periodCutoff(period: ReportPeriod): Date {
  const now = Date.now();
  if (period === "24h") return new Date(now - 24 * 60 * 60 * 1000);
  if (period === "7d")  return new Date(now - 7  * 24 * 60 * 60 * 1000);
  return new Date(now - 30 * 24 * 60 * 60 * 1000);
}

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function truncate(str: string, max: number): string {
  return str.length <= max ? str : str.slice(0, max - 1) + "…";
}

export async function generatePDFReport(
  supabase: SupabaseClient,
  userId: string,
  period: ReportPeriod,
  userName: string | null
): Promise<Uint8Array> {
  const cutoff = periodCutoff(period).toISOString();
  const label  = PERIOD_LABELS[period];

  const [{ data: emails }, { data: clients }] = await Promise.all([
    supabase
      .from("emails")
      .select("subject, client_snapshot, sent_at")
      .eq("user_id", userId)
      .eq("status", "sent")
      .gte("sent_at", cutoff)
      .order("sent_at", { ascending: false }),
    supabase
      .from("clients")
      .select("name, email, company, created_at")
      .eq("user_id", userId)
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false }),
  ]);

  const emailList  = emails  ?? [];
  const clientList = clients ?? [];

  // ── Build PDF ──────────────────────────────────────────────────────────────
  const pdfDoc   = await PDFDocument.create();
  const regular  = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold     = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const W = 595, H = 842; // A4 portrait
  const MARGIN = 48;
  const COL = W - MARGIN * 2;
  const INDIGO = rgb(0.30, 0.27, 0.90);
  const DARK   = rgb(0.07, 0.09, 0.14);
  const GRAY   = rgb(0.45, 0.50, 0.56);
  const LGRAY  = rgb(0.93, 0.94, 0.96);

  let page  = pdfDoc.addPage([W, H]);
  let curY  = H - MARGIN;

  function newPageIfNeeded(needed = 30) {
    if (curY < MARGIN + needed) {
      page = pdfDoc.addPage([W, H]);
      curY = H - MARGIN;
    }
  }

  function drawText(text: string, x: number, y: number, opts: {
    size?: number; font?: typeof regular; color?: ReturnType<typeof rgb>;
  } = {}) {
    page.drawText(text, {
      x, y,
      size:  opts.size  ?? 10,
      font:  opts.font  ?? regular,
      color: opts.color ?? DARK,
    });
  }

  // Header bar
  page.drawRectangle({ x: 0, y: H - 64, width: W, height: 64, color: INDIGO });
  drawText("MailMind AI", MARGIN, H - 40, { size: 18, font: bold, color: rgb(1,1,1) });
  drawText("Activity Report", MARGIN + 132, H - 40, { size: 14, font: regular, color: rgb(0.8, 0.8, 1) });
  curY = H - 80;

  // Meta
  drawText(`Report period: ${label}`, MARGIN, curY, { size: 10, color: GRAY });
  curY -= 14;
  drawText(`Generated: ${new Date().toLocaleString("en-GB")}`, MARGIN, curY, { size: 10, color: GRAY });
  if (userName) {
    drawText(`Account: ${userName}`, MARGIN + COL / 2, curY + 14, { size: 10, color: GRAY });
  }
  curY -= 24;

  // Divider
  page.drawLine({ start: { x: MARGIN, y: curY }, end: { x: W - MARGIN, y: curY }, thickness: 0.5, color: LGRAY });
  curY -= 20;

  // Summary stats
  drawText("Summary", MARGIN, curY, { size: 13, font: bold });
  curY -= 18;

  const statBoxW = (COL - 16) / 2;
  const boxes = [
    { label: "Emails Sent",    value: String(emailList.length) },
    { label: "Clients Added",  value: String(clientList.length) },
  ];
  boxes.forEach((b, i) => {
    const bx = MARGIN + i * (statBoxW + 16);
    page.drawRectangle({ x: bx, y: curY - 36, width: statBoxW, height: 46, color: LGRAY });
    drawText(b.value, bx + 14, curY - 10, { size: 18, font: bold, color: INDIGO });
    drawText(b.label, bx + 14, curY - 28, { size: 9,  color: GRAY });
  });
  curY -= 60;

  page.drawLine({ start: { x: MARGIN, y: curY }, end: { x: W - MARGIN, y: curY }, thickness: 0.5, color: LGRAY });
  curY -= 20;

  // ── Emails table ───────────────────────────────────────────────────────────
  drawText("Emails Sent", MARGIN, curY, { size: 13, font: bold });
  curY -= 18;

  if (emailList.length === 0) {
    drawText("No emails sent in this period.", MARGIN, curY, { size: 10, color: GRAY });
    curY -= 20;
  } else {
    // Header row
    page.drawRectangle({ x: MARGIN, y: curY - 16, width: COL, height: 20, color: INDIGO });
    drawText("Recipient",   MARGIN + 6,       curY - 10, { size: 9, font: bold, color: rgb(1,1,1) });
    drawText("Subject",     MARGIN + 150,     curY - 10, { size: 9, font: bold, color: rgb(1,1,1) });
    drawText("Sent At",     MARGIN + COL - 110, curY - 10, { size: 9, font: bold, color: rgb(1,1,1) });
    curY -= 20;

    emailList.forEach((em, idx) => {
      newPageIfNeeded(20);
      const row: string = idx % 2 === 0 ? "" : "alt";
      if (row === "alt") {
        page.drawRectangle({ x: MARGIN, y: curY - 14, width: COL, height: 18, color: rgb(0.97,0.97,0.99) });
      }
      const snap = (em.client_snapshot as { name?: string; email?: string }) ?? {};
      drawText(truncate(snap.name  ?? "Unknown",  22), MARGIN + 6,         curY - 7, { size: 8.5 });
      drawText(truncate(em.subject ?? "—",        38), MARGIN + 150,       curY - 7, { size: 8.5 });
      drawText(fmt(em.sent_at),                        MARGIN + COL - 110, curY - 7, { size: 8, color: GRAY });
      curY -= 18;
    });
  }

  curY -= 16;
  newPageIfNeeded(60);

  page.drawLine({ start: { x: MARGIN, y: curY }, end: { x: W - MARGIN, y: curY }, thickness: 0.5, color: LGRAY });
  curY -= 20;

  // ── Clients table ──────────────────────────────────────────────────────────
  drawText("Clients Added", MARGIN, curY, { size: 13, font: bold });
  curY -= 18;

  if (clientList.length === 0) {
    drawText("No clients added in this period.", MARGIN, curY, { size: 10, color: GRAY });
    curY -= 20;
  } else {
    page.drawRectangle({ x: MARGIN, y: curY - 16, width: COL, height: 20, color: INDIGO });
    drawText("Name",      MARGIN + 6,         curY - 10, { size: 9, font: bold, color: rgb(1,1,1) });
    drawText("Email",     MARGIN + 140,       curY - 10, { size: 9, font: bold, color: rgb(1,1,1) });
    drawText("Company",   MARGIN + COL - 160, curY - 10, { size: 9, font: bold, color: rgb(1,1,1) });
    drawText("Added",     MARGIN + COL - 65,  curY - 10, { size: 9, font: bold, color: rgb(1,1,1) });
    curY -= 20;

    clientList.forEach((cl, idx) => {
      newPageIfNeeded(20);
      if (idx % 2 === 1) {
        page.drawRectangle({ x: MARGIN, y: curY - 14, width: COL, height: 18, color: rgb(0.97,0.97,0.99) });
      }
      drawText(truncate(cl.name    ?? "—", 20), MARGIN + 6,         curY - 7, { size: 8.5 });
      drawText(truncate(cl.email   ?? "—", 28), MARGIN + 140,       curY - 7, { size: 8.5 });
      drawText(truncate(cl.company ?? "—", 20), MARGIN + COL - 160, curY - 7, { size: 8.5 });
      drawText(fmt(cl.created_at),              MARGIN + COL - 65,  curY - 7, { size: 7.5, color: GRAY });
      curY -= 18;
    });
  }

  // Footer
  newPageIfNeeded(30);
  curY -= 20;
  page.drawLine({ start: { x: MARGIN, y: curY }, end: { x: W - MARGIN, y: curY }, thickness: 0.5, color: LGRAY });
  curY -= 14;
  drawText("Generated by MailMind AI · mailmind-ai.vercel.app", MARGIN, curY, { size: 8, color: GRAY });

  return pdfDoc.save();
}
