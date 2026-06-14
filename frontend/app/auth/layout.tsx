export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative min-h-screen flex items-center justify-center py-14 px-4 overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0a0f1e 0%, #1e1b4b 45%, #0f172a 100%)" }}
    >
      {/* Ambient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div
          className="animate-float absolute rounded-full blur-3xl opacity-25"
          style={{ width: 480, height: 480, top: "-10%", left: "-12%", background: "radial-gradient(circle, #1d4ed8, #4f46e5)" }}
        />
        <div
          className="animate-float absolute rounded-full blur-3xl opacity-20"
          style={{ width: 360, height: 360, bottom: "-8%", right: "-8%", background: "radial-gradient(circle, #7c3aed, #4f46e5)", animationDelay: "3s" }}
        />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md">
        {/* Brand mark */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-extrabold text-white shadow-brand-md"
            style={{ background: "linear-gradient(135deg,#2563eb,#4f46e5,#7c3aed)" }}
          >
            M
          </div>
          <h1 className="text-2xl font-bold text-white">MailMind AI</h1>
          <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
            Your Work. Your Email. AI-Powered.
          </p>
        </div>

        {/* Glass card */}
        <div
          className="rounded-2xl px-8 py-8"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            backdropFilter: "blur(22px)",
            WebkitBackdropFilter: "blur(22px)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
