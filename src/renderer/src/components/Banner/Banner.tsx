export type BannerType = "success" | "warning" | "error";

interface BannerProps {
	type: BannerType;
	message: string;
}

/**
 * Inline status banner for a dialog body -- not react95's own `Alert`, which
 * is a full modal window and can't be embedded like this. Use for surfacing
 * validation results, confirmations, or errors alongside the field they
 * relate to.
 */
export function Banner({ type, message }: BannerProps): JSX.Element {
	return <div className={`banner banner--${type}`}>{message}</div>;
}
