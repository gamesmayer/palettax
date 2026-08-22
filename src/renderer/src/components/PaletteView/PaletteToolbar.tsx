import { Button, Dropdown, Frame } from '@react95/core';
import { ChangeEvent } from 'react';
import { ColorSystem } from '../../../../shared/color';

interface PaletteToolbarProps {
  colorSystem: ColorSystem;
  onColorSystemChange: (system: ColorSystem) => void;
  onAddColor: () => void;
  onAddBlend: () => void;
  onAddShadeTint: () => void;
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

export function PaletteToolbar({
  colorSystem,
  onColorSystemChange,
  onAddColor,
  onAddBlend,
  onAddShadeTint
}: PaletteToolbarProps): JSX.Element {
  return (
    <Frame className="palette-toolbar">
      <Dropdown
        className="palette-toolbar__color-system"
        options={Object.values(COLOR_SYSTEM_LABELS)}
        value={COLOR_SYSTEM_LABELS[colorSystem]}
        onChange={(event: ChangeEvent<HTMLSelectElement>) =>
          onColorSystemChange(COLOR_SYSTEM_BY_LABEL[event.target.value])
        }
        aria-label="Color system"
      />
      <Button onClick={onAddColor} aria-label="Add color">
        +
      </Button>
      <Button onClick={onAddBlend}>Blending</Button>
      <Button onClick={onAddShadeTint}>Shades/Tints</Button>
    </Frame>
  );
}
