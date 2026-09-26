# spotlight-mini-web

Веб-каталог песен караоке для планшетов (Next.js). Поиск идёт через API
[spotlight-mini-api](https://github.com/rinegoo/spotlight-mini-api).

## Разработка

```sh
npm install
CATALOG_API_URL=http://localhost:8080 npm run dev -- -H 0.0.0.0
```

Браузер обращается только к Next.js: запросы `/api/*` проксируются в API
(`src/app/api/[...path]/route.ts`). `CATALOG_API_URL` читается при каждом запросе,
а не при сборке, поэтому один образ подходит для любого окружения.

| Переменная | По умолчанию | |
|---|---|---|
| `CATALOG_API_URL` | `http://localhost:8080` (в образе — `http://server:8080`) | адрес API |
| `PORT` | `3000` | |

Проверки: `npm run typecheck`, `npm run lint`.

## Старые планшеты (iPadOS 15)

Next.js 16 и Tailwind v4 рассчитаны на Safari 16.4+. Чтобы каталог работал на
iPadOS 15, в `package.json` задан `browserslist` с `safari 15` / `ios_saf 15` —
без него минификатор выдаёт статические блоки классов (`static { … }`), и
продакшн-сборка на Safari 15 падает с SyntaxError (в `next dev` этого нет).
Недостающие методы (`Array.prototype.at`, `Object.hasOwn`) добавляются в
`src/instrumentation-client.ts`. Нижняя граница — iPadOS 15.4: стили Tailwind
лежат в `@layer`, который более ранний Safari игнорирует.

## Сборка

GitHub Actions (`.github/workflows/ci.yml`): typecheck и lint, затем Docker-образ
`ghcr.io/rinegoo/spotlight-mini-web` (standalone-сборка Next.js).
Теги: `latest` и `sha-<commit>` для `main`, `1.2.3` / `1.2` для git-тегов `v1.2.3`.
Запуск вместе с API — `deploy/docker-compose.yml` в репозитории API.
