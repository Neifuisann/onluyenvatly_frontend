import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bài Học - Ôn Luyện Vật Lý",
  description: "Làm bài tập vật lý lớp 12",
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function LessonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}