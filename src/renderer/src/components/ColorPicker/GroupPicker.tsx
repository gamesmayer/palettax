import { Button } from "@react95/core";
import { PaletteGroup } from "../../../../shared/palette-formats";
import { Dropdown } from "../Dropdown/Dropdown";
import { Field } from "../Field/Field";
import { TextInput } from "../TextInput/TextInput";

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
		<Field label="Add to group">
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
					onChange={(label) => {
						const groupId = labelToId[label];
						if (groupId) {
							onChange({ kind: "existing", groupId });
						}
					}}
					aria-label="Add to group"
				/>
			) : (
				<TextInput
					value={value.name}
					onChange={(name) => onChange({ kind: "new", name })}
					placeholder="Group name"
					aria-label="New group name"
					autoFocus
				/>
			)}
		</Field>
	);
}
