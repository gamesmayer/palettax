import { Button, Frame, Input, Modal, TitleBar } from '@react95/core';
import { MouseEvent, useState } from 'react';
import { ColorSystem, blendRgb, rgbToHex } from '../../../../shared/color';
import { PaletteColor } from '../../../../shared/palette-formats';
import { usePaletteStore } from '../../store/paletteStore';
import { ColorSystemFields } from '../ColorPicker/ColorSystemFields';

interface BlendDialogProps {
  paletteId: string;
  colors: PaletteColor[];
  colorSystem: ColorSystem;
  onClose: () => void;
}

type EndpointMode = 'palette' | 'new';
type Rgb = { r: number; g: number; b: number };

const MIN_STEPS = 3;
const MAX_STEPS = 50;

function clampSteps(value: number): number {
  return Math.min(MAX_STEPS, Math.max(MIN_STEPS, Math.round(value)));
}

interface EndpointPickerProps {
  label: string;
  mode: EndpointMode;
  onModeChange: (mode: EndpointMode) => void;
  colors: PaletteColor[];
  colorSystem: ColorSystem;
  paletteColorId: string;
  onPaletteColorChange: (colorId: string) => void;
  customRgb: Rgb;
  onCustomRgbChange: (rgb: Rgb) => void;
}

function EndpointPicker({
  label,
  mode,
  onModeChange,
  colors,
  colorSystem,
  paletteColorId,
  onPaletteColorChange,
  customRgb,
  onCustomRgbChange
}: EndpointPickerProps): JSX.Element {
  return (
    <div className="blend-dialog__field">
      <span className="blend-dialog__field-label">{label}</span>
      <div className="blend-dialog__mode-toggle">
        <Button
          className={mode === 'palette' ? 'blend-dialog__mode-btn blend-dialog__mode-btn--active' : 'blend-dialog__mode-btn'}
          disabled={colors.length === 0}
          onClick={() => onModeChange('palette')}
        >
          Palette color
        </Button>
        <Button
          className={mode === 'new' ? 'blend-dialog__mode-btn blend-dialog__mode-btn--active' : 'blend-dialog__mode-btn'}
          onClick={() => onModeChange('new')}
        >
          New color
        </Button>
      </div>
      {mode === 'palette' ? (
        <div className="blend-dialog__swatch-picker">
          {colors.map((color) => (
            <Frame
              key={color.id}
              as="button"
              className={
                color.id === paletteColorId ? 'blend-dialog__chip blend-dialog__chip--selected' : 'blend-dialog__chip'
              }
              style={{ backgroundColor: color.hex }}
              onClick={() => onPaletteColorChange(color.id)}
              aria-label={`${label}: ${color.hex}`}
            />
          ))}
        </div>
      ) : (
        <ColorSystemFields colorSystem={colorSystem} rgb={customRgb} onChange={onCustomRgbChange} />
      )}
    </div>
  );
}

export function BlendDialog({ paletteId, colors, colorSystem, onClose }: BlendDialogProps): JSX.Element {
  const addColors = usePaletteStore((state) => state.addColors);

  const [fromMode, setFromMode] = useState<EndpointMode>(colors.length > 0 ? 'palette' : 'new');
  const [fromPaletteColorId, setFromPaletteColorId] = useState(colors[0]?.id ?? '');
  const [fromCustomRgb, setFromCustomRgb] = useState<Rgb>(colors[0] ?? { r: 0, g: 0, b: 0 });

  const [toMode, setToMode] = useState<EndpointMode>(colors.length > 0 ? 'palette' : 'new');
  const [toPaletteColorId, setToPaletteColorId] = useState(colors[1]?.id ?? colors[0]?.id ?? '');
  const [toCustomRgb, setToCustomRgb] = useState<Rgb>(colors[1] ?? colors[0] ?? { r: 255, g: 255, b: 255 });

  const [steps, setSteps] = useState(5);

  function resolveRgb(mode: EndpointMode, paletteColorId: string, customRgb: Rgb): Rgb {
    if (mode === 'palette') {
      return colors.find((color) => color.id === paletteColorId) ?? customRgb;
    }
    return customRgb;
  }

  const fromRgb = resolveRgb(fromMode, fromPaletteColorId, fromCustomRgb);
  const toRgb = resolveRgb(toMode, toPaletteColorId, toCustomRgb);
  const preview = blendRgb(fromRgb, toRgb, steps);

  const newColorCount = preview.length - (fromMode === 'palette' ? 1 : 0) - (toMode === 'palette' ? 1 : 0);

  function handleSubmit(): void {
    const middleSteps = preview.slice(1, -1);
    const toAdd = [
      ...(fromMode === 'new' ? [preview[0]] : []),
      ...middleSteps,
      ...(toMode === 'new' ? [preview[preview.length - 1]] : [])
    ].map(({ r, g, b }) => ({ r, g, b, hex: rgbToHex(r, g, b) }));
    addColors(paletteId, toAdd);
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
        className="blend-dialog"
        title="Add blending"
        hasWindowButton={false}
        titleBarOptions={[<TitleBar.Close key="close" onClick={onClose} />]}
        buttons={[
          { value: 'Cancel', onClick: onClose },
          { value: 'Add', onClick: handleSubmit }
        ]}
      >
        <Modal.Content>
          <div className="blend-dialog__endpoints">
            <EndpointPicker
              label="From"
              mode={fromMode}
              onModeChange={setFromMode}
              colors={colors}
              colorSystem={colorSystem}
              paletteColorId={fromPaletteColorId}
              onPaletteColorChange={setFromPaletteColorId}
              customRgb={fromCustomRgb}
              onCustomRgbChange={setFromCustomRgb}
            />

            <EndpointPicker
              label="To"
              mode={toMode}
              onModeChange={setToMode}
              colors={colors}
              colorSystem={colorSystem}
              paletteColorId={toPaletteColorId}
              onPaletteColorChange={setToPaletteColorId}
              customRgb={toCustomRgb}
              onCustomRgbChange={setToCustomRgb}
            />
          </div>

          <div className="blend-dialog__field">
            <span className="blend-dialog__field-label">Steps</span>
            <Input
              type="number"
              min={MIN_STEPS}
              max={MAX_STEPS}
              value={steps}
              onChange={(event) => setSteps(clampSteps(Number(event.target.value)))}
              aria-label="Number of steps"
            />
          </div>

          <div className="blend-dialog__field">
            <span className="blend-dialog__field-label">Preview ({newColorCount} new color{newColorCount === 1 ? '' : 's'})</span>
            <div className="blend-dialog__preview">
              {preview.map(({ r, g, b }, index) => (
                <div
                  key={index}
                  className="blend-dialog__preview-swatch"
                  style={{ backgroundColor: rgbToHex(r, g, b) }}
                  title={rgbToHex(r, g, b)}
                />
              ))}
            </div>
          </div>
        </Modal.Content>
      </Modal>
    </div>
  );
}
