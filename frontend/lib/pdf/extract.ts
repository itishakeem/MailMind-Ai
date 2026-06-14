import pdfParse from "pdf-parse";

export class PdfExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PdfExtractionError";
  }
}

const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10 MB

export async function extractPdfText(buffer: Buffer): Promise<string> {
  if (buffer.length > MAX_PDF_BYTES) {
    throw new PdfExtractionError(
      "PDF exceeds the 10 MB limit. Please use a smaller file."
    );
  }

  let data: { text?: string };
  try {
    data = await pdfParse(buffer);
  } catch {
    throw new PdfExtractionError(
      "Failed to read the PDF. The file may be corrupted or password-protected. Please type a description instead."
    );
  }

  const text = data.text?.trim();
  if (!text) {
    throw new PdfExtractionError(
      "Could not extract text from this PDF — it may contain only scanned images. Please type a description instead."
    );
  }

  return text;
}
