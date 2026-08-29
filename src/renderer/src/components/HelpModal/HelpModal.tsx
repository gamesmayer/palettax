import { Tab, Tabs } from "@react95/core";
import { Modal } from "../Modal/Modal";

interface HelpModalProps {
	onClose: () => void;
}

export function HelpModal({ onClose }: HelpModalProps): JSX.Element {
	return (
		<Modal
			className="help-modal"
			title="How It Works"
			buttons={[{ value: "Close", onClick: onClose }]}
			onClose={onClose}
		>
			<Tabs defaultActiveTab="Palettes">
				<Tab title="Palettes">
					<div className="help-modal__section">
						<div className="help-modal__section-title">Palettes &amp; tabs</div>
						<p className="help-modal__section-body">
							Import one or more palette files at once; each opens in its own
							tab, and multiple palettes can be open at the same time. Switch
							tabs by clicking, close one with its "×".
						</p>
					</div>
					<div className="help-modal__section">
						<div className="help-modal__section-title">Groups</div>
						<p className="help-modal__section-body">
							A palette is organized into named groups, like folders. Add one
							with "+ Add group", rename it by double-clicking its name, reorder
							it by dragging its "⠿" handle, and delete it with "✕". Only Adobe
							Swatch Exchange (.ase) preserves groups on import/export — every
							other format flattens all groups into one list, in group order.
						</p>
					</div>
					<div className="help-modal__section">
						<div className="help-modal__section-title">Colors</div>
						<p className="help-modal__section-body">
							Add a color with the picker (with an optional name), remove it
							with "✕", reorder it by dragging or the ↑/↓ buttons, or drag it
							into another group.
						</p>
					</div>
					<div className="help-modal__section">
						<div className="help-modal__section-title">Color systems</div>
						<p className="help-modal__section-body">
							Each color can be viewed and edited as Hex, RGB, HSL, HSB, or CMYK
							from the palette toolbar. These are just display/edit
							representations — independent of whatever file format the palette
							was imported from or will be exported to.
						</p>
					</div>
					<div className="help-modal__section">
						<div className="help-modal__section-title">Undo / redo</div>
						<p className="help-modal__section-body">
							Every edit is tracked per palette, independently for each open
							tab.
						</p>
					</div>
				</Tab>
				<Tab title="Import & Export">
					<div className="help-modal__section">
						<div className="help-modal__section-title">Supported formats</div>
						<p className="help-modal__section-body">
							<strong>.pal</strong> — JASC/Gale, does not support color names.
						</p>
						<p className="help-modal__section-body">
							<strong>.gpl</strong> — GIMP Palette, supports a palette name,
							column count, and a name per color.
						</p>
						<p className="help-modal__section-body">
							<strong>.txt</strong> — a plain list of hex colors, one per line,
							no names.
						</p>
						<p className="help-modal__section-body">
							<strong>.css</strong> — a `:root` block of CSS custom properties;
							on import, only the hex values are read.
						</p>
						<p className="help-modal__section-body">
							<strong>.ase</strong> — Adobe Swatch Exchange, the only format
							that preserves groups. Swatches can use any of Adobe's RGB, CMYK,
							Grayscale, or Lab color models on import, all converted to RGB;
							export always writes RGB.
						</p>
						<p className="help-modal__section-body">
							<strong>.aco</strong> — Adobe Color Swatch, a flat list (no
							groups). Same RGB/HSB/CMYK/Grayscale/Lab-to-RGB conversion as .ase
							on import.
						</p>
						<p className="help-modal__section-body">
							<strong>.png</strong> — on import, every distinct pixel color is
							kept once, in first-seen order (transparent pixels are skipped);
							on export, choose a row, column, or grid swatch layout.
						</p>
					</div>
				</Tab>
				<Tab title="Color Tools">
					<div className="help-modal__section">
						<div className="help-modal__section-title">Blend</div>
						<p className="help-modal__section-body">
							Generates a gradient between two colors by interpolating each of
							the R, G, and B channels independently and linearly: for a step
							fraction t from 0 to 1, each channel is start + (end − start) × t,
							rounded to the nearest integer. Because this happens directly in
							RGB — not a perceptual color space — a blend between two very
							different hues can pass through a duller, grayer midpoint. That's
							expected for straight-line RGB interpolation, not a bug.
						</p>
					</div>
					<div className="help-modal__section">
						<div className="help-modal__section-title">Shades &amp; Tints</div>
						<p className="help-modal__section-body">
							Generates darker shades and lighter tints around a base color by
							converting it to OKLCH (lightness, chroma, hue) once.
							Darkness/Lightness sets a target lightness — a percentage of the
							way toward black (for shades) or white (for tints); Hue Shift and
							Chroma Shift set the total hue/chroma displacement reached by the
							furthest step. All three are interpolated from the base color to
							that target across the ramp, with hue wrapping correctly around
							the color wheel (e.g. 350° + 20° lands on 10°, not 370°). If an
							interpolated color would fall outside the sRGB gamut, chroma is
							reduced just enough to bring it back in range while keeping its
							hue and lightness intact, rather than naively clipping each RGB
							channel — which would visibly distort the hue. An Interpolation
							setting controls how that progress along the ramp is paced —
							Linear (the default) spaces steps evenly, while Ease In, Ease Out,
							Ease In-Out, and Smootherstep bias more of the change toward one
							end, the middle, or spread it out more gradually, without changing
							where the ramp starts or ends.
						</p>
					</div>
					<div className="help-modal__section">
						<div className="help-modal__section-title">Material Ramp</div>
						<p className="help-modal__section-body">
							Generates a ramp from a small physically-based material model — a
							simplified Cook-Torrance/GGX reflectance model, the same lighting
							math used in modern 3D renderers — instead of interpolating
							between two colors. Base color sets the material's underlying
							albedo; Metallic (0 = plastic, wood, stone; 1 = bare metal) and
							Roughness (0 = mirror-like; 1 = matte) shape how it reflects
							light. Presets fill in common Metallic/Roughness combinations
							(rough plastic, brushed metal, rubber, and so on) without changing
							the base color.
						</p>
						<p className="help-modal__section-body">
							Ambient and Directional light color/intensity are adjustable;
							light and view direction stay fixed for now (planned to become
							editable later). With those fixed, the ramp varies only the angle
							between the light and the surface, not a literal brightness dial —
							so a glossy material shows one sharp, narrow highlight partway
							through the ramp, while a rough material's brightness changes
							gradually across the whole range.
						</p>
						<p className="help-modal__section-body">
							Ramp colors is a compression budget, not an even split: stops are
							placed adaptively, concentrated wherever the material's response
							changes fastest (like a glossy highlight) and sparse where it
							barely changes — so a 7-color ramp for polished metal looks very
							different from a 7-color ramp for cloth. Add converts the ramp
							into ordinary palette colors; each stop's illumination position
							isn't preserved once added.
						</p>
					</div>
				</Tab>
			</Tabs>
		</Modal>
	);
}
