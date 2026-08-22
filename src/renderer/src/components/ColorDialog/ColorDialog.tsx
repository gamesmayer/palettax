import { Input, Modal, TitleBar } from '@react95/core';
import { MouseEvent, useState } from 'react';
import { HexColorPicker, HslColorPicker, HsvColorPicker, RgbColorPicker } from 'react-colorful';
import {
  ColorSystem,
  clampByte,
  cmykToRgb,
  hexToRgb,
  hslToRgb,
  hsvToRgb,
  rgbToCmyk,
  rgbToHex,
  rgbToHsl,
  rgbToHsv
} from '../../../../shared/color';
import { PaletteColor } from '../../../../shared/palette-formats';
import { usePaletteStore } from '../../store/paletteStore';

interface ColorDialogProps {
  paletteId: string;
  color?: PaletteColor;
  colorSystem: ColorSystem;
  onClose: () => void;
}

export function ColorDialog({ paletteId, color, colorSystem, onClose }: ColorDialogProps): JSX.Element {
  const addColor = usePaletteStore((state) => state.addColor);
  const updateColor = usePaletteStore((state) => state.updateColor);
  const [rgb, setRgb] = useState({ r: color?.r ?? 255, g: color?.g ?? 255, b: color?.b ?? 255 });
  const [name, setName] = useState(color?.name ?? '');

  const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
  const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);

  function handleSubmit(): void {
    const changes = { r: rgb.r, g: rgb.g, b: rgb.b, hex, name: name.trim() ? name.trim() : undefined };
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
            {colorSystem === 'hex' && (
              <HexColorPicker color={hex} onChange={(value) => setRgb(hexToRgb(value))} />
            )}
            {colorSystem === 'rgb' && (
              <RgbColorPicker
                color={rgb}
                onChange={(value) =>
                  setRgb({ r: clampByte(value.r), g: clampByte(value.g), b: clampByte(value.b) })
                }
              />
            )}
            {colorSystem === 'hsl' && (
              <HslColorPicker color={hsl} onChange={(value) => setRgb(hslToRgb(value.h, value.s, value.l))} />
            )}
            {colorSystem === 'hsb' && (
              <HsvColorPicker color={hsv} onChange={(value) => setRgb(hsvToRgb(value.h, value.s, value.v))} />
            )}
            {colorSystem === 'cmyk' && <div className="color-dialog__cmyk-preview" style={{ backgroundColor: hex }} />}
          </div>

          {colorSystem === 'hex' && (
            <div className="color-dialog__field">
              <span className="color-dialog__field-label">Hex</span>
              <Input
                type="text"
                value={hex}
                onChange={(event) => setRgb(hexToRgb(event.target.value))}
                aria-label="Hex code"
              />
            </div>
          )}
          {colorSystem === 'rgb' && (
            <div className="color-dialog__channels">
              <div className="color-dialog__field">
                <span className="color-dialog__field-label">R</span>
                <Input
                  type="number"
                  min={0}
                  max={255}
                  value={rgb.r}
                  onChange={(event) => setRgb({ ...rgb, r: clampByte(Number(event.target.value)) })}
                  aria-label="Red"
                />
              </div>
              <div className="color-dialog__field">
                <span className="color-dialog__field-label">G</span>
                <Input
                  type="number"
                  min={0}
                  max={255}
                  value={rgb.g}
                  onChange={(event) => setRgb({ ...rgb, g: clampByte(Number(event.target.value)) })}
                  aria-label="Green"
                />
              </div>
              <div className="color-dialog__field">
                <span className="color-dialog__field-label">B</span>
                <Input
                  type="number"
                  min={0}
                  max={255}
                  value={rgb.b}
                  onChange={(event) => setRgb({ ...rgb, b: clampByte(Number(event.target.value)) })}
                  aria-label="Blue"
                />
              </div>
            </div>
          )}
          {colorSystem === 'hsl' && (
            <div className="color-dialog__channels">
              <div className="color-dialog__field">
                <span className="color-dialog__field-label">H</span>
                <Input
                  type="number"
                  min={0}
                  max={360}
                  value={hsl.h}
                  onChange={(event) => setRgb(hslToRgb(Number(event.target.value), hsl.s, hsl.l))}
                  aria-label="Hue"
                />
              </div>
              <div className="color-dialog__field">
                <span className="color-dialog__field-label">S</span>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={hsl.s}
                  onChange={(event) => setRgb(hslToRgb(hsl.h, Number(event.target.value), hsl.l))}
                  aria-label="Saturation"
                />
              </div>
              <div className="color-dialog__field">
                <span className="color-dialog__field-label">L</span>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={hsl.l}
                  onChange={(event) => setRgb(hslToRgb(hsl.h, hsl.s, Number(event.target.value)))}
                  aria-label="Lightness"
                />
              </div>
            </div>
          )}
          {colorSystem === 'hsb' && (
            <div className="color-dialog__channels">
              <div className="color-dialog__field">
                <span className="color-dialog__field-label">H</span>
                <Input
                  type="number"
                  min={0}
                  max={360}
                  value={hsv.h}
                  onChange={(event) => setRgb(hsvToRgb(Number(event.target.value), hsv.s, hsv.v))}
                  aria-label="Hue"
                />
              </div>
              <div className="color-dialog__field">
                <span className="color-dialog__field-label">S</span>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={hsv.s}
                  onChange={(event) => setRgb(hsvToRgb(hsv.h, Number(event.target.value), hsv.v))}
                  aria-label="Saturation"
                />
              </div>
              <div className="color-dialog__field">
                <span className="color-dialog__field-label">B</span>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={hsv.v}
                  onChange={(event) => setRgb(hsvToRgb(hsv.h, hsv.s, Number(event.target.value)))}
                  aria-label="Brightness"
                />
              </div>
            </div>
          )}
          {colorSystem === 'cmyk' && (
            <div className="color-dialog__channels">
              <div className="color-dialog__field">
                <span className="color-dialog__field-label">C</span>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={cmyk.c}
                  onChange={(event) => setRgb(cmykToRgb(Number(event.target.value), cmyk.m, cmyk.y, cmyk.k))}
                  aria-label="Cyan"
                />
              </div>
              <div className="color-dialog__field">
                <span className="color-dialog__field-label">M</span>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={cmyk.m}
                  onChange={(event) => setRgb(cmykToRgb(cmyk.c, Number(event.target.value), cmyk.y, cmyk.k))}
                  aria-label="Magenta"
                />
              </div>
              <div className="color-dialog__field">
                <span className="color-dialog__field-label">Y</span>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={cmyk.y}
                  onChange={(event) => setRgb(cmykToRgb(cmyk.c, cmyk.m, Number(event.target.value), cmyk.k))}
                  aria-label="Yellow"
                />
              </div>
              <div className="color-dialog__field">
                <span className="color-dialog__field-label">K</span>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={cmyk.k}
                  onChange={(event) => setRgb(cmykToRgb(cmyk.c, cmyk.m, cmyk.y, Number(event.target.value)))}
                  aria-label="Key (black)"
                />
              </div>
            </div>
          )}

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
