import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "EduQuest",
  description: "Остров растёт вместе с учеником",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
