/**
 * Shared dialog behavior: Escape to close, optional backdrop click,
 * focus save/restore, and optional initial focus (first focusable or node).
 * Use with use:focusTrap for Tab trapping.
 */

const FOCUSABLE =
	'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFirstFocusable(container: HTMLElement): HTMLElement | null {
	const el = container.querySelector<HTMLElement>(FOCUSABLE);
	return el && el.offsetParent !== null && !el.hasAttribute('aria-hidden') ? el : null;
}

export type DialogBehaviorOptions = {
	/** Called when user presses Escape or clicks backdrop */
	onClose: () => void;
	/** Close when clicking the overlay (backdrop). Default true. */
	backdrop?: boolean;
	/** Focus first focusable element or the node when mounted. Default true. */
	initialFocus?: boolean;
};

export function dialogBehavior(
	node: HTMLElement,
	options: DialogBehaviorOptions | undefined
): { destroy: () => void } {
	if (!options) return { destroy: () => {} };
	const { onClose, backdrop = true, initialFocus = true } = options;

	const previousActiveElement = document.activeElement as HTMLElement | null;

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.preventDefault();
			e.stopPropagation();
			onClose();
		}
	}

	function handleClick(e: MouseEvent) {
		if (e.target === node) onClose();
	}

	node.addEventListener('keydown', handleKeydown);
	if (backdrop) node.addEventListener('click', handleClick);

	if (initialFocus && typeof document !== 'undefined') {
		const first = getFirstFocusable(node);
		if (first) first.focus();
		else if (node.getAttribute('tabindex') != null) node.focus();
	}

	return {
		destroy() {
			node.removeEventListener('keydown', handleKeydown);
			if (backdrop) node.removeEventListener('click', handleClick);
			queueMicrotask(() => previousActiveElement?.focus());
		}
	};
}
