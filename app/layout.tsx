import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";


export const metadata: Metadata = {
  title: "VapeTrack PH",
  description: "Multi-tenant SaaS for Philippine vape shops",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}