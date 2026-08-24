import { Button, Input, Modal, TitleBar } from "@react95/core";
import { MouseEvent, useState } from "react";
import { PngExportOptions } from "../../../../shared/palette-formats";

interface PngExportDialogProps {
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

export function PngExportDialog({
	colorCount,
	onClose,
	onConfirm,
}: PngExportDialogProps): JSX.Element {
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

	function handleBackdropMouseDown(event: MouseEvent): void {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}

	function modeButtonClass(active: boolean): string {
		return active
			? "endpoint-picker__mode-btn endpoint-picker__mode-btn--active"
			: "endpoint-picker__mode-btn";
	}

	return (
		<div className="dialog-backdrop" onMouseDown={handleBackdropMouseDown}>
			<Modal
				className="png-export-dialog"
				title="Export as PNG"
				hasWindowButton={false}
				titleBarOptions={[<TitleBar.Close key="close" onClick={onClose} />]}
				buttons={[
					{ value: "Cancel", onClick: onClose },
					{ value: "Export", onClick: () => onConfirm({ columns }) },
				]}
			>
				<Modal.Content>
					<div className="endpoint-picker__field">
						<span className="endpoint-picker__field-label">Shape</span>
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
					</div>

					{shape === "grid" && (
						<div className="endpoint-picker__field">
							<span className="endpoint-picker__field-label">Specify by</span>
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
							<Input
								type="number"
								min={1}
								max={colorCount}
								value={gridCount}
								onChange={(event) =>
									setGridCount(
										clampCount(Number(event.target.value), colorCount)
									)
								}
								aria-label={`Number of ${gridDimension}`}
							/>
						</div>
					)}

					<p className="png-export-dialog__preview">
						Result: {columns} × {rows} ({totalCells} cell
						{totalCells === 1 ? "" : "s"}
						{emptyCells > 0 ? `, ${emptyCells} empty` : ""})
					</p>
				</Modal.Content>
			</Modal>
		</div>
	);
}
