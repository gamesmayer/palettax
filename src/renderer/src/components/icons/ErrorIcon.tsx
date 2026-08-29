import errorSvg from "../../assets/icons/error.svg?raw";
import { IconProps } from "../../types/iconSizes";
import { InlineSvg } from "./InlineSvg";

export function ErrorIcon({ size }: IconProps): JSX.Element {
	return <InlineSvg svg={errorSvg} size={size} />;
}
