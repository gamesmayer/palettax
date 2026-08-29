import { CheckIcon } from "../icons/CheckIcon";
import { ErrorIcon } from "../icons/ErrorIcon";
import { WarningIcon } from "../icons/WarningIcon";
import { IconProps } from "../../types/iconSizes";

export type BannerType = "success" | "warning" | "error";

interface BannerProps {
	type: BannerType;
	message: string;
}

const ICONS: Record<BannerType, (props: IconProps) => JSX.Element> = {
	success: CheckIcon,
	warning: WarningIcon,
	error: ErrorIcon,
};

/**
 * Inline status banner for a dialog body -- not react95's own `Alert`, which
 * is a full modal window and can't be embedded like this. Use for surfacing
 * validation results, confirmations, or errors alongside the field they
 * relate to.
 */
export function Banner({ type, message }: BannerProps): JSX.Element {
	const Icon = ICONS[type];
	return (
		<div className={`banner banner--${type}`}>
			<Icon size="s" />
			{message}
		</div>
	);
}
