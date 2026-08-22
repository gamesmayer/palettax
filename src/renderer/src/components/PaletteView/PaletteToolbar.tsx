import { Button, Frame } from '@react95/core';

interface PaletteToolbarProps {
  onAddColor: () => void;
}

export function PaletteToolbar({ onAddColor }: PaletteToolbarProps): JSX.Element {
  return (
    <Frame className="palette-toolbar">
      <Button onClick={onAddColor}>Add color</Button>
    </Frame>
  );
}
