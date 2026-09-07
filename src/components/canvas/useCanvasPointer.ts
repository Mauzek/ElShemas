import { useCallback, useRef, useState } from 'react';
import type { DragEvent, MouseEvent, PointerEvent, RefObject, WheelEvent } from 'react';
import type { Element, Point, Rect } from '../../types/schema';
import { useDoc } from '../../store/useDoc';
import { useUi, type Selection } from '../../store/useUi';
import { screenToWorld, zoomAt } from '../../lib/viewport';
import {
  applyDrag,
  applyLabelDrag,
  applySegmentDrag,
  createLabelAt,
  finishWire,
  ghostElement,
  handleDrop,
  placeElementAt,
  segmentTo,
  selectInMarquee,
  wireClick,
  wireTarget,
  type Interaction,
} from './pointerActions';

export interface CanvasPointer {
  marquee: Rect | null;
  preview: Point[];
  ghost: Element | null;
  hoverPoint: Point | null;
  onPointerDown: (e: PointerEvent<SVGSVGElement>) => void;
  onPointerMove: (e: PointerEvent<SVGSVGElement>) => void;
  onPointerUp: (e: PointerEvent<SVGSVGElement>) => void;
  onWheel: (e: WheelEvent<SVGSVGElement>) => void;
  onDoubleClick: (e: MouseEvent<SVGSVGElement>) => void;
  onContextMenu: (e: MouseEvent<SVGSVGElement>) => void;
  onDragOver: (e: DragEvent<SVGSVGElement>) => void;
  onDrop: (e: DragEvent<SVGSVGElement>) => void;
}

/** Вся работа с указателем на полотне: выделение, перенос, провода, размещение. */
export function useCanvasPointer(svgRef: RefObject<SVGSVGElement>): CanvasPointer {
  const interaction = useRef<Interaction>({ mode: 'none' });
  const [marquee, setMarquee] = useState<Rect | null>(null);
  const [preview, setPreview] = useState<Point[]>([]);
  const [ghost, setGhost] = useState<Element | null>(null);
  const [hoverPoint, setHoverPoint] = useState<Point | null>(null);

  const toWorld = useCallback(
    (clientX: number, clientY: number): Point => {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return screenToWorld(useUi.getState().viewport, clientX, clientY, rect);
    },
    [svgRef],
  );

  const onPointerDown = useCallback(
    (e: PointerEvent<SVGSVGElement>) => {
      const ui = useUi.getState();
      const doc = useDoc.getState();
      const world = toWorld(e.clientX, e.clientY);
      e.currentTarget.setPointerCapture(e.pointerId);

      if (e.button === 1 || (e.button === 0 && (ui.spacePan || ui.tool === 'hand'))) {
        interaction.current = {
          mode: 'pan',
          startX: e.clientX,
          startY: e.clientY,
          vx: ui.viewport.x,
          vy: ui.viewport.y,
        };
        e.preventDefault();
        return;
      }
      if (e.button !== 0) return;

      if (ui.placingType) {
        placeElementAt(world);
        return;
      }
      if (ui.tool === 'wire') {
        wireClick(world, e.shiftKey);
        setPreview([]);
        return;
      }
      if (ui.tool === 'text') {
        // Без preventDefault браузер уводит фокус на body сразу после того,
        // как инлайновый редактор его забрал.
        e.preventDefault();
        createLabelAt(world);
        return;
      }

      const target = (e.target as SVGElement).closest('[data-kind]') as SVGElement | null;
      const kind = target?.getAttribute('data-kind') ?? null;
      const id = target?.getAttribute('data-id') ?? null;

      if (!target || !kind || !id) {
        if (!e.shiftKey) ui.clearSelection();
        interaction.current = { mode: 'marquee', start: world, additive: e.shiftKey };
        setMarquee({ x: world.x, y: world.y, w: 0, h: 0 });
        return;
      }

      const bucket: keyof Selection = kind === 'wire' ? 'wires' : kind === 'label' ? 'labels' : 'elements';

      if (e.shiftKey) {
        ui.toggleSelection(bucket, id);
        return;
      }

      if (target.getAttribute('data-role') === 'label' && bucket === 'elements') {
        const el = doc.doc.elements.find((x) => x.id === id);
        if (el) {
          ui.setSelection({ elements: [id] });
          doc.beginTx();
          interaction.current = {
            mode: 'label',
            elementId: id,
            start: world,
            base: el.labelOffset ?? { x: 0, y: 0 },
          };
          return;
        }
      }

      if (!ui.isSelected(bucket, id)) ui.setSelection({ [bucket]: [id] });

      const sel = useUi.getState().selection;
      // Номер сегмента лежит на самой линии-цели, а не на группе провода.
      const segAttr = (e.target as SVGElement).closest('[data-seg]')?.getAttribute('data-seg') ?? null;
      const onlyThisWire =
        bucket === 'wires' && sel.wires.length === 1 && sel.elements.length === 0 && sel.labels.length === 0;

      doc.beginTx();
      interaction.current =
        onlyThisWire && segAttr !== null
          ? { mode: 'segment', wireId: id, index: Number(segAttr), start: world }
          : { mode: 'drag', start: world };
    },
    [toWorld],
  );

  const onPointerMove = useCallback(
    (e: PointerEvent<SVGSVGElement>) => {
      const ui = useUi.getState();
      const world = toWorld(e.clientX, e.clientY);
      ui.setCursor(world);

      if (ui.placingType) setGhost(ghostElement(world));
      else if (ghost) setGhost(null);

      if (ui.tool === 'wire') {
        const { point, port } = wireTarget(world);
        setHoverPoint(port ? point : null);
        const draft = ui.wireDraft;
        if (draft) {
          const last = draft.points[draft.points.length - 1];
          setPreview(segmentTo(last, point, Boolean(port), e.shiftKey));
        }
      } else if (hoverPoint) {
        setHoverPoint(null);
      }

      const it = interaction.current;
      switch (it.mode) {
        case 'pan':
          ui.setViewport({
            ...ui.viewport,
            x: it.vx + (e.clientX - it.startX),
            y: it.vy + (e.clientY - it.startY),
          });
          break;
        case 'marquee':
          setMarquee({
            x: Math.min(it.start.x, world.x),
            y: Math.min(it.start.y, world.y),
            w: Math.abs(world.x - it.start.x),
            h: Math.abs(world.y - it.start.y),
          });
          break;
        case 'drag':
          applyDrag(it.start, world);
          break;
        case 'segment':
          applySegmentDrag(it.wireId, it.index, it.start, world);
          break;
        case 'label':
          applyLabelDrag(it.elementId, it.base, it.start, world);
          break;
        default:
          break;
      }
    },
    [toWorld, ghost, hoverPoint],
  );

  const onPointerUp = useCallback(
    (e: PointerEvent<SVGSVGElement>) => {
      const it = interaction.current;
      if (it.mode === 'marquee') {
        if (marquee && (marquee.w > 2 || marquee.h > 2)) selectInMarquee(marquee, it.additive);
        setMarquee(null);
      } else if (it.mode === 'drag' || it.mode === 'segment' || it.mode === 'label') {
        useDoc.getState().endTx();
      }
      interaction.current = { mode: 'none' };
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* указатель уже отпущен */
      }
    },
    [marquee],
  );

  const onWheel = useCallback(
    (e: WheelEvent<SVGSVGElement>) => {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const ui = useUi.getState();
      const factor = Math.exp(-e.deltaY * 0.0015);
      ui.setViewport(zoomAt(ui.viewport, factor, e.clientX - rect.left, e.clientY - rect.top));
    },
    [svgRef],
  );

  const onDoubleClick = useCallback((e: MouseEvent<SVGSVGElement>) => {
    const ui = useUi.getState();
    if (ui.wireDraft) {
      finishWire(ui.wireDraft.points, null);
      setPreview([]);
      return;
    }
    const target = (e.target as SVGElement).closest('[data-kind]') as SVGElement | null;
    const kind = target?.getAttribute('data-kind');
    const id = target?.getAttribute('data-id');
    if (!kind || !id) return;
    if (kind === 'element') ui.setEditing({ kind: 'element', id, field: 'label' });
    if (kind === 'label') ui.setEditing({ kind: 'label', id });
  }, []);

  const onContextMenu = useCallback((e: MouseEvent<SVGSVGElement>) => {
    e.preventDefault();
    const ui = useUi.getState();
    if (ui.wireDraft) {
      ui.setWireDraft(null);
      setPreview([]);
    }
    if (ui.placingType) ui.cancelPlacing();
  }, []);

  const onDragOver = useCallback((e: DragEvent<SVGSVGElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDrop = useCallback(
    (e: DragEvent<SVGSVGElement>) => {
      e.preventDefault();
      handleDrop(
        e.dataTransfer.files?.[0],
        e.dataTransfer.getData('application/x-elshemas-symbol'),
        toWorld(e.clientX, e.clientY),
      );
    },
    [toWorld],
  );

  return {
    marquee,
    preview,
    ghost,
    hoverPoint,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onWheel,
    onDoubleClick,
    onContextMenu,
    onDragOver,
    onDrop,
  };
}
