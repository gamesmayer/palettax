interface PaletteToolbarProps {
  onAddColor: () => void;
}

export function PaletteToolbar({ onAddColor }: PaletteToolbarProps): JSX.Element {
  return (
    <div className="palette-toolbar">
      <button onClick={onAddColor}>Añadir color</button>
    </div>
  );
}
