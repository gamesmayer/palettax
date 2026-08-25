import { Input, Modal, TitleBar } from "@react95/core";
import { MouseEvent, useState } from "react";
import { ColorSystem, blendRgb, rgbToHex } from "../../../../shared/color";
import { PaletteGroup } from "../../../../shared/palette-formats";
import { usePaletteStore } from "../../store/paletteStore";
import {
	EndpointMode,
	EndpointPicker,
	Rgb,
} from "../ColorPicker/EndpointPicker";
import { GroupPicker } from "../ColorPicker/GroupPicker";

interface BlendDialogProps {
	paletteId: string;
	groupId: string;
	groups: PaletteGroup[];
	colorSystem: ColorSystem;
	onClose: () => void;
}

const MIN_STEPS = 3;
const MAX_STEPS = 50;

function clampSteps(value: number): number {
	return Math.min(MAX_STEPS, Math.max(MIN_STEPS, Math.round(value)));
}

export function BlendDialog({
	paletteId,
	groupId,
	groups,
	colorSystem,
	onClose,
}: BlendDialogProps): JSX.Element {
	const addColors = usePaletteStore((state) => state.addColors);

	const [selectedGroupId, setSelectedGroupId] = useState(groupId);
	const colors =
		groups.find((group) => group.id === selectedGroupId)?.colors ?? [];

	const [fromMode, setFromMode] = useState<EndpointMode>(
		colors.length > 0 ? "palette" : "new"
	);
	const [fromPaletteColorId, setFromPaletteColorId] = useState(
		colors[0]?.id ?? ""
	);
	const [fromCustomRgb, setFromCustomRgb] = useState<Rgb>(
		colors[0] ?? { r: 0, g: 0, b: 0 }
	);

	const [toMode, setToMode] = useState<EndpointMode>(
		colors.length > 0 ? "palette" : "new"
	);
	const [toPaletteColorId, setToPaletteColorId] = useState(
		colors[1]?.id ?? colors[0]?.id ?? ""
	);
	const [toCustomRgb, setToCustomRgb] = useState<Rgb>(
		colors[1] ?? colors[0] ?? { r: 255, g: 255, b: 255 }
	);

	const [steps, setSteps] = useState(5);

	function handleGroupChange(nextGroupId: string): void {
		setSelectedGroupId(nextGroupId);
		const nextColors =
			groups.find((group) => group.id === nextGroupId)?.colors ?? [];
		setFromMode(nextColors.length > 0 ? "palette" : "new");
		setFromPaletteColorId(nextColors[0]?.id ?? "");
		setFromCustomRgb(nextColors[0] ?? { r: 0, g: 0, b: 0 });
		setToMode(nextColors.length > 0 ? "palette" : "new");
		setToPaletteColorId(nextColors[1]?.id ?? nextColors[0]?.id ?? "");
		setToCustomRgb(
			nextColors[1] ?? nextColors[0] ?? { r: 255, g: 255, b: 255 }
		);
	}

	function resolveRgb(
		mode: EndpointMode,
		paletteColorId: string,
		customRgb: Rgb
	): Rgb {
		if (mode === "palette") {
			return colors.find((color) => color.id === paletteColorId) ?? customRgb;
		}
		return customRgb;
	}

	const fromRgb = resolveRgb(fromMode, fromPaletteColorId, fromCustomRgb);
	const toRgb = resolveRgb(toMode, toPaletteColorId, toCustomRgb);
	const preview = blendRgb(fromRgb, toRgb, steps);

	const newColorCount =
		preview.length -
		(fromMode === "palette" ? 1 : 0) -
		(toMode === "palette" ? 1 : 0);

	function handleSubmit(): void {
		const middleSteps = preview.slice(1, -1);
		const toAdd = [
			...(fromMode === "new" ? [preview[0]] : []),
			...middleSteps,
			...(toMode === "new" ? [preview[preview.length - 1]] : []),
		].map(({ r, g, b }) => ({ r, g, b, hex: rgbToHex(r, g, b) }));
		addColors(paletteId, selectedGroupId, toAdd);
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
				className="blend-dialog"
				title="Add blending"
				hasWindowButton={false}
				titleBarOptions={[<TitleBar.Close key="close" onClick={onClose} />]}
				buttons={[
					{ value: "Cancel", onClick: onClose },
					{ value: "Add", onClick: handleSubmit },
				]}
			>
				<Modal.Content>
					<GroupPicker
						groups={groups}
						value={selectedGroupId}
						onChange={handleGroupChange}
					/>
					<hr className="dialog-separator" />

					<div className="blend-dialog__endpoints">
						<EndpointPicker
							label="From"
							mode={fromMode}
							onModeChange={setFromMode}
							colors={colors}
							colorSystem={colorSystem}
							paletteColorId={fromPaletteColorId}
							onPaletteColorChange={setFromPaletteColorId}
							customRgb={fromCustomRgb}
							onCustomRgbChange={setFromCustomRgb}
						/>

						<EndpointPicker
							label="To"
							mode={toMode}
							onModeChange={setToMode}
							colors={colors}
							colorSystem={colorSystem}
							paletteColorId={toPaletteColorId}
							onPaletteColorChange={setToPaletteColorId}
							customRgb={toCustomRgb}
							onCustomRgbChange={setToCustomRgb}
						/>
					</div>

					<div className="blend-dialog__field">
						<span className="blend-dialog__field-label">Steps</span>
						<Input
							type="number"
							min={MIN_STEPS}
							max={MAX_STEPS}
							value={steps}
							onChange={(event) =>
								setSteps(clampSteps(Number(event.target.value)))
							}
							aria-label="Number of steps"
						/>
					</div>

					<div className="blend-dialog__field">
						<span className="blend-dialog__field-label">
							Preview ({newColorCount} new color{newColorCount === 1 ? "" : "s"}
							)
						</span>
						<div className="blend-dialog__preview">
							{preview.map(({ r, g, b }, index) => (
								<div
									key={index}
									className="blend-dialog__preview-swatch"
									style={{ backgroundColor: rgbToHex(r, g, b) }}
									title={rgbToHex(r, g, b)}
								/>
							))}
						</div>
					</div>
				</Modal.Content>
			</Modal>
		</div>
	);
}
