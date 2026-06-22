import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MEAVO Assembly",
  description: "Install questionnaires for assembly partners",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
