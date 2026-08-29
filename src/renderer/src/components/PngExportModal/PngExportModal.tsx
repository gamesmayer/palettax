import { Button } from "@react95/core";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PngExportOptions } from "../../../../shared/palette-formats";
import { Field } from "../Field/Field";
import { Modal } from "../Modal/Modal";
import { NumberInput } from "../NumberInput/NumberInput";

interface PngExportModalProps {
	colorCount: number;
	onClose: () => void;
	onConfirm: (options: PngExportOptions) => void;
}

type Shape = "row" | "column" | "grid";
type GridDimension = "columns" | "rows";

function clampCount(value: number, max: number): number {
	if (!Number.isFinite(value)) return 1;
	return Math.min(max, Math.max(1, Math.round(value)));
}

export function PngExportModal({
	colorCount,
	onClose,
	onConfirm,
}: PngExportModalProps): JSX.Element {
	const { t } = useTranslation(["common", "app"]);
	const [shape, setShape] = useState<Shape>("row");
	const [gridDimension, setGridDimension] = useState<GridDimension>("columns");
	const [gridCount, setGridCount] = useState(() =>
		Math.max(1, Math.min(colorCount, 8))
	);

	const columns = Math.max(
		1,
		shape === "row"
			? colorCount
			: shape === "column"
				? 1
				: gridDimension === "columns"
					? gridCount
					: Math.ceil(colorCount / gridCount)
	);
	const rows = Math.ceil(colorCount / columns);
	const totalCells = columns * rows;
	const emptyCells = totalCells - colorCount;

	function modeButtonClass(active: boolean): string {
		return active
			? "endpoint-picker__mode-btn endpoint-picker__mode-btn--active"
			: "endpoint-picker__mode-btn";
	}

	const emptySuffix =
		emptyCells > 0
			? t("app:pngExportModal.emptySuffix", { count: emptyCells })
			: "";

	return (
		<Modal
			className="png-export-modal"
			title={t("app:pngExportModal.title")}
			buttons={[
				{ value: t("common:cancel"), onClick: onClose },
				{
					value: t("app:pngExportModal.exportButton"),
					onClick: () => onConfirm({ columns }),
				},
			]}
			onClose={onClose}
		>
			<Field label={t("app:pngExportModal.shapeLabel")}>
				<div className="endpoint-picker__mode-toggle">
					<Button
						className={modeButtonClass(shape === "row")}
						onClick={() => setShape("row")}
					>
						{t("app:pngExportModal.shapeRow")}
					</Button>
					<Button
						className={modeButtonClass(shape === "column")}
						onClick={() => setShape("column")}
					>
						{t("app:pngExportModal.shapeColumn")}
					</Button>
					<Button
						className={modeButtonClass(shape === "grid")}
						onClick={() => setShape("grid")}
					>
						{t("app:pngExportModal.shapeGrid")}
					</Button>
				</div>
			</Field>

			{shape === "grid" && (
				<Field label={t("app:pngExportModal.specifyByLabel")}>
					<div className="endpoint-picker__mode-toggle">
						<Button
							className={modeButtonClass(gridDimension === "columns")}
							onClick={() => setGridDimension("columns")}
						>
							{t("app:pngExportModal.dimensionColumns")}
						</Button>
						<Button
							className={modeButtonClass(gridDimension === "rows")}
							onClick={() => setGridDimension("rows")}
						>
							{t("app:pngExportModal.dimensionRows")}
						</Button>
					</div>
					<NumberInput
						min={1}
						max={colorCount}
						value={gridCount}
						onChange={setGridCount}
						clamp={(v) => clampCount(v, colorCount)}
						aria-label={t(
							gridDimension === "columns"
								? "app:pngExportModal.columnsCountAriaLabel"
								: "app:pngExportModal.rowsCountAriaLabel"
						)}
					/>
				</Field>
			)}

			<p className="png-export-modal__preview">
				{t("app:pngExportModal.resultLabel", {
					columns,
					rows,
					totalCells,
					emptySuffix,
					count: totalCells,
				})}
			</p>
		</Modal>
	);
}
