import type { MetadataRoute } from "next";

// Манифест для установки каталога на экран «Домой» планшета: приложение
// открывается на весь экран, без интерфейса браузера. Где fullscreen не
// поддерживается (iPadOS), браузер откатывается на standalone.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Каталог песен — Квартирник",
    short_name: "Каталог песен",
    description: "Поиск песен в каталоге караоке",
    lang: "ru",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "fullscreen",
    display_override: ["fullscreen", "standalone"],
    orientation: "any",
    background_color: "#0e0e12",
    theme_color: "#0e0e12",
    categories: ["entertainment", "music"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
