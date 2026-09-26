// Полифиллы для планшетов на iPadOS 15.0–15.3 (Safari до 15.4).
// Next.js 16 рассчитан на Safari 16.4+: синтаксис понижается через browserslist
// в package.json, а недостающие встроенные методы добавляются здесь — этот
// файл выполняется до того, как приложение становится интерактивным.

function at<T>(this: ArrayLike<T>, index: number): T | undefined {
  const n = Math.trunc(index) || 0;
  const i = n < 0 ? this.length + n : n;
  return i < 0 || i >= this.length ? undefined : this[i];
}

for (const proto of [Array.prototype, String.prototype, Object.getPrototypeOf(Int8Array.prototype)]) {
  if (typeof proto.at !== "function") {
    Object.defineProperty(proto, "at", { value: at, writable: true, configurable: true });
  }
}

if (typeof Object.hasOwn !== "function") {
  Object.defineProperty(Object, "hasOwn", {
    value: (obj: object, key: PropertyKey) => Object.prototype.hasOwnProperty.call(obj, key),
    writable: true,
    configurable: true,
  });
}
