import type { Metadata } from "next";
import "./globals.css";

import { getThemeBootstrapScript } from "@/lib/theme";

const siteDescription =
  "MiniBlog is a focused place to read and share concise posts from independent authors.";
const siteTitle = "MiniBlog | Read and Share Focused Posts";

export const metadata: Metadata = {
  applicationName: "MiniBlog",
  title: {
    default: siteTitle,
    template: "%s | MiniBlog"
  },
  description: siteDescription,
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    siteName: "MiniBlog",
    type: "website"
  },
  twitter: {
    card: "summary",
    title: siteTitle,
    description: siteDescription
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{ __html: getThemeBootstrapScript() }}
        />
        {children}
      </body>
    </html>
  );
}
