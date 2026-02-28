import { Metadata } from "next";
import { AdminAuthGuard } from "@/components/AdminAuthGuard";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Mind Mesh administration dashboard",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminAuthGuard>{children}</AdminAuthGuard>;
}
