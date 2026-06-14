import SignupForm from "@/components/auth/SignupForm";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Create your account</h2>
        <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
          Start sending AI-powered emails today.
        </p>
      </div>
      <SignupForm />
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" style={{ borderColor: "rgba(255,255,255,0.12)" }} />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-3 text-sm" style={{ background: "transparent", color: "rgba(255,255,255,0.35)" }}>
            or
          </span>
        </div>
      </div>
      <GoogleSignInButton />
      <p className="text-center text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
        Already have an account?{" "}
        <Link href="/auth/login" className="font-semibold text-blue-400 hover:text-blue-300 transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
