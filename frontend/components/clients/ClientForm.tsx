"use client";

import { useState } from "react";
import type { Client } from "@/types";

interface ClientFormProps {
  /** If provided, the form PUTs to /api/clients/[client.id] (edit mode). */
  client?: Client;
  onSuccess: (client: Client) => void;
  onCancel: () => void;
}

interface FieldErrors {
  name?: string;
  email?: string;
  general?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ClientForm({ client, onSuccess, onCancel }: ClientFormProps) {
  const isEdit = !!client;

  const [form, setForm] = useState({
    name: client?.name ?? "",
    email: client?.email ?? "",
    phone: client?.phone ?? "",
    company: client?.company ?? "",
    address: client?.address ?? "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const next: FieldErrors = {};
    if (!form.name.trim()) next.name = "Name is required.";
    if (!form.email.trim()) next.email = "Email is required.";
    else if (!EMAIL_RE.test(form.email)) next.email = "Enter a valid email address.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    const url = isEdit ? `/api/clients/${client.id}` : "/api/clients";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        company: form.company.trim() || null,
        address: form.address.trim() || null,
      }),
    });

    setLoading(false);

    if (res.status === 402) {
      const data = await res.json();
      setErrors({ general: data.error ?? "Client limit reached. Please upgrade your plan." });
      return;
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data.field) {
        setErrors({ [data.field]: data.error });
      } else {
        setErrors({ general: data.error ?? "Something went wrong. Please try again." });
      }
      return;
    }

    const saved: Client = await res.json();
    onSuccess(saved);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.general && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {errors.general}
        </p>
      )}

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          maxLength={200}
          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.name ? "border-red-400" : "border-gray-300"
          }`}
          placeholder="Ahmed Khan"
        />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email Address <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.email ? "border-red-400" : "border-gray-300"
          }`}
          placeholder="client@example.com"
        />
        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          maxLength={200}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="03001234567"
        />
      </div>

      {/* Company */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
        <input
          type="text"
          value={form.company}
          onChange={(e) => setForm({ ...form, company: e.target.value })}
          maxLength={200}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Acme Corp"
        />
      </div>

      {/* Address */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
        <input
          type="text"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          maxLength={200}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Lahore, Pakistan"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2.5 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {loading ? "Saving…" : isEdit ? "Save Changes" : "Add Client"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 px-4 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
