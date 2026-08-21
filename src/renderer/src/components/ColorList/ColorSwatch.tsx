import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { KeyboardEvent, MouseEvent, useState } from 'react';
import { PaletteColor } from '../../../../shared/palette-formats';

interface ColorSwatchProps {
  color: PaletteColor;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onRename: (newName: string) => void;
  onEdit: () => void;
}

export function ColorSwatch({
  color,
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
    <div className="color-swatch" ref={setNodeRef} style={style}>
      <span className="color-swatch__drag-handle" {...attributes} {...listeners}>
        ⠿
      </span>
      <button
        className="color-swatch__chip"
        style={{ backgroundColor: color.hex }}
        onClick={(event) => {
          event.stopPropagation();
          onEdit();
        }}
        aria-label={`Editar color ${color.hex}`}
      />
      <span className="color-swatch__hex">{color.hex}</span>
      {isEditing ? (
        <input
          className="color-swatch__name-input"
          value={draft}
          autoFocus
          placeholder="Nombre (opcional)"
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <span className="color-swatch__label" onDoubleClick={startEditing}>
          {color.name ?? 'Sin nombre'}
        </span>
      )}
      <div className="color-swatch__actions">
        <button onClick={onMoveUp} disabled={!canMoveUp} aria-label="Subir color">
          ↑
        </button>
        <button onClick={onMoveDown} disabled={!canMoveDown} aria-label="Bajar color">
          ↓
        </button>
        <button onClick={onRemove} aria-label="Borrar color">
          ✕
        </button>
      </div>
    </div>
  );
}
