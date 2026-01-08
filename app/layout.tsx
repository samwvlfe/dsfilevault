import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DS File Vault",
  icons: {
    icon: [{ url: "/ds-logo.png", type: "image/png" }],
  },

};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
