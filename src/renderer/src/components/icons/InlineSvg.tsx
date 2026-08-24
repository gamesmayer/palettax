import { ICON_SIZE_PX, IconProps } from "../../types/iconSizes";

interface InlineSvgProps extends IconProps {
	svg: string;
}

export function InlineSvg({ svg, size = "m" }: InlineSvgProps): JSX.Element {
	const px = ICON_SIZE_PX[size];
	return (
		<span
			className="inline-svg"
			style={{ width: px, height: px }}
			dangerouslySetInnerHTML={{ __html: svg }}
		/>
	);
}
