let counter = 0;

/** Короткий идентификатор, уникальный в пределах сессии и стабильный в файле. */
export function makeId(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter.toString(36)}`;
}
