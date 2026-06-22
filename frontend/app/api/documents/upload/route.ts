import { createClient } from "@/lib/supabase/server";
import { extractPdfText, PdfExtractionError } from "@/lib/pdf/extract";
import { NextResponse, type NextRequest } from "next/server";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "PDF exceeds the 10 MB limit. Please use a smaller file." },
      { status: 413 }
    );
  }

  const filename =
    file instanceof File ? file.name : "upload.pdf";

  const buffer = Buffer.from(await file.arrayBuffer());

  // Validate PDF magic bytes (%PDF) regardless of browser-reported MIME type or filename
  const isPdf = buffer.length >= 4 && buffer.slice(0, 4).toString("ascii") === "%PDF";
  if (!isPdf) {
    return NextResponse.json(
      { error: "Only PDF files are accepted." },
      { status: 400 }
    );
  }

  let extractedText: string;
  try {
    extractedText = await extractPdfText(buffer);
  } catch (err) {
    if (err instanceof PdfExtractionError) {
      return NextResponse.json(
        { error: err.message, fallback: "manual_input" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Unexpected error processing PDF", fallback: "manual_input" },
      { status: 500 }
    );
  }

  const { data: doc, error: insertError } = await supabase
    .from("documents")
    .insert({ user_id: user.id, filename, extracted_text: extractedText })
    .select()
    .single();

  if (insertError || !doc) {
    return NextResponse.json({ error: "Failed to save document" }, { status: 500 });
  }

  return NextResponse.json({
    document_id: doc.id,
    extracted_text: extractedText,
    filename,
  });
}
