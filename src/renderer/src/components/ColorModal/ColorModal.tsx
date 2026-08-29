import { Input } from "@react95/core";
import { useState } from "react";
import { ColorSystem, rgbToHex } from "../../../../shared/color";
import { PaletteColor, PaletteGroup } from "../../../../shared/palette-formats";
import { usePaletteStore } from "../../store/paletteStore";
import { ColorSystemFields } from "../ColorPicker/ColorSystemFields";
import { GroupPicker, GroupSelection } from "../ColorPicker/GroupPicker";
import { Modal } from "../Modal/Modal";

interface ColorModalProps {
	paletteId: string;
	groupId: string;
	groups: PaletteGroup[];
	color?: PaletteColor;
	colorSystem: ColorSystem;
	onClose: () => void;
}

export function ColorModal({
	paletteId,
	groupId,
	groups,
	color,
	colorSystem,
	onClose,
}: ColorModalProps): JSX.Element {
	const addColor = usePaletteStore((state) => state.addColor);
	const updateColor = usePaletteStore((state) => state.updateColor);
	const addGroup = usePaletteStore((state) => state.addGroup);
	const [groupSelection, setGroupSelection] = useState<GroupSelection>(
		groups.length > 0
			? { kind: "existing", groupId }
			: { kind: "new", name: "" }
	);
	const [rgb, setRgb] = useState({
		r: color?.r ?? 255,
		g: color?.g ?? 255,
		b: color?.b ?? 255,
	});
	const [name, setName] = useState(color?.name ?? "");

	function handleSubmit(): void {
		const changes = {
			r: rgb.r,
			g: rgb.g,
			b: rgb.b,
			hex: rgbToHex(rgb.r, rgb.g, rgb.b),
			name: name.trim() ? name.trim() : undefined,
		};
		if (color) {
			updateColor(paletteId, groupId, color.id, changes);
		} else {
			const targetGroupId =
				groupSelection.kind === "existing"
					? groupSelection.groupId
					: addGroup(paletteId, groupSelection.name);
			addColor(paletteId, targetGroupId, changes);
		}
		onClose();
	}

	return (
		<Modal
			className="color-modal"
			title={color ? "Edit color" : "Add color"}
			buttons={[
				{ value: "Cancel", onClick: onClose },
				{ value: color ? "Save" : "Add", onClick: handleSubmit },
			]}
			onClose={onClose}
		>
			<ColorSystemFields
				colorSystem={colorSystem}
				rgb={rgb}
				onChange={setRgb}
			/>

			<Input
				type="text"
				value={name}
				onChange={(event) => setName(event.target.value)}
				placeholder="Name"
			/>
			{!color && (
				<>
					<hr className="modal-separator" />
					<GroupPicker
						groups={groups}
						value={groupSelection}
						onChange={setGroupSelection}
					/>
				</>
			)}
		</Modal>
	);
}
