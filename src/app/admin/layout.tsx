import React from "react";
import type { Metadata } from "next";
import { AdminProvider } from "@/components/admin/AdminContext";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: "Admin Console — ALNAVARROCES",
  description:
    "Separate Administration Console for A.L. Navarro Central Elementary School (ALNAVARROCES).",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminProvider>
      <AdminShell>{children}</AdminShell>
    </AdminProvider>
  );
}
