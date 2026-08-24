import {
	DndContext,
	DragEndEvent,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	SortableContext,
	arrayMove,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ColorSystem } from "../../../../shared/color";
import { Palette } from "../../../../shared/palette-formats";
import { usePaletteStore } from "../../store/paletteStore";
import { GroupSection, headerSortableId } from "./GroupSection";

interface DragItemData {
	type: "color" | "group" | "groupHeader";
	groupId: string;
}

interface PaletteGroupsProps {
	palette: Palette;
	colorSystem: ColorSystem;
}

export function PaletteGroups({
	palette,
	colorSystem,
}: PaletteGroupsProps): JSX.Element {
	const reorderColors = usePaletteStore((state) => state.reorderColors);
	const moveColor = usePaletteStore((state) => state.moveColor);
	const reorderGroups = usePaletteStore((state) => state.reorderGroups);
	const sensors = useSensors(useSensor(PointerSensor));

	const groupIds = palette.groups.map((group) => group.id);
	const headerIds = groupIds.map(headerSortableId);

	function handleDragEnd(event: DragEndEvent): void {
		const { active, over } = event;
		if (!over) return;

		const activeData = active.data.current as DragItemData | undefined;
		if (!activeData) return;

		if (activeData.type === "groupHeader") {
			if (active.id === over.id) return;
			const oldIndex = headerIds.indexOf(String(active.id));
			const newIndex = headerIds.indexOf(String(over.id));
			if (oldIndex === -1 || newIndex === -1) return;
			reorderGroups(palette.id, arrayMove(groupIds, oldIndex, newIndex));
			return;
		}

		if (activeData.type !== "color") return;

		const colorId = String(active.id);
		const fromGroupId = activeData.groupId;
		const fromGroup = palette.groups.find((group) => group.id === fromGroupId);
		if (!fromGroup) return;

		const overData = over.data.current as DragItemData | undefined;
		let toGroupId: string;
		let targetIndex: number;

		if (overData?.type === "color") {
			toGroupId = overData.groupId;
			const toGroup = palette.groups.find((group) => group.id === toGroupId);
			if (!toGroup) return;
			const overIndex = toGroup.colors.findIndex(
				(color) => color.id === over.id
			);
			targetIndex = overIndex === -1 ? toGroup.colors.length : overIndex;
		} else if (overData?.type === "group") {
			toGroupId = overData.groupId;
			const toGroup = palette.groups.find((group) => group.id === toGroupId);
			if (!toGroup) return;
			targetIndex = toGroup.colors.length;
		} else {
			return;
		}

		if (fromGroupId === toGroupId) {
			if (active.id === over.id) return;
			const colorIds = fromGroup.colors.map((color) => color.id);
			const oldIndex = colorIds.indexOf(colorId);
			if (oldIndex === -1) return;
			reorderColors(
				palette.id,
				fromGroupId,
				arrayMove(colorIds, oldIndex, targetIndex)
			);
		} else {
			moveColor(palette.id, colorId, fromGroupId, toGroupId, targetIndex);
		}
	}

	return (
		<DndContext sensors={sensors} onDragEnd={handleDragEnd}>
			<SortableContext items={headerIds} strategy={verticalListSortingStrategy}>
				<div className="palette-groups">
					{palette.groups.map((group) => (
						<GroupSection
							key={group.id}
							palette={palette}
							group={group}
							colorSystem={colorSystem}
						/>
					))}
				</div>
			</SortableContext>
		</DndContext>
	);
}
