import { Button, Frame, Input } from '@react95/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { KeyboardEvent, MouseEvent, useState } from 'react';
import { ColorSystem, rgbToHsl, rgbToHsv } from '../../../../shared/color';
import { PaletteColor } from '../../../../shared/palette-formats';

interface ColorSwatchProps {
  color: PaletteColor;
  colorSystem: ColorSystem;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onRename: (newName: string) => void;
  onEdit: () => void;
}

function formatColorValue(color: PaletteColor, system: ColorSystem): string {
  switch (system) {
    case 'hex':
      return color.hex;
    case 'rgb':
      return `RGB(${color.r}, ${color.g}, ${color.b})`;
    case 'hsl': {
      const { h, s, l } = rgbToHsl(color.r, color.g, color.b);
      return `HSL(${h}, ${s}%, ${l}%)`;
    }
    case 'hsb': {
      const { h, s, v } = rgbToHsv(color.r, color.g, color.b);
      return `HSB(${h}, ${s}%, ${v}%)`;
    }
  }
}

export function ColorSwatch({
  color,
  colorSystem,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onRemove,
  onRename,
  onEdit
}: ColorSwatchProps): JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: color.id });
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(color.name ?? '');

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  function startEditing(event: MouseEvent): void {
    event.stopPropagation();
    setDraft(color.name ?? '');
    setIsEditing(true);
  }

  function commit(): void {
    onRename(draft);
    setIsEditing(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'Enter') {
      commit();
    } else if (event.key === 'Escape') {
      setDraft(color.name ?? '');
      setIsEditing(false);
    }
  }

  return (
    <Frame className="color-swatch" ref={setNodeRef} style={style}>
      <span className="color-swatch__drag-handle" {...attributes} {...listeners}>
        ⠿
      </span>
      <Frame
        as="button"
        className="color-swatch__chip"
        style={{ backgroundColor: color.hex }}
        onClick={(event) => {
          event.stopPropagation();
          onEdit();
        }}
        aria-label={`Edit color ${color.hex}`}
      />
      <span className="color-swatch__value">{formatColorValue(color, colorSystem)}</span>
      {isEditing ? (
        <Input
          className="color-swatch__name-input"
          value={draft}
          autoFocus
          placeholder="Name (optional)"
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <span className="color-swatch__label" onDoubleClick={startEditing}>
          {color.name ?? 'Unnamed'}
        </span>
      )}
      <Frame className="color-swatch__actions">
        <Button className="color-swatch__icon-btn" onClick={onMoveUp} disabled={!canMoveUp} aria-label="Move color up">
          ↑
        </Button>
        <Button className="color-swatch__icon-btn" onClick={onMoveDown} disabled={!canMoveDown} aria-label="Move color down">
          ↓
        </Button>
        <Button className="color-swatch__icon-btn" onClick={onRemove} aria-label="Remove color">
          ✕
        </Button>
      </Frame>
    </Frame>
  );
}
