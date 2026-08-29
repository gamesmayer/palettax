import { Button, Frame } from "@react95/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	ColorSystem,
	formatColorForSystem,
	rgbToHex,
} from "../../../../shared/color";
import {
	DEFAULT_METALLIC,
	DEFAULT_ROUGHNESS,
	DEFAULT_STOP_COUNT,
	DEFAULT_TARGET_BASE_COLOR,
	MAX_STOPS,
	MAX_UNIT,
	MIN_STOPS,
	MIN_UNIT,
} from "../../../../shared/materialRamp/dialogConstants";
import {
	clampIntensity,
	clampStopCount,
	clampUnit,
	Translate,
	warningForAlbedoColor,
	warningForUnreachableTarget,
} from "../../../../shared/materialRamp/dialogValidation";
import {
	decodeEnvironmentImage,
	EnvironmentMap,
} from "../../../../shared/materialRamp/environmentMap";
import { DEFAULT_LIGHTING } from "../../../../shared/materialRamp/lightingConstants";
import { MATERIAL_PRESETS } from "../../../../shared/materialRamp/materialPresets";
import { assignRampNames } from "../../../../shared/materialRamp/rampNaming";
import {
	LightingConfig,
	MaterialDefinition,
} from "../../../../shared/materialRamp/types";
import { PaletteGroup } from "../../../../shared/palette-formats";
import { getDefaultEnvironmentMap } from "../../materialRamp/defaultEnvironmentMap";
import { generateMaterialRamp } from "../../materialRamp/generateMaterialRamp";
import {
	StaleSolveError,
	useAlbedoSolver,
} from "../../materialRamp/useAlbedoSolver";
import { usePaletteStore } from "../../store/paletteStore";
import {
	DEFAULT_ENDPOINT_MODE,
	EndpointMode,
	EndpointPicker,
	Rgb,
} from "../ColorPicker/EndpointPicker";
import { GroupPicker, GroupSelection } from "../ColorPicker/GroupPicker";
import { SwatchColorPicker } from "../ColorPicker/SwatchColorPicker";
import { Banner } from "../Banner/Banner";
import { Field, FieldLabel } from "../Field/Field";
import { FloatingTooltip } from "../FloatingTooltip/FloatingTooltip";
import { Modal } from "../Modal/Modal";
import { NumberInput } from "../NumberInput/NumberInput";
import { VectorInput } from "../VectorInput/VectorInput";
import { EnvironmentMapPreview } from "./EnvironmentMapPreview";
import { MaterialRampPreview } from "./MaterialRampPreview";

// Coalesces rapid-fire changes (e.g. dragging a NumberInput) into a single
// solve request once the user pauses, instead of one per intermediate value.
const ALBEDO_SOLVE_DEBOUNCE_MS = 200;

interface MaterialRampModalProps {
	paletteId: string;
	groupId: string;
	groups: PaletteGroup[];
	colorSystem: ColorSystem;
	onClose: () => void;
}

export function MaterialRampModal({
	paletteId,
	groupId,
	groups,
	colorSystem,
	onClose,
}: MaterialRampModalProps): JSX.Element {
	const { t } = useTranslation(["common", "app"]);
	const addColors = usePaletteStore((state) => state.addColors);
	const addGroup = usePaletteStore((state) => state.addGroup);

	const [groupSelection, setGroupSelection] = useState<GroupSelection>(
		groups.length > 0
			? { kind: "existing", groupId }
			: { kind: "new", name: "" }
	);

	const colors = groups.find((group) => group.id === groupId)?.colors ?? [];

	// The material's actual albedo -- read-only in the UI (see the Color
	// section below), solved automatically from the Target base color rather
	// than picked directly, since artists think in terms of the desired final
	// appearance, not the underlying BRDF input.
	const [albedoRgb, setAlbedoRgb] = useState<Rgb>(DEFAULT_TARGET_BASE_COLOR);
	const albedoLightnessWarning = warningForAlbedoColor(
		albedoRgb,
		t as Translate
	);

	// Represents the desired final rendered appearance -- changing it (or
	// changing metallic/roughness/lighting afterward) solves for the Albedo
	// color above via evaluateNeutralBaseColor/solveAlbedoForTarget, rather
	// than feeding the BRDF directly. Solves live on every change (not just
	// on blur/commit) so the effect of a color pick is immediately visible.
	const [targetMode, setTargetMode] = useState<EndpointMode>(
		DEFAULT_ENDPOINT_MODE
	);
	const [targetPaletteColorId, setTargetPaletteColorId] = useState(
		colors[0]?.id ?? ""
	);
	const [targetCustomRgb, setTargetCustomRgb] = useState<Rgb>(
		DEFAULT_TARGET_BASE_COLOR
	);
	const [unreachableAchieved, setUnreachableAchieved] = useState<Rgb | null>(
		null
	);
	const { isSolving, solve } = useAlbedoSolver();

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

	const [environmentMode, setEnvironmentMode] = useState<"default" | "custom">(
		"default"
	);
	const [defaultEnvironmentMap, setDefaultEnvironmentMap] =
		useState<EnvironmentMap | null>(null);
	const [customEnvironmentMap, setCustomEnvironmentMap] =
		useState<EnvironmentMap | null>(null);
	const [customEnvironmentFileName, setCustomEnvironmentFileName] = useState<
		string | null
	>(null);
	const [environmentError, setEnvironmentError] = useState<string | null>(null);
	const [environmentIntensity, setEnvironmentIntensity] = useState(
		DEFAULT_LIGHTING.environmentIntensity
	);

	useEffect(() => {
		let cancelled = false;
		getDefaultEnvironmentMap().then((map) => {
			if (!cancelled) setDefaultEnvironmentMap(map);
		});
		return () => {
			cancelled = true;
		};
	}, []);

	async function handleChooseEnvironmentImage(): Promise<void> {
		const result = await window.environmentApi.importImage();
		if (result.canceled || !result.file) return;
		try {
			setCustomEnvironmentMap(decodeEnvironmentImage(result.file.bytes));
			setCustomEnvironmentFileName(
				result.file.filePath.split(/[\\/]/).pop() ?? result.file.filePath
			);
			setEnvironmentError(null);
		} catch {
			setEnvironmentError(t("app:materialRampModal.environmentReadError"));
		}
	}

	const activeEnvironmentMap =
		environmentMode === "default"
			? defaultEnvironmentMap
			: customEnvironmentMap;

	const targetRgb =
		targetMode === "palette"
			? (colors.find((color) => color.id === targetPaletteColorId) ??
				targetCustomRgb)
			: targetCustomRgb;
	const unreachableWarning = unreachableAchieved
		? warningForUnreachableTarget(
				targetRgb,
				unreachableAchieved,
				colorSystem,
				t as Translate
			)
		: null;

	const material: MaterialDefinition = useMemo(
		() => ({
			baseColor: { r: albedoRgb.r, g: albedoRgb.g, b: albedoRgb.b },
			metallic,
			roughness,
		}),
		[albedoRgb.r, albedoRgb.g, albedoRgb.b, metallic, roughness]
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
			environmentMap: activeEnvironmentMap,
			environmentIntensity,
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
			activeEnvironmentMap,
			environmentIntensity,
		]
	);

	// Memoized (unlike Blend/Shade-Tint's recompute-every-render convention)
	// because this triggers a real GPU bind/draw/readback round trip, not a
	// cheap array loop.
	const { stops } = useMemo(
		() => generateMaterialRamp(material, stopCount, lighting),
		[material, stopCount, lighting]
	);

	const runSolve = useCallback(async (): Promise<void> => {
		setUnreachableAchieved(null);
		try {
			const { albedo, achieved } = await solve(
				targetRgb,
				metallic,
				roughness,
				lighting
			);
			setAlbedoRgb(albedo);
			setUnreachableAchieved(achieved);
		} catch (error) {
			if (!(error instanceof StaleSolveError)) throw error;
		}
	}, [solve, targetRgb, metallic, roughness, lighting]);

	// Runs once on mount (solving for the default target as soon as the
	// modal opens) and again on every live change to the target color (not
	// just on blur/commit -- the effect of a pick should be immediately
	// clear) or to metallic/roughness/lighting. Debounced: metallic/
	// roughness/ambient/light/environment intensity are all drag-to-scrub
	// NumberInputs now, which fire onChange on every pixel of movement --
	// without this, a single drag gesture would flood the solver worker
	// with a solve request per pixel.
	useEffect(() => {
		const timeoutId = setTimeout(runSolve, ALBEDO_SOLVE_DEBOUNCE_MS);
		return () => clearTimeout(timeoutId);
		// Deliberately omits `runSolve` itself: its identity only ever changes
		// because of the other listed deps (targetRgb/metallic/roughness/
		// lighting), which are already here, so including it would be
		// redundant, not incomplete.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [targetRgb.r, targetRgb.g, targetRgb.b, metallic, roughness, lighting]);

	function handleSubmit(): void {
		const namedStops = assignRampNames(stops, material, lighting);
		const storedColors = namedStops.map(({ stop, name }) => ({
			r: stop.color.r,
			g: stop.color.g,
			b: stop.color.b,
			hex: rgbToHex(stop.color.r, stop.color.g, stop.color.b),
			name,
		}));
		const targetGroupId =
			groupSelection.kind === "existing"
				? groupSelection.groupId
				: addGroup(paletteId, groupSelection.name);
		addColors(paletteId, targetGroupId, storedColors);
		onClose();
	}

	return (
		<Modal
			className="material-ramp-modal"
			title={t("app:materialRampModal.title")}
			buttons={[
				{ value: t("common:cancel"), onClick: onClose },
				{ value: t("common:add"), onClick: handleSubmit },
			]}
			onClose={onClose}
		>
			<Field
				label={t("app:materialRampModal.previewLabel", { count: stops.length })}
			>
				<MaterialRampPreview
					stops={stops}
					material={material}
					lighting={lighting}
				/>
			</Field>
			<hr className="modal-separator" />

			<Frame className="material-ramp-modal__section">
				<div className="material-ramp-modal__section-title">
					{t("app:materialRampModal.sections.color")}
				</div>

				<EndpointPicker
					label={t("app:materialRampModal.targetBaseColorLabel")}
					tooltip={t("app:materialRampModal.tooltips.targetBaseColor")}
					mode={targetMode}
					onModeChange={setTargetMode}
					colors={colors}
					colorSystem={colorSystem}
					paletteColorId={targetPaletteColorId}
					onPaletteColorChange={setTargetPaletteColorId}
					customRgb={targetCustomRgb}
					onCustomRgbChange={setTargetCustomRgb}
				/>

				<div className="material-ramp-modal__albedo-field">
					<div className="material-ramp-modal__albedo-swatch-row">
						<FieldLabel
							text={t("app:materialRampModal.albedoColorLabel")}
							tooltip={t("app:materialRampModal.tooltips.albedoColor")}
						/>
						<FloatingTooltip
							text={formatColorForSystem(albedoRgb, colorSystem)}
						>
							<div
								className="material-ramp-modal__value-swatch"
								style={{
									backgroundColor: rgbToHex(
										albedoRgb.r,
										albedoRgb.g,
										albedoRgb.b
									),
								}}
								aria-label={t("app:materialRampModal.albedoColorAriaLabel", {
									color: formatColorForSystem(albedoRgb, colorSystem),
								})}
							/>
						</FloatingTooltip>
						{isSolving && (
							<span className="material-ramp-modal__albedo-solving">
								{t("app:materialRampModal.calculating")}
							</span>
						)}
					</div>
				</div>
				{unreachableWarning && (
					<Banner
						type={unreachableWarning.severity}
						message={unreachableWarning.message}
					/>
				)}
				{albedoLightnessWarning && (
					<Banner type="warning" message={albedoLightnessWarning} />
				)}
			</Frame>

			<Frame className="material-ramp-modal__section">
				<div className="material-ramp-modal__section-title">
					{t("app:materialRampModal.sections.properties")}
				</div>
				<Field
					label={t("app:materialRampModal.presetsLabel")}
					tooltip={t("app:materialRampModal.tooltips.presets")}
				>
					<div className="material-preset-chips">
						{MATERIAL_PRESETS.map((preset) => {
							const name = t(`app:materialPresets.${preset.id}.name`);
							const examples = t(`app:materialPresets.${preset.id}.examples`);
							return (
								<FloatingTooltip
									key={preset.id}
									text={t("app:materialRampModal.presetExampleTooltip", {
										examples,
									})}
								>
									<Button
										className="material-preset-chip"
										onClick={() => {
											setMetallic(preset.metallic);
											setRoughness(preset.roughness);
										}}
										aria-label={t("app:materialRampModal.presetAriaLabel", {
											name,
										})}
									>
										{name}
									</Button>
								</FloatingTooltip>
							);
						})}
					</div>
				</Field>

				<div className="material-ramp-modal__row">
					<NumberInput
						label={t("app:materialRampModal.metallicLabel")}
						tooltip={t("app:materialRampModal.tooltips.metallic")}
						min={MIN_UNIT}
						max={MAX_UNIT}
						step={0.01}
						value={metallic}
						onChange={setMetallic}
						clamp={clampUnit}
						aria-label={t("app:materialRampModal.metallicLabel")}
					/>
					<NumberInput
						label={t("app:materialRampModal.roughnessLabel")}
						tooltip={t("app:materialRampModal.tooltips.roughness")}
						min={MIN_UNIT}
						max={MAX_UNIT}
						step={0.01}
						value={roughness}
						onChange={setRoughness}
						clamp={clampUnit}
						aria-label={t("app:materialRampModal.roughnessLabel")}
					/>
					<NumberInput
						label={t("app:materialRampModal.rampColorsLabel")}
						tooltip={t("app:materialRampModal.tooltips.rampColors")}
						min={MIN_STOPS}
						max={MAX_STOPS}
						value={stopCount}
						onChange={setStopCount}
						clamp={clampStopCount}
						aria-label={t("app:materialRampModal.rampColorsAriaLabel")}
					/>
				</div>
			</Frame>

			<Frame className="material-ramp-modal__section">
				<div className="material-ramp-modal__section-title">
					{t("app:materialRampModal.sections.ambient")}
				</div>
				<div className="material-ramp-modal__row">
					<SwatchColorPicker
						label={t("app:materialRampModal.ambientColorLabel")}
						tooltip={t("app:materialRampModal.tooltips.ambientColor")}
						colorSystem={colorSystem}
						rgb={ambientColor}
						onChange={setAmbientColor}
					/>
					<NumberInput
						label={t("app:materialRampModal.ambientIntensityLabel")}
						tooltip={t("app:materialRampModal.tooltips.ambientIntensity")}
						min={MIN_UNIT}
						step={0.01}
						value={ambientIntensity}
						onChange={setAmbientIntensity}
						clamp={clampIntensity}
						aria-label={t("app:materialRampModal.ambientIntensityLabel")}
					/>
				</div>
			</Frame>

			<Frame className="material-ramp-modal__section">
				<div className="material-ramp-modal__section-title">
					{t("app:materialRampModal.sections.environmentReflection")}
				</div>
				<Field
					label={t("app:materialRampModal.environmentLabel")}
					tooltip={t("app:materialRampModal.tooltips.environment")}
				>
					<div className="endpoint-picker__mode-toggle">
						<Button
							className={
								environmentMode === "default"
									? "endpoint-picker__mode-btn endpoint-picker__mode-btn--active"
									: "endpoint-picker__mode-btn"
							}
							onClick={() => setEnvironmentMode("default")}
						>
							{t("app:materialRampModal.defaultImage")}
						</Button>
						<Button
							className={
								environmentMode === "custom"
									? "endpoint-picker__mode-btn endpoint-picker__mode-btn--active"
									: "endpoint-picker__mode-btn"
							}
							onClick={() => setEnvironmentMode("custom")}
						>
							{t("app:materialRampModal.customImage")}
						</Button>
					</div>
				</Field>
				{environmentMode === "custom" && (
					<div className="field">
						<Button onClick={handleChooseEnvironmentImage}>
							{t("app:materialRampModal.chooseFile")}
						</Button>
						{customEnvironmentFileName && (
							<span className="material-ramp-modal__environment-filename">
								{customEnvironmentFileName}
							</span>
						)}
					</div>
				)}
				<EnvironmentMapPreview environmentMap={activeEnvironmentMap} />
				{environmentError && <Banner type="error" message={environmentError} />}
				<NumberInput
					label={t("app:materialRampModal.environmentIntensityLabel")}
					tooltip={t("app:materialRampModal.tooltips.environmentIntensity")}
					min={MIN_UNIT}
					step={0.01}
					value={environmentIntensity}
					onChange={setEnvironmentIntensity}
					clamp={clampIntensity}
					aria-label={t("app:materialRampModal.environmentIntensityLabel")}
				/>
			</Frame>

			<Frame className="material-ramp-modal__section">
				<div className="material-ramp-modal__section-title">
					{t("app:materialRampModal.sections.directionalLight")}
				</div>
				<div className="material-ramp-modal__row">
					<SwatchColorPicker
						label={t("app:materialRampModal.lightColorLabel")}
						tooltip={t("app:materialRampModal.tooltips.lightColor")}
						colorSystem={colorSystem}
						rgb={lightColor}
						onChange={setLightColor}
					/>
					<NumberInput
						label={t("app:materialRampModal.lightIntensityLabel")}
						tooltip={t("app:materialRampModal.tooltips.lightIntensity")}
						min={MIN_UNIT}
						step={0.01}
						value={lightIntensity}
						onChange={setLightIntensity}
						clamp={clampIntensity}
						aria-label={t("app:materialRampModal.lightIntensityLabel")}
					/>
					<VectorInput
						label={t("app:materialRampModal.lightDirectionLabel")}
						tooltip={t("app:materialRampModal.tooltips.lightDirection")}
						value={DEFAULT_LIGHTING.directionalLightDir}
						disabled
					/>
				</div>
			</Frame>

			<Frame className="material-ramp-modal__section">
				<div className="material-ramp-modal__section-title">
					{t("app:materialRampModal.sections.view")}
				</div>
				<VectorInput
					label={t("app:materialRampModal.viewDirectionLabel")}
					tooltip={t("app:materialRampModal.tooltips.viewDirection")}
					value={DEFAULT_LIGHTING.viewDir}
					disabled
				/>
			</Frame>

			<hr className="modal-separator" />
			<GroupPicker
				groups={groups}
				value={groupSelection}
				onChange={setGroupSelection}
			/>
		</Modal>
	);
}
