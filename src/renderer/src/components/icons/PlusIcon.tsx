import plusSvg from "../../assets/icons/plus.svg?raw";
import { IconProps } from "../../types/iconSizes";
import { InlineSvg } from "./InlineSvg";

export function PlusIcon({ size }: IconProps): JSX.Element {
	return <InlineSvg svg={plusSvg} size={size} />;
}
