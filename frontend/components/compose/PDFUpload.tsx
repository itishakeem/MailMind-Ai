"use client";

import { useRef, useState } from "react";

interface PDFUploadProps {
  onExtracted: (result: { document_id: string; extracted_text: string }) => void;
  onError: (message: string) => void;
}

function formatBytes(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PDFUpload({ onExtracted, onError }: PDFUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  async function handleFile(selected: File) {
    setFile(selected);
    setUploading(true);
    setProgress(20);

    const formData = new FormData();
    formData.append("file", selected);

    try {
      setProgress(60);
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });
      setProgress(90);

      if (res.status === 413) {
        onError("PDF is too large (max 10 MB). Please use a smaller file.");
        setUploading(false);
        setFile(null);
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        onError(data.error ?? "Could not read PDF — please type a description instead.");
        setUploading(false);
        setFile(null);
        return;
      }

      setProgress(100);
      onExtracted({ document_id: data.document_id, extracted_text: data.extracted_text });
    } catch {
      onError("Upload failed. Please check your connection and try again.");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === "application/pdf") handleFile(dropped);
    else onError("Please upload a PDF file.");
  }

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
      >
        <svg
          className="w-10 h-10 mx-auto text-gray-400 mb-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <p className="text-sm font-medium text-gray-700">
          Drop a PDF here or click to browse
        </p>
        <p className="text-xs text-gray-400 mt-1">Max 10 MB · Invoices, contracts, reports</p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </div>

      {file && (
        <div className="mt-3 flex items-center gap-3 text-sm text-gray-700">
          <svg className="w-4 h-4 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="truncate">{file.name}</span>
          <span className="text-gray-400 shrink-0">{formatBytes(file.size)}</span>
        </div>
      )}

      {uploading && (
        <div className="mt-2">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">Extracting text…</p>
        </div>
      )}
    </div>
  );
}
