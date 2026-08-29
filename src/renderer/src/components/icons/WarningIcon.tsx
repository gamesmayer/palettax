import warningSvg from "../../assets/icons/warning.svg?raw";
import { IconProps } from "../../types/iconSizes";
import { InlineSvg } from "./InlineSvg";

export function WarningIcon({ size }: IconProps): JSX.Element {
	return <InlineSvg svg={warningSvg} size={size} />;
}
