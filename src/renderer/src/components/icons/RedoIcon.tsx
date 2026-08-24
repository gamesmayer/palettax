import redoSvg from "../../assets/icons/redo.svg?raw";
import { IconProps } from "../../types/iconSizes";
import { InlineSvg } from "./InlineSvg";

export function RedoIcon({ size }: IconProps): JSX.Element {
	return <InlineSvg svg={redoSvg} size={size} />;
}
