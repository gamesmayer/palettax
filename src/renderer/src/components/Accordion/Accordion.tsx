import { Frame } from "@react95/core";
import { ReactNode, useState } from "react";
import { MinusIcon } from "../icons/MinusIcon";
import { PlusIcon } from "../icons/PlusIcon";

interface AccordionSectionProps {
	title: string;
	defaultOpen?: boolean;
	children: ReactNode;
}

export function AccordionSection({
	title,
	defaultOpen = true,
	children,
}: AccordionSectionProps): JSX.Element {
	const [isOpen, setIsOpen] = useState(defaultOpen);

	return (
		<Frame className="accordion-section">
			<button
				type="button"
				className="accordion-section__header"
				onClick={() => setIsOpen((open) => !open)}
				aria-expanded={isOpen}
			>
				<span className="accordion-section__toggle">
					{isOpen ? <MinusIcon size="s" /> : <PlusIcon size="s" />}
				</span>
				<span className="accordion-section__title">{title}</span>
			</button>
			{isOpen && <div className="accordion-section__content">{children}</div>}
		</Frame>
	);
}

interface AccordionProps {
	children: ReactNode;
}

/**
 * Layout wrapper for a group of AccordionSections -- each section toggles
 * independently (not exclusive), so this only handles spacing between them.
 */
export function Accordion({ children }: AccordionProps): JSX.Element {
	return <div className="accordion">{children}</div>;
}
