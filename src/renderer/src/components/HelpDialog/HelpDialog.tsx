import { Modal, Tab, Tabs, TitleBar } from "@react95/core";
import { MouseEvent } from "react";

interface HelpDialogProps {
	onClose: () => void;
}

export function HelpDialog({ onClose }: HelpDialogProps): JSX.Element {
	function handleBackdropMouseDown(event: MouseEvent): void {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}

	return (
		<div className="dialog-backdrop" onMouseDown={handleBackdropMouseDown}>
			<Modal
				className="help-dialog"
				title="How It Works"
				hasWindowButton={false}
				titleBarOptions={[<TitleBar.Close key="close" onClick={onClose} />]}
				buttons={[{ value: "Close", onClick: onClose }]}
			>
				<Modal.Content>
					<div className="help-dialog__content">
						<Tabs defaultActiveTab="Palettes">
							<Tab title="Palettes">
								<div className="help-dialog__section">
									<div className="help-dialog__section-title">
										Palettes &amp; tabs
									</div>
									<p className="help-dialog__section-body">
										Import one or more palette files at once; each opens in its
										own tab, and multiple palettes can be open at the same time.
										Switch tabs by clicking, close one with its "×".
									</p>
								</div>
								<div className="help-dialog__section">
									<div className="help-dialog__section-title">Groups</div>
									<p className="help-dialog__section-body">
										A palette is organized into named groups, like folders. Add
										one with "+ Add group", rename it by double-clicking its
										name, reorder it by dragging its "⠿" handle, and delete it
										with "✕". Only Adobe Swatch Exchange (.ase) preserves groups
										on import/export — every other format flattens all groups
										into one list, in group order.
									</p>
								</div>
								<div className="help-dialog__section">
									<div className="help-dialog__section-title">Colors</div>
									<p className="help-dialog__section-body">
										Add a color with the picker (with an optional name), remove
										it with "✕", reorder it by dragging or the ↑/↓ buttons, or
										drag it into another group.
									</p>
								</div>
								<div className="help-dialog__section">
									<div className="help-dialog__section-title">
										Color systems
									</div>
									<p className="help-dialog__section-body">
										Each color can be viewed and edited as Hex, RGB, HSL, HSB,
										or CMYK from the palette toolbar. These are just
										display/edit representations — independent of whatever file
										format the palette was imported from or will be exported to.
									</p>
								</div>
								<div className="help-dialog__section">
									<div className="help-dialog__section-title">Undo / redo</div>
									<p className="help-dialog__section-body">
										Every edit is tracked per palette, independently for each
										open tab.
									</p>
								</div>
							</Tab>
							<Tab title="Import & Export">
								<div className="help-dialog__section">
									<div className="help-dialog__section-title">
										Supported formats
									</div>
									<p className="help-dialog__section-body">
										<strong>.pal</strong> — JASC/Gale, does not support color
										names.
									</p>
									<p className="help-dialog__section-body">
										<strong>.gpl</strong> — GIMP Palette, supports a palette
										name, column count, and a name per color.
									</p>
									<p className="help-dialog__section-body">
										<strong>.txt</strong> — a plain list of hex colors, one per
										line, no names.
									</p>
									<p className="help-dialog__section-body">
										<strong>.css</strong> — a `:root` block of CSS custom
										properties; on import, only the hex values are read.
									</p>
									<p className="help-dialog__section-body">
										<strong>.ase</strong> — Adobe Swatch Exchange, the only
										format that preserves groups. Swatches can use any of
										Adobe's RGB, CMYK, Grayscale, or Lab color models on import,
										all converted to RGB; export always writes RGB.
									</p>
									<p className="help-dialog__section-body">
										<strong>.aco</strong> — Adobe Color Swatch, a flat list (no
										groups). Same RGB/HSB/CMYK/Grayscale/Lab-to-RGB conversion
										as .ase on import.
									</p>
									<p className="help-dialog__section-body">
										<strong>.png</strong> — on import, every distinct pixel
										color is kept once, in first-seen order (transparent pixels
										are skipped); on export, choose a row, column, or grid
										swatch layout.
									</p>
								</div>
							</Tab>
							<Tab title="Color Tools">
								<div className="help-dialog__section">
									<div className="help-dialog__section-title">Blend</div>
									<p className="help-dialog__section-body">
										Generates a gradient between two colors by interpolating
										each of the R, G, and B channels independently and linearly:
										for a step fraction t from 0 to 1, each channel is start +
										(end − start) × t, rounded to the nearest integer. Because
										this happens directly in RGB — not a perceptual color space
										— a blend between two very different hues can pass through a
										duller, grayer midpoint. That's expected for straight-line
										RGB interpolation, not a bug.
									</p>
								</div>
								<div className="help-dialog__section">
									<div className="help-dialog__section-title">
										Shades &amp; Tints
									</div>
									<p className="help-dialog__section-body">
										Generates darker shades and lighter tints around a base
										color by converting it to OKLCH (lightness, chroma, hue)
										once. Darkness/Lightness sets a target lightness — a
										percentage of the way toward black (for shades) or white
										(for tints); Hue Shift and Chroma Shift set the total
										hue/chroma displacement reached by the furthest step. All
										three are interpolated from the base color to that target
										across the ramp, with hue wrapping correctly around the
										color wheel (e.g. 350° + 20° lands on 10°, not 370°). If an
										interpolated color would fall outside the sRGB gamut, chroma
										is reduced just enough to bring it back in range while
										keeping its hue and lightness intact, rather than naively
										clipping each RGB channel — which would visibly distort the
										hue. An Interpolation setting controls how that progress
										along the ramp is paced — Linear (the default) spaces steps
										evenly, while Ease In, Ease Out, Ease In-Out, and
										Smootherstep bias more of the change toward one end, the
										middle, or spread it out more gradually, without changing
										where the ramp starts or ends.
									</p>
								</div>
							</Tab>
						</Tabs>
					</div>
				</Modal.Content>
			</Modal>
		</div>
	);
}
