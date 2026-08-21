import { useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { hexToRgb } from '../../../../shared/color';
import { PaletteColor } from '../../../../shared/palette-formats';
import { usePaletteStore } from '../../store/paletteStore';

interface ColorDialogProps {
  paletteId: string;
  color?: PaletteColor;
  onClose: () => void;
}

export function ColorDialog({ paletteId, color, onClose }: ColorDialogProps): JSX.Element {
  const addColor = usePaletteStore((state) => state.addColor);
  const updateColor = usePaletteStore((state) => state.updateColor);
  const [hex, setHex] = useState(color?.hex ?? '#FFFFFF');
  const [name, setName] = useState(color?.name ?? '');

  function handleSubmit(): void {
    const { r, g, b } = hexToRgb(hex);
    const changes = { r, g, b, hex: hex.toUpperCase(), name: name.trim() ? name.trim() : undefined };
    if (color) {
      updateColor(paletteId, color.id, changes);
    } else {
      addColor(paletteId, changes);
    }
    onClose();
  }

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={(event) => event.stopPropagation()}>
        <h3>{color ? 'Editar color' : 'Añadir color'}</h3>
        <HexColorPicker color={hex} onChange={setHex} />
        <input
          type="text"
          value={hex}
          onChange={(event) => setHex(event.target.value)}
          aria-label="Código hexadecimal"
        />
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nombre (opcional)"
        />
        <div className="dialog__actions">
          <button onClick={onClose}>Cancelar</button>
          <button onClick={handleSubmit}>{color ? 'Guardar' : 'Añadir'}</button>
        </div>
      </div>
    </div>
  );
}
