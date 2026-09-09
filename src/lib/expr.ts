/**
 * Вычислитель арифметических выражений в значениях элементов: «2*R», «sqrt(2)*100», «Rn/3».
 * Рекурсивный спуск, без eval и внешних библиотек.
 */

export type ExprResult = { ok: true; value: number } | { ok: false; error: string };

export type Vars = Record<string, number>;

const FUNCS: Record<string, (x: number) => number> = {
  sqrt: Math.sqrt,
  abs: Math.abs,
  sin: Math.sin,
  cos: Math.cos,
};

const CONSTS: Record<string, number> = { pi: Math.PI };

const isDigit = (c: string) => c >= '0' && c <= '9';
/** Имя переменной: латиница, кириллица, цифры, подчёркивание и штрихи. */
const isNameStart = (c: string) => /[A-Za-zА-Яа-яЁё_]/.test(c);
const isNamePart = (c: string) => /[A-Za-zА-Яа-яЁё0-9_′″']/.test(c);

class Parser {
  private i = 0;

  constructor(
    private readonly src: string,
    private readonly vars: Vars,
  ) {}

  parse(): number {
    const value = this.expr();
    this.skip();
    if (this.i < this.src.length) throw new Error(`Лишний символ «${this.src[this.i]}»`);
    return value;
  }

  private skip(): void {
    while (this.i < this.src.length && /\s/.test(this.src[this.i])) this.i += 1;
  }

  private eat(token: string): boolean {
    this.skip();
    if (this.src.startsWith(token, this.i)) {
      this.i += token.length;
      return true;
    }
    return false;
  }

  private expr(): number {
    let left = this.term();
    for (;;) {
      if (this.eat('+')) left += this.term();
      else if (this.eat('-')) left -= this.term();
      else return left;
    }
  }

  private term(): number {
    let left = this.unary();
    for (;;) {
      if (this.eat('*')) left *= this.unary();
      else if (this.eat('/')) {
        const divisor = this.unary();
        if (divisor === 0) throw new Error('Деление на ноль');
        left /= divisor;
      } else return left;
    }
  }

  /** Унарный минус слабее степени: −2^2 = −(2^2), как в математике. */
  private unary(): number {
    if (this.eat('-')) return -this.unary();
    if (this.eat('+')) return this.unary();
    return this.power();
  }

  /** Степень правоассоциативна: 2^3^2 = 2^(3^2), показатель может быть отрицательным. */
  private power(): number {
    const base = this.atom();
    if (this.eat('^')) return base ** this.unary();
    return base;
  }

  private atom(): number {
    this.skip();
    if (this.i >= this.src.length) throw new Error('Выражение оборвано');
    const c = this.src[this.i];

    if (c === '(') {
      this.i += 1;
      const value = this.expr();
      if (!this.eat(')')) throw new Error('Не хватает закрывающей скобки');
      return value;
    }

    if (isDigit(c) || c === '.' || c === ',') return this.number();

    if (isNameStart(c)) {
      const start = this.i;
      while (this.i < this.src.length && isNamePart(this.src[this.i])) this.i += 1;
      const name = this.src.slice(start, this.i);
      const fn = FUNCS[name.toLowerCase()];
      if (fn) {
        if (!this.eat('(')) throw new Error(`После «${name}» ожидалась скобка`);
        const arg = this.expr();
        if (!this.eat(')')) throw new Error('Не хватает закрывающей скобки');
        const value = fn(arg);
        if (!Number.isFinite(value)) throw new Error(`«${name}» не определена при таком аргументе`);
        return value;
      }
      const constant = CONSTS[name.toLowerCase()];
      if (constant !== undefined) return constant;
      const variable = this.vars[name];
      if (variable === undefined) throw new Error(`Неизвестная переменная «${name}»`);
      return variable;
    }

    throw new Error(`Непонятный символ «${c}»`);
  }

  private number(): number {
    const start = this.i;
    while (this.i < this.src.length && (isDigit(this.src[this.i]) || '.,'.includes(this.src[this.i]))) {
      this.i += 1;
    }
    const text = this.src.slice(start, this.i).replace(',', '.');
    const value = Number(text);
    if (!Number.isFinite(value)) throw new Error(`Некорректное число «${text}»`);
    return value;
  }
}

/** Вычисляет выражение. Ошибка возвращается текстом, исключение наружу не летит. */
export function evaluateExpr(source: string, vars: Vars = {}): ExprResult {
  const text = source.trim();
  if (!text) return { ok: false, error: 'Пустое выражение' };
  try {
    const value = new Parser(text, vars).parse();
    if (!Number.isFinite(value)) return { ok: false, error: 'Результат не является числом' };
    return { ok: true, value };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ошибка разбора' };
  }
}

/** Ссылается ли выражение на другие имена (нужно для поиска циклов). */
export function referencedNames(source: string): string[] {
  const out: string[] = [];
  const re = /[A-Za-zА-Яа-яЁё_][A-Za-zА-Яа-яЁё0-9_′″']*/g;
  for (const m of source.matchAll(re)) {
    const name = m[0];
    if (FUNCS[name.toLowerCase()] || CONSTS[name.toLowerCase()]) continue;
    out.push(name);
  }
  return out;
}
