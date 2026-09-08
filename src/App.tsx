import { useEffect, useState } from 'react';
import { TopLeftBar, TopRightBar } from './components/TopBar';
import { Palette } from './components/Palette';
import { Inspector } from './components/Inspector';
import { StatusBar } from './components/StatusBar';
import { Canvas } from './components/canvas/Canvas';
import { Toast } from './components/Toast';
import { Tooltips } from './components/Tooltips';
import { ExportDialog } from './components/dialogs/ExportDialog';
import { SchemaManager } from './components/dialogs/SchemaManager';
import { BomDialog } from './components/dialogs/BomDialog';
import { CheckDialog } from './components/dialogs/CheckDialog';
import { ShortcutsDialog } from './components/dialogs/ShortcutsDialog';
import { ImportDialog } from './components/dialogs/ImportDialog';
import { SaveDialog } from './components/dialogs/SaveDialog';
import { ConfirmDialog } from './components/dialogs/ConfirmDialog';
import { useUi } from './store/useUi';
import { useKeyboard } from './hooks/useKeyboard';
import { usePersistence, useTheme } from './hooks/usePersistence';

const PALETTE_WIDTH = { open: 232, collapsed: 76 };
const INSPECTOR_WIDTH = 252;

export default function App() {
  const [paletteCollapsed, setPaletteCollapsed] = useState(false);
  const dialog = useUi((s) => s.dialog);
  const setViewInsets = useUi((s) => s.setViewInsets);

  useKeyboard();
  usePersistence();
  useTheme();

  // Панели плавают над полотном — сообщаем «вписать в экран», сколько места занято.
  useEffect(() => {
    setViewInsets({
      left: (paletteCollapsed ? PALETTE_WIDTH.collapsed : PALETTE_WIDTH.open) + 24,
      right: INSPECTOR_WIDTH + 24,
      top: 76,
      bottom: 76,
    });
  }, [paletteCollapsed, setViewInsets]);

  return (
    <div className="app-shell">
      <Canvas />
      <TopLeftBar />
      <TopRightBar />
      <Palette collapsed={paletteCollapsed} onToggleCollapsed={() => setPaletteCollapsed((v) => !v)} />
      <Inspector />
      <StatusBar />
      <Toast />
      <Tooltips />
      {dialog === 'export' && <ExportDialog />}
      {dialog === 'manager' && <SchemaManager />}
      {dialog === 'bom' && <BomDialog />}
      {dialog === 'check' && <CheckDialog />}
      {dialog === 'shortcuts' && <ShortcutsDialog />}
      {dialog === 'import' && <ImportDialog />}
      {dialog === 'save' && <SaveDialog />}
      <ConfirmDialog />
    </div>
  );
}
