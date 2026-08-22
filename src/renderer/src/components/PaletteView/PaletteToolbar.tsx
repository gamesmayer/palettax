import { Button, Dropdown, Frame } from '@react95/core';
import { ChangeEvent } from 'react';
import { ColorSystem } from '../../../../shared/color';

interface PaletteToolbarProps {
  colorSystem: ColorSystem;
  onColorSystemChange: (system: ColorSystem) => void;
  onAddColor: () => void;
  onAddBlend: () => void;
  onAddShadeTint: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const COLOR_SYSTEM_LABELS: Record<ColorSystem, string> = {
  hex: 'Hex',
  rgb: 'RGB',
  hsl: 'HSL',
  hsb: 'HSB',
  cmyk: 'CMYK'
};

const COLOR_SYSTEM_BY_LABEL: Record<string, ColorSystem> = {
  Hex: 'hex',
  RGB: 'rgb',
  HSL: 'hsl',
  HSB: 'hsb',
  CMYK: 'cmyk'
};

function PlusIcon(): JSX.Element {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true">
      <rect x="7" y="2" width="2" height="12" fill="currentColor" />
      <rect x="2" y="7" width="12" height="2" fill="currentColor" />
    </svg>
  );
}

function UndoIcon(): JSX.Element {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true">
      <path fill="currentColor" d="M2 8l4-3v2h4v2h-4v2z" />
    </svg>
  );
}

function RedoIcon(): JSX.Element {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true">
      <path fill="currentColor" d="M14 8l-4-3v2h-4v2h4v2z" />
    </svg>
  );
}

export function PaletteToolbar({
  colorSystem,
  onColorSystemChange,
  onAddColor,
  onAddBlend,
  onAddShadeTint,
  onUndo,
  onRedo,
  canUndo,
  canRedo
}: PaletteToolbarProps): JSX.Element {
  return (
    <Frame className="palette-toolbar">
      <div className="palette-toolbar__left">
        <Button className="palette-toolbar__icon-btn" onClick={onUndo} disabled={!canUndo} aria-label="Undo">
          <UndoIcon />
        </Button>
        <Button className="palette-toolbar__icon-btn" onClick={onRedo} disabled={!canRedo} aria-label="Redo">
          <RedoIcon />
        </Button>
      </div>
      <div className="palette-toolbar__center">
        <Dropdown
          className="palette-toolbar__color-system"
          options={Object.values(COLOR_SYSTEM_LABELS)}
          value={COLOR_SYSTEM_LABELS[colorSystem]}
          onChange={(event: ChangeEvent<HTMLSelectElement>) =>
            onColorSystemChange(COLOR_SYSTEM_BY_LABEL[event.target.value])
          }
          aria-label="Color system"
        />
      </div>
      <div className="palette-toolbar__right">
        <Button className="palette-toolbar__icon-btn" onClick={onAddColor} aria-label="Add color">
          <PlusIcon />
        </Button>
        <Button onClick={onAddBlend}>Blending</Button>
        <Button onClick={onAddShadeTint}>Shades/Tints</Button>
      </div>
    </Frame>
  );
}
