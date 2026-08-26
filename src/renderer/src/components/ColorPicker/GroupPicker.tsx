import { Button, Dropdown, Input } from "@react95/core";
import { ChangeEvent } from "react";
import { PaletteGroup } from "../../../../shared/palette-formats";

export type GroupSelection =
	{ kind: "existing"; groupId: string } | { kind: "new"; name: string };

interface GroupPickerProps {
	groups: PaletteGroup[];
	value: GroupSelection;
	onChange: (selection: GroupSelection) => void;
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
			<div className="endpoint-picker__mode-toggle">
				<Button
					className={
						value.kind === "existing"
							? "endpoint-picker__mode-btn endpoint-picker__mode-btn--active"
							: "endpoint-picker__mode-btn"
					}
					disabled={groups.length === 0}
					onClick={() =>
						onChange({ kind: "existing", groupId: groups[0]?.id ?? "" })
					}
				>
					Existing group
				</Button>
				<Button
					className={
						value.kind === "new"
							? "endpoint-picker__mode-btn endpoint-picker__mode-btn--active"
							: "endpoint-picker__mode-btn"
					}
					onClick={() => onChange({ kind: "new", name: "" })}
				>
					New group
				</Button>
			</div>
			{value.kind === "existing" ? (
				<Dropdown
					options={groups.map((group) => idToLabel[group.id])}
					value={idToLabel[value.groupId] ?? ""}
					onChange={(event: ChangeEvent<HTMLSelectElement>) => {
						const groupId = labelToId[event.target.value];
						if (groupId) {
							onChange({ kind: "existing", groupId });
						}
					}}
					aria-label="Add to group"
				/>
			) : (
				<Input
					type="text"
					value={value.name}
					onChange={(event: ChangeEvent<HTMLInputElement>) =>
						onChange({ kind: "new", name: event.target.value })
					}
					placeholder="Group name"
					aria-label="New group name"
					autoFocus
				/>
			)}
		</div>
	);
}
