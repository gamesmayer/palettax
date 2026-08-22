import { Input, Modal, TitleBar } from '@react95/core';
import { MouseEvent, useState } from 'react';
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

  function handleBackdropMouseDown(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return (
    <div className="dialog-backdrop" onMouseDown={handleBackdropMouseDown}>
      <Modal
        className="color-dialog"
        title={color ? 'Edit color' : 'Add color'}
        hasWindowButton={false}
        titleBarOptions={[<TitleBar.Close key="close" onClick={onClose} />]}
        buttons={[
          { value: 'Cancel', onClick: onClose },
          { value: color ? 'Save' : 'Add', onClick: handleSubmit }
        ]}
      >
        <Modal.Content>
          <div className="color-dialog__picker">
            <HexColorPicker color={hex} onChange={setHex} />
          </div>
          <Input
            type="text"
            value={hex}
            onChange={(event) => setHex(event.target.value)}
            aria-label="Hex code"
          />
          <Input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Name (optional)"
          />
        </Modal.Content>
      </Modal>
    </div>
  );
}
