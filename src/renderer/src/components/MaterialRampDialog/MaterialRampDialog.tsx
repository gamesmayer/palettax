import { Button, Frame, Input, Modal, TitleBar, Tooltip } from "@react95/core";
import { MouseEvent, useMemo, useState } from "react";
import { ColorSystem, rgbToHex } from "../../../../shared/color";
import {
	DEFAULT_BASE_COLOR,
	DEFAULT_METALLIC,
	DEFAULT_ROUGHNESS,
	DEFAULT_STOP_COUNT,
	MAX_STOPS,
	MAX_UNIT,
	MIN_STOPS,
	MIN_UNIT,
} from "../../../../shared/materialRamp/dialogConstants";
import {
	clampIntensity,
	clampStopCount,
	clampUnit,
	warningForBaseColor,
} from "../../../../shared/materialRamp/dialogValidation";
import { MATERIAL_PRESETS } from "../../../../shared/materialRamp/materialPresets";
import {
	DEFAULT_LIGHTING,
	LightingConfig,
	MaterialDefinition,
} from "../../../../shared/materialRamp/types";
import { PaletteGroup } from "../../../../shared/palette-formats";
import { generateMaterialRamp } from "../../materialRamp/generateMaterialRamp";
import { usePaletteStore } from "../../store/paletteStore";
import {
	EndpointMode,
	EndpointPicker,
	Rgb,
} from "../ColorPicker/EndpointPicker";
import { GroupPicker, GroupSelection } from "../ColorPicker/GroupPicker";
import { SwatchColorPicker } from "../ColorPicker/SwatchColorPicker";
import { MaterialRampPreview } from "./MaterialRampPreview";

interface MaterialRampDialogProps {
	paletteId: string;
	groupId: string;
	groups: PaletteGroup[];
	colorSystem: ColorSystem;
	onClose: () => void;
}

export function MaterialRampDialog({
	paletteId,
	groupId,
	groups,
	colorSystem,
	onClose,
}: MaterialRampDialogProps): JSX.Element {
	const addColors = usePaletteStore((state) => state.addColors);
	const addGroup = usePaletteStore((state) => state.addGroup);

	const [groupSelection, setGroupSelection] = useState<GroupSelection>({
		kind: "existing",
		groupId,
	});
	const colors =
		groupSelection.kind === "existing"
			? (groups.find((group) => group.id === groupSelection.groupId)?.colors ??
				[])
			: [];

	const [mode, setMode] = useState<EndpointMode>(
		colors.length > 0 ? "palette" : "new"
	);
	const [paletteColorId, setPaletteColorId] = useState(colors[0]?.id ?? "");
	const [customRgb, setCustomRgb] = useState<Rgb>(
		colors[0] ?? DEFAULT_BASE_COLOR
	);

	function handleGroupChange(nextSelection: GroupSelection): void {
		setGroupSelection(nextSelection);
		const nextColors =
			nextSelection.kind === "existing"
				? (groups.find((group) => group.id === nextSelection.groupId)?.colors ??
					[])
				: [];
		setMode(nextColors.length > 0 ? "palette" : "new");
		setPaletteColorId(nextColors[0]?.id ?? "");
		setCustomRgb(nextColors[0] ?? DEFAULT_BASE_COLOR);
	}

	const [metallic, setMetallic] = useState(DEFAULT_METALLIC);
	const [roughness, setRoughness] = useState(DEFAULT_ROUGHNESS);
	const [stopCount, setStopCount] = useState(DEFAULT_STOP_COUNT);

	const [ambientColor, setAmbientColor] = useState<Rgb>(
		DEFAULT_LIGHTING.ambientLightColor
	);
	const [ambientIntensity, setAmbientIntensity] = useState(
		DEFAULT_LIGHTING.ambientLightIntensity
	);
	const [lightColor, setLightColor] = useState<Rgb>(
		DEFAULT_LIGHTING.directionalLightColor
	);
	const [lightIntensity, setLightIntensity] = useState(
		DEFAULT_LIGHTING.directionalLightIntensity
	);

	const baseRgb =
		mode === "palette"
			? (colors.find((color) => color.id === paletteColorId) ?? customRgb)
			: customRgb;
	const baseColorWarning = warningForBaseColor(baseRgb);

	const material: MaterialDefinition = useMemo(
		() => ({
			baseColor: { r: baseRgb.r, g: baseRgb.g, b: baseRgb.b },
			metallic,
			roughness,
		}),
		[baseRgb.r, baseRgb.g, baseRgb.b, metallic, roughness]
	);

	const lighting: LightingConfig = useMemo(
		() => ({
			...DEFAULT_LIGHTING,
			directionalLightColor: {
				r: lightColor.r,
				g: lightColor.g,
				b: lightColor.b,
			},
			directionalLightIntensity: lightIntensity,
			ambientLightColor: {
				r: ambientColor.r,
				g: ambientColor.g,
				b: ambientColor.b,
			},
			ambientLightIntensity: ambientIntensity,
		}),
		[
			lightColor.r,
			lightColor.g,
			lightColor.b,
			lightIntensity,
			ambientColor.r,
			ambientColor.g,
			ambientColor.b,
			ambientIntensity,
		]
	);

	// Memoized (unlike Blend/Shade-Tint's recompute-every-render convention)
	// because this triggers a real GPU bind/draw/readback round trip, not a
	// cheap array loop.
	const { stops } = useMemo(
		() => generateMaterialRamp(material, stopCount, lighting),
		[material, stopCount, lighting]
	);

	function handleSubmit(): void {
		const storedColors = stops.map(({ color }) => ({
			r: color.r,
			g: color.g,
			b: color.b,
			hex: rgbToHex(color.r, color.g, color.b),
		}));
		const targetGroupId =
			groupSelection.kind === "existing"
				? groupSelection.groupId
				: addGroup(paletteId, groupSelection.name);
		addColors(paletteId, targetGroupId, storedColors);
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
				className="material-ramp-dialog"
				title="Generate material ramp"
				hasWindowButton={false}
				titleBarOptions={[<TitleBar.Close key="close" onClick={onClose} />]}
				buttons={[
					{ value: "Cancel", onClick: onClose },
					{ value: "Add", onClick: handleSubmit },
				]}
			>
				<Modal.Content className="dialog-content">
					<div className="endpoint-picker__field">
						<span className="endpoint-picker__field-label">
							Preview ({stops.length} color{stops.length === 1 ? "" : "s"})
						</span>
						<MaterialRampPreview
							stops={stops}
							material={material}
							lighting={lighting}
						/>
					</div>
					<hr className="dialog-separator" />

					<EndpointPicker
						label="Base color"
						mode={mode}
						onModeChange={setMode}
						colors={colors}
						colorSystem={colorSystem}
						paletteColorId={paletteColorId}
						onPaletteColorChange={setPaletteColorId}
						customRgb={customRgb}
						onCustomRgbChange={setCustomRgb}
					/>
					{baseColorWarning && (
						<div className="material-ramp-dialog__base-color-warning">
							{baseColorWarning}
						</div>
					)}

					<Frame className="material-ramp-dialog__section">
						<div className="material-ramp-dialog__section-title">
							Properties
						</div>
						<div className="endpoint-picker__field">
							<Tooltip text="Quickly set Metallic and Roughness to common material presets. Your base color is unchanged.">
								<span className="endpoint-picker__field-label">Presets</span>
							</Tooltip>
							<div className="material-preset-chips">
								{MATERIAL_PRESETS.map((preset) => (
									<Tooltip key={preset.name} text={`e.g. ${preset.examples}`}>
										<Button
											className="material-preset-chip"
											onClick={() => {
												setMetallic(preset.metallic);
												setRoughness(preset.roughness);
											}}
											aria-label={`Preset: ${preset.name}`}
										>
											{preset.name}
										</Button>
									</Tooltip>
								))}
							</div>
						</div>

						<div className="material-ramp-dialog__row">
							<div className="endpoint-picker__field">
								<Tooltip text="How metallic the surface is. 0 = dielectric (plastic, cloth, stone); 1 = pure metal (steel, gold, copper).">
									<span className="endpoint-picker__field-label">Metallic</span>
								</Tooltip>
								<Input
									type="number"
									min={MIN_UNIT}
									max={MAX_UNIT}
									step={0.01}
									value={metallic}
									onChange={(event) =>
										setMetallic(clampUnit(Number(event.target.value)))
									}
									aria-label="Metallic"
								/>
							</div>
							<div className="endpoint-picker__field">
								<Tooltip text="How rough the surface is. Low values give a small, sharp, bright highlight; high values spread it into a soft, dim sheen.">
									<span className="endpoint-picker__field-label">
										Roughness
									</span>
								</Tooltip>
								<Input
									type="number"
									min={MIN_UNIT}
									max={MAX_UNIT}
									step={0.01}
									value={roughness}
									onChange={(event) =>
										setRoughness(clampUnit(Number(event.target.value)))
									}
									aria-label="Roughness"
								/>
							</div>
							<div className="endpoint-picker__field">
								<Tooltip text="How many colors to compress the material's full light response into. More colors preserve finer value changes; fewer colors force a tighter, more stylized ramp.">
									<span className="endpoint-picker__field-label">
										Ramp colors
									</span>
								</Tooltip>
								<Input
									type="number"
									min={MIN_STOPS}
									max={MAX_STOPS}
									value={stopCount}
									onChange={(event) =>
										setStopCount(clampStopCount(Number(event.target.value)))
									}
									aria-label="Number of ramp colors"
								/>
							</div>
						</div>
					</Frame>

					<Frame className="material-ramp-dialog__section">
						<div className="material-ramp-dialog__section-title">Ambient</div>
						<div className="material-ramp-dialog__row">
							<SwatchColorPicker
								label="Ambient color"
								tooltip="A flat fill light hitting the material from every direction equally, independent of surface orientation — keeps the darkest end of the ramp from going to pure black, including for pure metals via an approximate Fresnel specular term."
								colorSystem={colorSystem}
								rgb={ambientColor}
								onChange={setAmbientColor}
							/>
							<div className="endpoint-picker__field">
								<Tooltip text="How bright the ambient fill light is.">
									<span className="endpoint-picker__field-label">
										Ambient intensity
									</span>
								</Tooltip>
								<Input
									type="number"
									min={MIN_UNIT}
									step={0.01}
									value={ambientIntensity}
									onChange={(event) =>
										setAmbientIntensity(
											clampIntensity(Number(event.target.value))
										)
									}
									aria-label="Ambient intensity"
								/>
							</div>
						</div>
					</Frame>

					<Frame className="material-ramp-dialog__section">
						<div className="material-ramp-dialog__section-title">
							Directional light
						</div>
						<div className="material-ramp-dialog__row">
							<SwatchColorPicker
								label="Light color"
								tooltip="The color of the direct light illuminating the material."
								colorSystem={colorSystem}
								rgb={lightColor}
								onChange={setLightColor}
							/>
							<div className="endpoint-picker__field">
								<Tooltip text="How bright the direct light is.">
									<span className="endpoint-picker__field-label">
										Light intensity
									</span>
								</Tooltip>
								<Input
									type="number"
									min={MIN_UNIT}
									step={0.01}
									value={lightIntensity}
									onChange={(event) =>
										setLightIntensity(
											clampIntensity(Number(event.target.value))
										)
									}
									aria-label="Light intensity"
								/>
							</div>
							<div className="endpoint-picker__field">
								<Tooltip text="Direction the light shines from, as a normalized (x, y, z) vector. Fixed for now — will be editable in a future version. Together with the view direction, this also defines the plane surface orientation is swept through to generate the ramp.">
									<span className="endpoint-picker__field-label">
										Light direction
									</span>
								</Tooltip>
								<div className="material-ramp-dialog__vector">
									{DEFAULT_LIGHTING.directionalLightDir.map(
										(component, index) => (
											<Input
												key={index}
												type="number"
												value={component}
												disabled
												aria-label={`Light direction ${["X", "Y", "Z"][index]}`}
											/>
										)
									)}
								</div>
							</div>
						</div>
					</Frame>

					<Frame className="material-ramp-dialog__section">
						<div className="material-ramp-dialog__section-title">View</div>
						<div className="endpoint-picker__field">
							<Tooltip text="Direction the camera is looking from, as a normalized (x, y, z) vector. Fixed for now — will be editable in a future version. Pairs with the light direction to define the plane surface orientation is swept through.">
								<span className="endpoint-picker__field-label">
									View direction
								</span>
							</Tooltip>
							<div className="material-ramp-dialog__vector">
								{DEFAULT_LIGHTING.viewDir.map((component, index) => (
									<Input
										key={index}
										type="number"
										value={component}
										disabled
										aria-label={`View direction ${["X", "Y", "Z"][index]}`}
									/>
								))}
							</div>
						</div>
					</Frame>

					<hr className="dialog-separator" />
					<GroupPicker
						groups={groups}
						value={groupSelection}
						onChange={handleGroupChange}
					/>
				</Modal.Content>
			</Modal>
		</div>
	);
}
