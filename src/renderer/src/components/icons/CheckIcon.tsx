import checkSvg from "../../assets/icons/check.svg?raw";
import { IconProps } from "../../types/iconSizes";
import { InlineSvg } from "./InlineSvg";

export function CheckIcon({ size }: IconProps): JSX.Element {
	return <InlineSvg svg={checkSvg} size={size} />;
}
