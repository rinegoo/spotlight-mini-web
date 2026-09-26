import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Каталог песен",
  description: "Поиск песен в каталоге караоке",
  applicationName: "Каталог песен",
  appleWebApp: {
    capable: true,
    title: "Каталог песен",
    // Контент заходит под строку состояния — отступы задаются через safe-area.
    statusBarStyle: "black-translucent",
  },
  // Next выводит только mobile-web-app-capable, а Safari до 16.4 (iPadOS 15)
  // открывает сайт с экрана «Домой» без интерфейса браузера по этому тегу.
  other: { "apple-mobile-web-app-capable": "yes" },
  // Номера песен — не телефоны: иначе iOS превращает их в ссылки.
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0e0e12",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className="h-full antialiased">
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
