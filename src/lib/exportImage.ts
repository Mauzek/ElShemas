import type { Selection } from '../store/useUi';

export const SCHEMA_LAYER_ID = 'schema-layer';

export interface ExportOptions {
  onlySelected: boolean;
  selection: Selection;
  padding: number;
  background: 'white' | 'transparent';
}

export interface BuiltSvg {
  markup: string;
  width: number;
  height: number;
}

const STYLE_PROPS = [
  'fill',
  'stroke',
  'stroke-width',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-dasharray',
  'font-family',
  'font-size',
  'font-style',
  'font-weight',
  'text-anchor',
  'dominant-baseline',
  'opacity',
] as const;

function inlineStyles(source: Element, clone: Element): void {
  const srcNodes = [source, ...Array.from(source.querySelectorAll('*'))];
  const cloneNodes = [clone, ...Array.from(clone.querySelectorAll('*'))];
  for (let i = 0; i < srcNodes.length && i < cloneNodes.length; i++) {
    const s = srcNodes[i];
    const c = cloneNodes[i];
    if (!(s instanceof SVGElement) || !(c instanceof SVGElement)) continue;
    const isText = s.tagName === 'text' || s.tagName === 'tspan';
    const computed = window.getComputedStyle(s);
    for (const prop of STYLE_PROPS) {
      // Шрифтовые свойства нужны только тексту, параметры обводки — только фигурам:
      // иначе экспортированный файл раздувается лишними атрибутами.
      const textOnly = prop.startsWith('font-') || prop === 'text-anchor' || prop === 'dominant-baseline';
      const shapeOnly =
        prop === 'stroke-width' || prop === 'stroke-linecap' || prop === 'stroke-linejoin' || prop === 'stroke-dasharray';
      if (textOnly && !isText) continue;
      if (shapeOnly && isText) continue;
      const value = computed.getPropertyValue(prop);
      if (!value) continue;
      if (prop === 'stroke-dasharray' && value === 'none') continue;
      if (prop === 'opacity' && value === '1') continue;
      c.setAttribute(prop, value.trim());
    }
    c.removeAttribute('class');
    c.removeAttribute('style');
  }
}

function filterSelection(clone: Element, selection: Selection): void {
  const keep = (kind: string | null, id: string | null): boolean => {
    if (!kind || !id) return false;
    if (kind === 'element') return selection.elements.includes(id);
    if (kind === 'wire') return selection.wires.includes(id);
    if (kind === 'label') return selection.labels.includes(id);
    if (kind === 'stroke') return selection.strokes.includes(id);
    return false;
  };
  for (const node of Array.from(clone.querySelectorAll('[data-kind][data-id]'))) {
    if (!keep(node.getAttribute('data-kind'), node.getAttribute('data-id'))) node.remove();
  }
}

/** Собирает самодостаточный SVG из живого слоя схемы: стили встроены, сетка не попадает. */
export function buildSvg(options: ExportOptions): BuiltSvg | null {
  const source = document.getElementById(SCHEMA_LAYER_ID);
  if (!source) return null;

  const clone = source.cloneNode(true) as SVGGElement;
  inlineStyles(source, clone);
  if (options.onlySelected) filterSelection(clone, options.selection);
  clone.removeAttribute('id');
  clone.removeAttribute('transform');

  const svgNs = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNs, 'svg');
  svg.setAttribute('xmlns', svgNs);
  svg.setAttribute('version', '1.1');
  const bgRect = document.createElementNS(svgNs, 'rect');
  if (options.background === 'white') svg.appendChild(bgRect);
  svg.appendChild(clone);

  const holder = document.createElement('div');
  holder.setAttribute('style', 'position:fixed;left:-20000px;top:0;width:1px;height:1px;overflow:hidden');
  holder.appendChild(svg);
  document.body.appendChild(holder);

  let box: DOMRect;
  try {
    box = clone.getBBox();
  } catch {
    document.body.removeChild(holder);
    return null;
  }

  const pad = options.padding;
  const width = Math.max(1, Math.ceil(box.width + pad * 2));
  const height = Math.max(1, Math.ceil(box.height + pad * 2));
  const minX = Math.floor(box.x - pad);
  const minY = Math.floor(box.y - pad);
  svg.setAttribute('viewBox', `${minX} ${minY} ${width} ${height}`);
  svg.setAttribute('width', String(width));
  svg.setAttribute('height', String(height));
  if (options.background === 'white') {
    bgRect.setAttribute('x', String(minX));
    bgRect.setAttribute('y', String(minY));
    bgRect.setAttribute('width', String(width));
    bgRect.setAttribute('height', String(height));
    bgRect.setAttribute('fill', '#ffffff');
  }

  const markup = new XMLSerializer().serializeToString(svg);
  document.body.removeChild(holder);
  return { markup: `<?xml version="1.0" encoding="UTF-8"?>\n${markup}`, width, height };
}

/** Растеризация собранного SVG в PNG заданного масштаба. */
export function svgToPng(built: BuiltSvg, scale: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([built.markup], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(built.width * scale));
      canvas.height = Math.max(1, Math.round(built.height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Canvas недоступен'));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((out) => {
        if (out) resolve(out);
        else reject(new Error('Не удалось создать PNG'));
      }, 'image/png');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Не удалось отрисовать SVG'));
    };
    img.src = url;
  });
}

/** Data URL для предпросмотра в диалоге экспорта. */
export function svgToDataUrl(built: BuiltSvg): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(built.markup)}`;
}
