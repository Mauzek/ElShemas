/** Системы непересекающихся множеств для анализа топологии цепи. */

export class SimpleDsu {
  private parent = new Map<string, string>();

  find(k: string): string {
    let root = this.parent.get(k);
    if (root === undefined) {
      this.parent.set(k, k);
      return k;
    }
    while (root !== this.parent.get(root)) root = this.parent.get(root) as string;
    let cur = k;
    while (cur !== root) {
      const next = this.parent.get(cur) as string;
      this.parent.set(cur, root);
      cur = next;
    }
    return root;
  }

  union(a: string, b: string): void {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) this.parent.set(ra, rb);
  }
}

export type PotentialUnion = 'joined' | 'consistent' | 'conflict';

/**
 * Объединение с разностью потенциалов: узлы, связанные идеальными источниками
 * и перемычками, образуют жёсткую конструкцию с известными разностями.
 * Позволяет отличить противоречивый контур источников ЭДС от избыточного.
 */
export class PotentialDsu {
  private parent = new Map<string, string>();
  /** Потенциал узла минус потенциал его родителя. */
  private offset = new Map<string, number>();

  /** Корень множества и потенциал узла относительно корня. */
  find(k: string): { root: string; potential: number } {
    if (!this.parent.has(k)) {
      this.parent.set(k, k);
      this.offset.set(k, 0);
      return { root: k, potential: 0 };
    }
    const path: string[] = [];
    let cur = k;
    while (this.parent.get(cur) !== cur) {
      path.push(cur);
      cur = this.parent.get(cur) as string;
    }
    const root = cur;
    // Сжатие пути с пересчётом смещений от конца к началу.
    let accumulated = 0;
    for (let i = path.length - 1; i >= 0; i--) {
      const node = path[i];
      accumulated += this.offset.get(node) as number;
      this.parent.set(node, root);
      this.offset.set(node, accumulated);
    }
    return { root, potential: this.offset.get(k) ?? 0 };
  }

  /** Задаёт условие V(b) − V(a) = delta. */
  union(a: string, b: string, delta: number): PotentialUnion {
    const fa = this.find(a);
    const fb = this.find(b);
    if (fa.root === fb.root) {
      const expected = fb.potential - fa.potential;
      const scale = Math.max(1, Math.abs(delta), Math.abs(expected));
      return Math.abs(expected - delta) <= scale * 1e-9 ? 'consistent' : 'conflict';
    }
    // V(rootB) = V(rootA) + potA + delta − potB
    this.parent.set(fb.root, fa.root);
    this.offset.set(fb.root, fa.potential + delta - fb.potential);
    return 'joined';
  }
}
