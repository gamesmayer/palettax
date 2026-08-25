import { Dropdown } from "@react95/core";
import { ChangeEvent } from "react";
import { PaletteGroup } from "../../../../shared/palette-formats";

interface GroupPickerProps {
	groups: PaletteGroup[];
	value: string;
	onChange: (groupId: string) => void;
}

function buildLabels(groups: PaletteGroup[]): {
	idToLabel: Record<string, string>;
	labelToId: Record<string, string>;
} {
	const counts = new Map<string, number>();
	const idToLabel: Record<string, string> = {};
	const labelToId: Record<string, string> = {};
	for (const group of groups) {
		const base = group.name?.trim() || "Ungrouped";
		const n = (counts.get(base) ?? 0) + 1;
		counts.set(base, n);
		const label = n === 1 ? base : `${base} (${n})`;
		idToLabel[group.id] = label;
		labelToId[label] = group.id;
	}
	return { idToLabel, labelToId };
}

export function GroupPicker({
	groups,
	value,
	onChange,
}: GroupPickerProps): JSX.Element {
	const { idToLabel, labelToId } = buildLabels(groups);

	return (
		<div className="endpoint-picker__field">
			<span className="endpoint-picker__field-label">Add to group</span>
			<Dropdown
				options={groups.map((group) => idToLabel[group.id])}
				value={idToLabel[value] ?? ""}
				onChange={(event: ChangeEvent<HTMLSelectElement>) => {
					const groupId = labelToId[event.target.value];
					if (groupId) {
						onChange(groupId);
					}
				}}
				aria-label="Add to group"
			/>
		</div>
	);
}
