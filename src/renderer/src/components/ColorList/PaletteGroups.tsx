import {
	DndContext,
	DragEndEvent,
	DragOverEvent,
	DragOverlay,
	DragStartEvent,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	SortableContext,
	arrayMove,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useState } from "react";
import { ColorSystem } from "../../../../shared/color";
import {
	Palette,
	PaletteColor,
	PaletteGroup,
} from "../../../../shared/palette-formats";
import { usePaletteStore } from "../../store/paletteStore";
import { GroupSection, headerSortableId } from "./GroupSection";

interface DragItemData {
	type: "color" | "group" | "groupHeader";
	groupId: string;
}

interface DragOrigin {
	colorId: string;
	fromGroupId: string;
}

interface ActiveColorDrag {
	colorId: string;
	fromGroupId: string;
	toGroupId: string;
	toIndex: number;
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
	const [dragOrigin, setDragOrigin] = useState<DragOrigin | null>(null);
	const [activeDrag, setActiveDrag] = useState<ActiveColorDrag | null>(null);
	const [activeColor, setActiveColor] = useState<PaletteColor | null>(null);

	const groupIds = palette.groups.map((group) => group.id);
	const headerIds = groupIds.map(headerSortableId);

	function buildDisplayGroups(): PaletteGroup[] {
		if (!activeDrag) return palette.groups;
		const { colorId, fromGroupId, toGroupId, toIndex } = activeDrag;
		const fromGroup = palette.groups.find((group) => group.id === fromGroupId);
		const color = fromGroup?.colors.find((c) => c.id === colorId);
		if (!color) return palette.groups;

		return palette.groups.map((group) => {
			if (group.id !== fromGroupId && group.id !== toGroupId) return group;
			const withoutActive = group.colors.filter((c) => c.id !== colorId);
			if (group.id !== toGroupId) return { ...group, colors: withoutActive };
			const insertAt = Math.min(toIndex, withoutActive.length);
			return {
				...group,
				colors: [
					...withoutActive.slice(0, insertAt),
					color,
					...withoutActive.slice(insertAt),
				],
			};
		});
	}

	function handleDragStart(event: DragStartEvent): void {
		const data = event.active.data.current as DragItemData | undefined;
		if (data?.type === "color") {
			const colorId = String(event.active.id);
			setDragOrigin({ colorId, fromGroupId: data.groupId });
			const group = palette.groups.find((g) => g.id === data.groupId);
			setActiveColor(group?.colors.find((c) => c.id === colorId) ?? null);
		} else {
			setDragOrigin(null);
			setActiveColor(null);
		}
	}

	function handleDragOver(event: DragOverEvent): void {
		const { active, over } = event;

		if (!dragOrigin || String(active.id) !== dragOrigin.colorId) {
			setActiveDrag(null);
			return;
		}

		const overData = over?.data.current as DragItemData | undefined;
		if (!overData || (overData.type !== "color" && overData.type !== "group")) {
			setActiveDrag(null);
			return;
		}

		const { colorId, fromGroupId } = dragOrigin;
		const toGroupId = overData.groupId;

		if (toGroupId === fromGroupId) {
			// Reordering within the same group is animated natively by
			// SortableContext; rebuilding the array here would fight that
			// animation and cause the other items to flash.
			setActiveDrag(null);
			return;
		}

		const toGroup = palette.groups.find((group) => group.id === toGroupId);
		if (!toGroup) {
			setActiveDrag(null);
			return;
		}

		const otherColors = toGroup.colors.filter((color) => color.id !== colorId);
		const toIndex =
			overData.type === "color"
				? (() => {
						const overIndex = otherColors.findIndex(
							(color) => color.id === over?.id
						);
						return overIndex === -1 ? otherColors.length : overIndex;
					})()
				: otherColors.length;

		setActiveDrag({ colorId, fromGroupId, toGroupId, toIndex });
	}

	function handleDragEnd(event: DragEndEvent): void {
		const origin = dragOrigin;
		setActiveDrag(null);
		setDragOrigin(null);
		setActiveColor(null);
		const { active, over } = event;
		if (!over) return;

		const activeData = active.data.current as DragItemData | undefined;
		if (activeData?.type === "groupHeader") {
			if (active.id === over.id) return;
			const oldIndex = headerIds.indexOf(String(active.id));
			const newIndex = headerIds.indexOf(String(over.id));
			if (oldIndex === -1 || newIndex === -1) return;
			reorderGroups(palette.id, arrayMove(groupIds, oldIndex, newIndex));
			return;
		}

		if (!origin || String(active.id) !== origin.colorId) return;

		const { colorId, fromGroupId } = origin;
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

	const displayGroups = buildDisplayGroups();

	return (
		<DndContext
			sensors={sensors}
			onDragStart={handleDragStart}
			onDragOver={handleDragOver}
			onDragEnd={handleDragEnd}
			onDragCancel={() => {
				setActiveDrag(null);
				setDragOrigin(null);
				setActiveColor(null);
			}}
		>
			<SortableContext items={headerIds} strategy={verticalListSortingStrategy}>
				<div className="palette-groups">
					{displayGroups.map((group) => (
						<GroupSection
							key={group.id}
							palette={palette}
							group={group}
							colorSystem={colorSystem}
						/>
					))}
				</div>
			</SortableContext>
			<DragOverlay>
				{activeColor ? (
					<div className="color-swatch color-swatch--overlay">
						<span
							className="color-swatch__drag-handle color-swatch__drag-handle--hidden"
							aria-hidden="true"
						>
							⠿
						</span>
						<div
							className="color-swatch__chip"
							style={{ backgroundColor: activeColor.hex }}
						/>
						<span className="color-swatch__label">
							{activeColor.name ?? activeColor.hex}
						</span>
					</div>
				) : null}
			</DragOverlay>
		</DndContext>
	);
}
