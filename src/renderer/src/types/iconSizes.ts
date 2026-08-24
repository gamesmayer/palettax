export type IconSize = "s" | "m" | "l";

export const ICON_SIZE_PX: Record<IconSize, number> = {
	s: 12,
	m: 16,
	l: 20,
};

export interface IconProps {
	size?: IconSize;
}
