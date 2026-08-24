import undoSvg from "../../assets/icons/undo.svg?raw";
import { IconProps } from "../../types/iconSizes";
import { InlineSvg } from "./InlineSvg";

export function UndoIcon({ size }: IconProps): JSX.Element {
	return <InlineSvg svg={undoSvg} size={size} />;
}
