// app/blog/layout.tsx
import { ReactNode } from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog | MindMesh",
  description: "Read articles, tutorials, and updates from the MindMesh community.",
  openGraph: {
    title: "Blog | MindMesh",
    description: "Read articles, tutorials, and updates from the MindMesh community.",
  },
};

export default function BlogLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-default-100">
      {children}
    </div>
  );
}