import { Button, Dropdown, Frame } from '@react95/core';
import { ColorSystem } from '../../../../shared/color';

interface PaletteToolbarProps {
  colorSystem: ColorSystem;
  onColorSystemChange: (system: ColorSystem) => void;
  onAddColor: () => void;
}

const COLOR_SYSTEM_LABELS: Record<ColorSystem, string> = {
  hex: 'Hex',
  rgb: 'RGB',
  hsl: 'HSL',
  hsb: 'HSB'
};

const COLOR_SYSTEM_BY_LABEL: Record<string, ColorSystem> = {
  Hex: 'hex',
  RGB: 'rgb',
  HSL: 'hsl',
  HSB: 'hsb'
};

export function PaletteToolbar({ colorSystem, onColorSystemChange, onAddColor }: PaletteToolbarProps): JSX.Element {
  return (
    <Frame className="palette-toolbar">
      <Button onClick={onAddColor}>Add color</Button>
      <Dropdown
        className="palette-toolbar__color-system"
        options={Object.values(COLOR_SYSTEM_LABELS)}
        value={COLOR_SYSTEM_LABELS[colorSystem]}
        onChange={(event) => onColorSystemChange(COLOR_SYSTEM_BY_LABEL[event.target.value])}
        aria-label="Color system"
      />
    </Frame>
  );
}
