import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import UpgradePrompt from "@/components/ui/UpgradePrompt";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MailMind AI — Your Work. Your Email. AI-Powered.",
  description:
    "Send professional emails to your clients automatically from your own Gmail. Built for South Asian freelancers and small businesses.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ToastProvider>
          {children}
          <UpgradePrompt />
        </ToastProvider>
      </body>
    </html>
  );
}
