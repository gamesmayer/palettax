import { Input, Modal, TitleBar } from "@react95/core";
import { MouseEvent, useState } from "react";
import { ColorSystem, rgbToHex } from "../../../../shared/color";
import { PaletteColor, PaletteGroup } from "../../../../shared/palette-formats";
import { usePaletteStore } from "../../store/paletteStore";
import { ColorSystemFields } from "../ColorPicker/ColorSystemFields";
import { GroupPicker, GroupSelection } from "../ColorPicker/GroupPicker";

interface ColorDialogProps {
	paletteId: string;
	groupId: string;
	groups: PaletteGroup[];
	color?: PaletteColor;
	colorSystem: ColorSystem;
	onClose: () => void;
}

export function ColorDialog({
	paletteId,
	groupId,
	groups,
	color,
	colorSystem,
	onClose,
}: ColorDialogProps): JSX.Element {
	const addColor = usePaletteStore((state) => state.addColor);
	const updateColor = usePaletteStore((state) => state.updateColor);
	const addGroup = usePaletteStore((state) => state.addGroup);
	const [groupSelection, setGroupSelection] = useState<GroupSelection>({
		kind: "existing",
		groupId,
	});
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

	function handleBackdropMouseDown(event: MouseEvent): void {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}

	return (
		<div className="dialog-backdrop" onMouseDown={handleBackdropMouseDown}>
			<Modal
				className="color-dialog"
				title={color ? "Edit color" : "Add color"}
				hasWindowButton={false}
				titleBarOptions={[<TitleBar.Close key="close" onClick={onClose} />]}
				buttons={[
					{ value: "Cancel", onClick: onClose },
					{ value: color ? "Save" : "Add", onClick: handleSubmit },
				]}
			>
				<Modal.Content className="dialog-content">
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
							<hr className="dialog-separator" />
							<GroupPicker
								groups={groups}
								value={groupSelection}
								onChange={setGroupSelection}
							/>
						</>
					)}
				</Modal.Content>
			</Modal>
		</div>
	);
}
