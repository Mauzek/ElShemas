import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignHorizontalSpaceAround,
  AlignStartHorizontal,
  AlignStartVertical,
  AlignVerticalSpaceAround,
} from 'lucide-react';
import { useDoc } from '../store/useDoc';
import type { AlignMode, DistributeMode } from '../lib/mutations';

interface Props {
  ids: string[];
}

const ALIGNS: { mode: AlignMode; icon: typeof AlignStartVertical; title: string }[] = [
  { mode: 'left', icon: AlignStartVertical, title: 'По левому краю' },
  { mode: 'hcenter', icon: AlignCenterVertical, title: 'По центру по горизонтали' },
  { mode: 'right', icon: AlignEndVertical, title: 'По правому краю' },
  { mode: 'top', icon: AlignStartHorizontal, title: 'По верхнему краю' },
  { mode: 'vcenter', icon: AlignCenterHorizontal, title: 'По центру по вертикали' },
  { mode: 'bottom', icon: AlignEndHorizontal, title: 'По нижнему краю' },
];

const DISTRIBUTE: { mode: DistributeMode; icon: typeof AlignStartVertical; title: string }[] = [
  { mode: 'horizontal', icon: AlignHorizontalSpaceAround, title: 'Распределить по горизонтали' },
  { mode: 'vertical', icon: AlignVerticalSpaceAround, title: 'Распределить по вертикали' },
];

/** Выравнивание и распределение выделенных элементов. */
export function AlignControls({ ids }: Props) {
  const align = useDoc((s) => s.align);
  const distribute = useDoc((s) => s.distribute);
  const canAlign = ids.length >= 2;
  const canDistribute = ids.length >= 3;

  return (
    <div className="flex flex-wrap gap-1">
      {ALIGNS.map(({ mode, icon: Icon, title }) => (
        <button
          key={mode}
          className="tbtn"
          disabled={!canAlign}
          onClick={() => align(ids, mode)}
          data-tip={title}
          aria-label={title}
        >
          <Icon size={16} />
        </button>
      ))}
      {DISTRIBUTE.map(({ mode, icon: Icon, title }) => (
        <button
          key={mode}
          className="tbtn"
          disabled={!canDistribute}
          onClick={() => distribute(ids, mode)}
          data-tip={title}
          aria-label={title}
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  );
}
