import type { Point, SchemaFile } from '../types/schema';
import { elementPorts, key, pointOnSegmentInterior, samePoint } from './geometry';

class Dsu {
  private parent = new Map<string, string>();

  add(k: string): void {
    if (!this.parent.has(k)) this.parent.set(k, k);
  }

  find(k: string): string {
    this.add(k);
    let root = k;
    while (this.parent.get(root) !== root) root = this.parent.get(root) as string;
    let cur = k;
    while (this.parent.get(cur) !== root) {
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

export interface PortAt {
  elementId: string;
  portIndex: number;
  point: Point;
}

export interface Connectivity {
  /** Электрический узел точки: корень объединения. */
  nodeOf: (p: Point) => string;
  /** Точки, в которых рисуется жирная точка соединения. */
  junctions: Point[];
  /** Все выводы элементов с мировыми координатами. */
  ports: PortAt[];
  /** Выводы, ни к чему не подключённые. */
  dangling: PortAt[];
  /** Количество электрических узлов, к которым подключён хотя бы один вывод. */
  nodeCount: number;
  /** Узлы, где сходятся три и более ветви (для метода узловых потенциалов). */
  branchNodeCount: number;
  /** Число связных фрагментов схемы. */
  fragments: number;
}

interface Incident {
  point: Point;
  segments: number;
  termini: number;
  ports: number;
}

export function analyze(doc: SchemaFile): Connectivity {
  const dsu = new Dsu();
  const ports: PortAt[] = [];
  for (const el of doc.elements) {
    elementPorts(el).forEach((point, portIndex) => {
      ports.push({ elementId: el.id, portIndex, point });
      dsu.add(key(point));
    });
  }

  const interest: Point[] = ports.map((p) => p.point);
  for (const w of doc.wires) for (const p of w.points) interest.push(p);

  const byY = new Map<number, Point[]>();
  const byX = new Map<number, Point[]>();
  for (const p of interest) {
    const yk = Math.round(p.y);
    const xk = Math.round(p.x);
    const ly = byY.get(yk);
    if (ly) ly.push(p);
    else byY.set(yk, [p]);
    const lx = byX.get(xk);
    if (lx) lx.push(p);
    else byX.set(xk, [p]);
  }

  const incidents = new Map<string, Incident>();
  const bump = (p: Point, field: keyof Omit<Incident, 'point'>, by = 1) => {
    const k = key(p);
    const cur = incidents.get(k);
    if (cur) cur[field] += by;
    else incidents.set(k, { point: p, segments: 0, termini: 0, ports: 0, [field]: by } as Incident);
  };

  for (const port of ports) bump(port.point, 'ports');

  for (const w of doc.wires) {
    for (let i = 0; i < w.points.length - 1; i++) {
      const a = w.points[i];
      const b = w.points[i + 1];
      dsu.union(key(a), key(b));
      bump(a, 'segments');
      bump(b, 'segments');

      let candidates: Point[];
      if (Math.round(a.y) === Math.round(b.y)) candidates = byY.get(Math.round(a.y)) ?? [];
      else if (Math.round(a.x) === Math.round(b.x)) candidates = byX.get(Math.round(a.x)) ?? [];
      else candidates = interest;

      for (const p of candidates) {
        if (pointOnSegmentInterior(p, a, b)) {
          dsu.union(key(p), key(a));
          bump(p, 'segments', 2);
        }
      }
    }
    if (w.points.length > 0) {
      bump(w.points[0], 'termini');
      bump(w.points[w.points.length - 1], 'termini');
    }
  }

  const junctions: Point[] = [];
  for (const inc of incidents.values()) {
    const total = inc.segments + inc.ports;
    if (total >= 3 && inc.termini + inc.ports >= 1 && inc.segments >= 2) junctions.push(inc.point);
  }

  const dangling: PortAt[] = [];
  for (const port of ports) {
    const inc = incidents.get(key(port.point));
    const touching = inc ? inc.segments : 0;
    const sharedPorts = inc ? inc.ports : 1;
    if (touching === 0 && sharedPorts < 2) dangling.push(port);
  }

  const roots = new Set<string>();
  const perNode = new Map<string, number>();
  for (const port of ports) {
    const root = dsu.find(key(port.point));
    roots.add(root);
    perNode.set(root, (perNode.get(root) ?? 0) + 1);
  }
  let branchNodeCount = 0;
  for (const count of perNode.values()) if (count >= 3) branchNodeCount += 1;

  // Связные фрагменты: элементы объединяются, если их выводы попали в один узел.
  const elementDsu = new Dsu();
  const nodeOwner = new Map<string, string>();
  for (const el of doc.elements) elementDsu.add(el.id);
  for (const port of ports) {
    const root = dsu.find(key(port.point));
    const owner = nodeOwner.get(root);
    if (owner) elementDsu.union(owner, port.elementId);
    else nodeOwner.set(root, port.elementId);
  }
  const fragmentRoots = new Set<string>();
  for (const el of doc.elements) {
    if (elementPorts(el).length === 0) continue;
    fragmentRoots.add(elementDsu.find(el.id));
  }

  return {
    nodeOf: (p) => dsu.find(key(p)),
    junctions,
    ports,
    dangling,
    nodeCount: roots.size,
    branchNodeCount,
    fragments: fragmentRoots.size,
  };
}

/** Ближайший вывод элемента к точке в пределах радиуса. */
export function findPortNear(doc: SchemaFile, p: Point, radius: number): PortAt | null {
  let best: PortAt | null = null;
  let bestDist = radius;
  for (const el of doc.elements) {
    elementPorts(el).forEach((point, portIndex) => {
      const d = Math.hypot(point.x - p.x, point.y - p.y);
      if (d <= bestDist) {
        bestDist = d;
        best = { elementId: el.id, portIndex, point };
      }
    });
  }
  return best;
}

export function pointsEqual(a: Point, b: Point): boolean {
  return samePoint(a, b);
}
