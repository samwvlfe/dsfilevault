import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DC File Vault",
  description: "Auth. Sam Wolfe",
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
