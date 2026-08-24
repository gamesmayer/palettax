import { clampByte, generateId, rgbToHex } from "../color";
import { Palette, PaletteColor, PaletteParseError } from "../types";

function baseNameFromPath(filePath: string): string {
	const fileName = filePath.split(/[\\/]/).pop() ?? filePath;
	return fileName.replace(/\.[^.]+$/, "");
}

export function parseGpl(content: string, filePath: string): Palette {
	const lines = content.split(/\r?\n/);

	if (lines[0]?.trim() !== "GIMP Palette") {
		throw new PaletteParseError(
			"The file does not have a valid GIMP Palette header."
		);
	}

	let name: string | undefined;
	let columns: number | undefined;
	const colors: PaletteColor[] = [];

	for (const rawLine of lines.slice(1)) {
		const line = rawLine.trim();
		if (line === "" || line.startsWith("#")) {
			continue;
		}
		if (/^Name:/i.test(line)) {
			name = line.slice(line.indexOf(":") + 1).trim();
			continue;
		}
		if (/^Columns:/i.test(line)) {
			const parsedColumns = parseInt(
				line.slice(line.indexOf(":") + 1).trim(),
				10
			);
			if (!Number.isNaN(parsedColumns)) {
				columns = parsedColumns;
			}
			continue;
		}

		const tokens = line.split(/\s+/);
		if (tokens.length < 3) {
			continue;
		}
		const r = clampByte(Number(tokens[0]));
		const g = clampByte(Number(tokens[1]));
		const b = clampByte(Number(tokens[2]));
		const colorName = tokens.slice(3).join(" ");
		colors.push({
			id: generateId(),
			r,
			g,
			b,
			hex: rgbToHex(r, g, b),
			name: colorName.length > 0 ? colorName : undefined,
		});
	}

	return {
		id: generateId(),
		name: name && name.length > 0 ? name : baseNameFromPath(filePath),
		colors,
		sourceFormat: "gpl",
		filePath,
		columns,
	};
}

export function serializeGpl(palette: Palette): string {
	const lines = [
		"GIMP Palette",
		`Name: ${palette.name}`,
		`Columns: ${palette.columns ?? 0}`,
		"#",
	];
	for (const color of palette.colors) {
		const line = `${clampByte(color.r)} ${clampByte(color.g)} ${clampByte(color.b)}\t${color.name ?? ""}`;
		lines.push(line.trimEnd());
	}
	return `${lines.join("\n")}\n`;
}
