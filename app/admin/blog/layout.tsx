// Auth guard is handled by the parent admin/layout.tsx
export default function AdminBlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
