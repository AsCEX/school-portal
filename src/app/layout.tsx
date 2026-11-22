import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ALNAVARROCES — A.L. Navarro Central Elementary School Portal",
  description:
    "Official School Portal of A.L. Navarro Central Elementary School (ALNAVARROCES) featuring announcements, upcoming campus events, school statistics, and teaching and non-teaching employee profiles.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Source+Serif+4:opsz,wght@8..60,600;8..60,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
