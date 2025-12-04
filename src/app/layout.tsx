import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Laser Eye Institute Billing Portal",
  description: "Secure billing portal for Laser Eye Institute",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
