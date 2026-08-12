import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Client Portal",
  description: "View your open work, submit a request, and upload documents."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-mist text-ink font-sans antialiased">{children}</body>
    </html>
  );
}
