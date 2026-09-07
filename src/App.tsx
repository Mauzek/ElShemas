import { useState } from 'react';
import { TopBar } from './components/TopBar';
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
import { useUi } from './store/useUi';
import { useKeyboard } from './hooks/useKeyboard';
import { usePersistence, useTheme } from './hooks/usePersistence';

export default function App() {
  const [paletteCollapsed, setPaletteCollapsed] = useState(false);
  const dialog = useUi((s) => s.dialog);

  useKeyboard();
  usePersistence();
  useTheme();

  return (
    <div className="app-shell">
      <TopBar />
      <div className="app-body">
        <Palette collapsed={paletteCollapsed} onToggleCollapsed={() => setPaletteCollapsed((v) => !v)} />
        <Canvas />
        <Inspector />
      </div>
      <StatusBar />
      <Toast />
      <Tooltips />
      {dialog === 'export' && <ExportDialog />}
      {dialog === 'manager' && <SchemaManager />}
      {dialog === 'bom' && <BomDialog />}
      {dialog === 'check' && <CheckDialog />}
      {dialog === 'shortcuts' && <ShortcutsDialog />}
      {dialog === 'import' && <ImportDialog />}
    </div>
  );
}
