import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "InsightFC",
  description: "InsightFC — coaching + game tagging + stats",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white min-h-screen">
        <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
