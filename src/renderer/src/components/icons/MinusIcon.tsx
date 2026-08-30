import minusSvg from "../../assets/icons/minus.svg?raw";
import { IconProps } from "../../types/iconSizes";
import { InlineSvg } from "./InlineSvg";

export function MinusIcon({ size }: IconProps): JSX.Element {
	return <InlineSvg svg={minusSvg} size={size} />;
}
