import { Frame } from '@react95/core';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { PaletteColor } from '../../../../shared/palette-formats';
import { usePaletteStore } from '../../store/paletteStore';
import { ColorSwatch } from './ColorSwatch';

interface ColorListProps {
  paletteId: string;
  colors: PaletteColor[];
  onEditColor: (color: PaletteColor) => void;
}

export function ColorList({ paletteId, colors, onEditColor }: ColorListProps): JSX.Element {
  const reorderColors = usePaletteStore((state) => state.reorderColors);
  const removeColor = usePaletteStore((state) => state.removeColor);
  const renameColor = usePaletteStore((state) => state.renameColor);
  const sensors = useSensors(useSensor(PointerSensor));

  const colorIds = colors.map((color) => color.id);

  function moveColor(colorId: string, direction: -1 | 1): void {
    const index = colorIds.indexOf(colorId);
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= colorIds.length) return;
    reorderColors(paletteId, arrayMove(colorIds, index, targetIndex));
  }

  function handleDragEnd(event: DragEndEvent): void {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = colorIds.indexOf(String(active.id));
    const newIndex = colorIds.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    reorderColors(paletteId, arrayMove(colorIds, oldIndex, newIndex));
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <Frame className="color-list">
        {colors.length === 0 ? (
          <p className="color-list__empty">This palette has no colors yet.</p>
        ) : (
          <SortableContext items={colorIds} strategy={verticalListSortingStrategy}>
            {colors.map((color, index) => (
              <ColorSwatch
                key={color.id}
                color={color}
                canMoveUp={index > 0}
                canMoveDown={index < colors.length - 1}
                onMoveUp={() => moveColor(color.id, -1)}
                onMoveDown={() => moveColor(color.id, 1)}
                onRemove={() => removeColor(paletteId, color.id)}
                onRename={(newName) => renameColor(paletteId, color.id, newName)}
                onEdit={() => onEditColor(color)}
              />
            ))}
          </SortableContext>
        )}
      </Frame>
    </DndContext>
  );
}
