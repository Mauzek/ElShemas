import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import type { Rect } from '../../types/schema';
import { useDoc } from '../../store/useDoc';
import { useUi } from '../../store/useUi';
import { analyze } from '../../lib/nodes';
import { computeHops, type Hop } from '../../lib/crossings';
import { elementBBox, elementPorts, pointsRect } from '../../lib/geometry';
import { SCHEMA_LAYER_ID } from '../../lib/exportImage';
import { Grid } from './Grid';
import { ElementView } from './ElementView';
import { ElementLabel } from './ElementLabel';
import { WireView } from './WireView';
import { FreeLabelView } from './FreeLabelView';
import { StrokeView, strokePath } from './StrokeView';
import { Junctions } from './Junctions';
import { Overlay } from './Overlay';
import { InlineEditor } from '../InlineEditor';
import { ZoomIndicator } from '../ZoomIndicator';
import { FloatingToolbar } from '../FloatingToolbar';
import { useCanvasPointer } from './useCanvasPointer';

const NO_HOPS: Hop[] = [];

export function Canvas() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ width: 1200, height: 800 });

  const doc = useDoc((s) => s.doc);
  const viewport = useUi((s) => s.viewport);
  const selection = useUi((s) => s.selection);
  const settings = useUi((s) => s.settings);
  const tool = useUi((s) => s.tool);
  const wireDraft = useUi((s) => s.wireDraft);
  const placing = useUi((s) => s.placingType);
  const spacePan = useUi((s) => s.spacePan);

  const pointer = useCanvasPointer(svgRef);

  useEffect(() => {
    const node = wrapRef.current;
    if (!node) return;
    const update = () => {
      const next = { width: node.clientWidth, height: node.clientHeight };
      setSize(next);
      useUi.getState().setViewSize(next);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Анализ связности — отложенный: во время перетаскивания не тормозит рендер.
  const deferredDoc = useDeferredValue(doc);
  const conn = useMemo(() => analyze(deferredDoc), [deferredDoc]);
  const hops = useMemo(() => {
    if (settings.crossingStyle !== 'hop') return new Map<string, Hop[]>();
    const keys = new Set(conn.junctions.map((p) => `${Math.round(p.x)}:${Math.round(p.y)}`));
    return computeHops(deferredDoc.wires, keys);
  }, [deferredDoc, settings.crossingStyle, conn]);

  const selectedElements = useMemo(() => new Set(selection.elements), [selection.elements]);
  const selectedWires = useMemo(() => new Set(selection.wires), [selection.wires]);
  const selectedLabels = useMemo(() => new Set(selection.labels), [selection.labels]);
  const selectedStrokes = useMemo(() => new Set(selection.strokes), [selection.strokes]);

  const boxes = useMemo(() => {
    const out: Rect[] = [];
    for (const el of doc.elements) if (selectedElements.has(el.id)) out.push(elementBBox(el));
    for (const w of doc.wires) {
      if (!selectedWires.has(w.id)) continue;
      const r = pointsRect(w.points);
      if (r) out.push(r);
    }
    for (const l of doc.labels) {
      if (!selectedLabels.has(l.id)) continue;
      out.push({ x: l.x - 4, y: l.y - l.fontSize, w: Math.max(20, l.text.length * l.fontSize * 0.6), h: l.fontSize + 6 });
    }
    for (const st of doc.strokes) {
      if (!selectedStrokes.has(st.id)) continue;
      const r = pointsRect(st.points);
      if (r) out.push(r);
    }
    return out;
  }, [doc, selectedElements, selectedWires, selectedLabels, selectedStrokes]);

  const ports = useMemo(() => {
    if (tool !== 'wire') return [];
    return doc.elements.flatMap((el) => elementPorts(el));
  }, [doc.elements, tool]);

  const cursor = placing
    ? 'crosshair'
    : spacePan
      ? 'grabbing'
      : tool === 'hand'
        ? 'grab'
        : tool === 'wire' || tool === 'text' || tool === 'draw'
          ? 'crosshair'
          : 'default';

  return (
    <div
      ref={wrapRef}
      className="print-canvas no-select absolute inset-0 overflow-hidden"
      style={{ background: "var(--canvas-bg)" }}
    >
      <svg
        ref={svgRef}
        width={size.width}
        height={size.height}
        style={{ cursor, display: "block", touchAction: "none" }}
        onPointerDown={pointer.onPointerDown}
        onPointerMove={pointer.onPointerMove}
        onPointerUp={pointer.onPointerUp}
        onPointerCancel={pointer.onPointerUp}
        onWheel={pointer.onWheel}
        onDoubleClick={pointer.onDoubleClick}
        onContextMenu={pointer.onContextMenu}
        onDragOver={pointer.onDragOver}
        onDrop={pointer.onDrop}
      >
        {settings.showGrid && (
          <Grid
            grid={doc.grid}
            viewport={viewport}
            width={size.width}
            height={size.height}
          />
        )}
        <g
          transform={`translate(${viewport.x} ${viewport.y}) scale(${viewport.zoom})`}
        >
          <g id={SCHEMA_LAYER_ID}>
            <g data-layer="wires">
              {doc.wires.map((w) => (
                <WireView
                  key={w.id}
                  wire={w}
                  selected={selectedWires.has(w.id)}
                  hops={hops.get(w.id) ?? NO_HOPS}
                />
              ))}
            </g>
            <Junctions points={conn.junctions} />
            <g data-layer="elements">
              {doc.elements.map((el) => (
                <ElementView
                  key={el.id}
                  element={el}
                  selected={selectedElements.has(el.id)}
                />
              ))}
            </g>
            <g data-layer="labels">
              {doc.elements.map((el) => (
                <ElementLabel
                  key={el.id}
                  element={el}
                  selected={selectedElements.has(el.id)}
                />
              ))}
              {doc.labels.map((l) => (
                <FreeLabelView
                  key={l.id}
                  label={l}
                  selected={selectedLabels.has(l.id)}
                />
              ))}
            </g>
            <g data-layer="strokes">
              {doc.strokes.map((st) => (
                <StrokeView
                  key={st.id}
                  stroke={st}
                  selected={selectedStrokes.has(st.id)}
                />
              ))}
            </g>
          </g>
          {pointer.drawing.length > 1 && (
            <path
              className="no-hit"
              d={strokePath(pointer.drawing)}
              fill="none"
              stroke={settings.penColor}
              strokeWidth={settings.penWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          <Overlay
            boxes={boxes}
            marquee={pointer.marquee}
            ports={ports}
            hoverPort={pointer.hoverPoint}
            draft={wireDraft}
            draftPreview={pointer.preview}
            ghost={pointer.ghost}
            zoom={viewport.zoom}
          />
        </g>
      </svg>
      <FloatingToolbar />
      <ZoomIndicator viewSize={size} />
      <InlineEditor />
    </div>
  );
}
