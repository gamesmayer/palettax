import { Button, Dropdown, Frame } from "@react95/core";
import { ChangeEvent, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ColorSystem } from "../../../../shared/color";
import { PlusIcon } from "../icons/PlusIcon";
import { RedoIcon } from "../icons/RedoIcon";
import { UndoIcon } from "../icons/UndoIcon";

interface PaletteToolbarProps {
	colorSystem: ColorSystem;
	onColorSystemChange: (system: ColorSystem) => void;
	onAddGroup: () => void;
	onAddColor: () => void;
	onOpenBlend: () => void;
	onOpenShadeTint: () => void;
	onOpenMaterialRamp: () => void;
	onUndo: () => void;
	onRedo: () => void;
	canUndo: boolean;
	canRedo: boolean;
}

const COLOR_SYSTEM_ORDER: ColorSystem[] = ["hex", "rgb", "hsl", "hsb", "cmyk"];

export function PaletteToolbar({
	colorSystem,
	onColorSystemChange,
	onAddGroup,
	onAddColor,
	onOpenBlend,
	onOpenShadeTint,
	onOpenMaterialRamp,
	onUndo,
	onRedo,
	canUndo,
	canRedo,
}: PaletteToolbarProps): JSX.Element {
	const { t } = useTranslation("app");

	const colorSystemLabel = useMemo(
		() =>
			Object.fromEntries(
				COLOR_SYSTEM_ORDER.map((key) => [
					key,
					t(`paletteToolbar.colorSystem.${key}`),
				])
			) as Record<ColorSystem, string>,
		[t]
	);
	const colorSystemByLabel = useMemo(
		() =>
			Object.fromEntries(
				COLOR_SYSTEM_ORDER.map((key) => [colorSystemLabel[key], key])
			) as Record<string, ColorSystem>,
		[colorSystemLabel]
	);

	return (
		<Frame className="palette-toolbar">
			<div className="palette-toolbar__top">
				<Dropdown
					className="palette-toolbar__color-system"
					options={Object.values(colorSystemLabel)}
					value={colorSystemLabel[colorSystem]}
					onChange={(event: ChangeEvent<HTMLSelectElement>) =>
						onColorSystemChange(colorSystemByLabel[event.target.value])
					}
					aria-label={t("paletteToolbar.colorSystemAriaLabel")}
				/>
			</div>
			<hr className="modal-separator" />
			<div className="palette-toolbar__bottom">
				<div className="palette-toolbar__left">
					<Button
						className="palette-toolbar__icon-btn"
						onClick={onUndo}
						disabled={!canUndo}
						aria-label={t("paletteToolbar.undo")}
					>
						<UndoIcon />
					</Button>
					<Button
						className="palette-toolbar__icon-btn"
						onClick={onRedo}
						disabled={!canRedo}
						aria-label={t("paletteToolbar.redo")}
					>
						<RedoIcon />
					</Button>
				</div>
				<div className="palette-toolbar__right">
					<Button onClick={onAddGroup}>
						<PlusIcon /> {t("paletteToolbar.addGroup")}
					</Button>
					<Button onClick={onAddColor}>
						<PlusIcon /> {t("paletteToolbar.addColor")}
					</Button>
					<Button onClick={onOpenBlend}>{t("paletteToolbar.blending")}</Button>
					<Button onClick={onOpenShadeTint}>
						{t("paletteToolbar.shadesTints")}
					</Button>
					<Button onClick={onOpenMaterialRamp}>
						{t("paletteToolbar.materialRamp")}
					</Button>
				</div>
			</div>
		</Frame>
	);
}
