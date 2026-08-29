import { Button } from "@react95/core";
import { useState } from "react";
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

	return (
		<Modal
			className="png-export-modal"
			title="Export as PNG"
			buttons={[
				{ value: "Cancel", onClick: onClose },
				{ value: "Export", onClick: () => onConfirm({ columns }) },
			]}
			onClose={onClose}
		>
			<Field label="Shape">
				<div className="endpoint-picker__mode-toggle">
					<Button
						className={modeButtonClass(shape === "row")}
						onClick={() => setShape("row")}
					>
						Row (1×N)
					</Button>
					<Button
						className={modeButtonClass(shape === "column")}
						onClick={() => setShape("column")}
					>
						Column (N×1)
					</Button>
					<Button
						className={modeButtonClass(shape === "grid")}
						onClick={() => setShape("grid")}
					>
						Grid
					</Button>
				</div>
			</Field>

			{shape === "grid" && (
				<Field label="Specify by">
					<div className="endpoint-picker__mode-toggle">
						<Button
							className={modeButtonClass(gridDimension === "columns")}
							onClick={() => setGridDimension("columns")}
						>
							Columns
						</Button>
						<Button
							className={modeButtonClass(gridDimension === "rows")}
							onClick={() => setGridDimension("rows")}
						>
							Rows
						</Button>
					</div>
					<NumberInput
						min={1}
						max={colorCount}
						value={gridCount}
						onChange={setGridCount}
						clamp={(v) => clampCount(v, colorCount)}
						aria-label={`Number of ${gridDimension}`}
					/>
				</Field>
			)}

			<p className="png-export-modal__preview">
				Result: {columns} × {rows} ({totalCells} cell
				{totalCells === 1 ? "" : "s"}
				{emptyCells > 0 ? `, ${emptyCells} empty` : ""})
			</p>
		</Modal>
	);
}
