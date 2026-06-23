import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import UpgradePrompt from "@/components/ui/UpgradePrompt";
import ThemeProvider from "@/components/ThemeProvider";

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
      <head>
        {/* Apply saved theme + mode before React hydrates to avoid flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('mailmind_theme');if(t)document.documentElement.setAttribute('data-theme',t);var m=localStorage.getItem('mailmind_mode');document.documentElement.setAttribute('data-mode',m||'light');}catch(e){}})();`,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <ToastProvider>
            {children}
            <UpgradePrompt />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
