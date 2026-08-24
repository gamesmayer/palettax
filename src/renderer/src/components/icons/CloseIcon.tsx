import closeSvg from "../../assets/icons/close.svg?raw";
import { IconProps } from "../../types/iconSizes";
import { InlineSvg } from "./InlineSvg";

export function CloseIcon({ size }: IconProps): JSX.Element {
	return <InlineSvg svg={closeSvg} size={size} />;
}
