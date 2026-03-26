/**
 * Focus trap for modal dialogs: keeps Tab/Shift+Tab within the container
 * and optionally focuses the first focusable element on mount.
 */

const FOCUSABLE =
	'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusableElements(container: HTMLElement): HTMLElement[] {
	return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
		(el) => el.offsetParent !== null && !el.hasAttribute('aria-hidden')
	);
}

export function focusTrap(
	node: HTMLElement,
	options: { initialFocus?: boolean } = {}
): { destroy: () => void } {
	const { initialFocus = true } = options;

	function handleKeydown(e: KeyboardEvent) {
		if (e.key !== 'Tab') return;
		const focusable = getFocusableElements(node);
		if (focusable.length === 0) return;
		const first = focusable[0];
		const last = focusable[focusable.length - 1];
		const current = document.activeElement as HTMLElement | null;
		if (e.shiftKey) {
			if (current === first) {
				e.preventDefault();
				last?.focus();
			}
		} else {
			if (current === last) {
				e.preventDefault();
				first?.focus();
			}
		}
	}

	node.addEventListener('keydown', handleKeydown);

	if (initialFocus) {
		const focusable = getFocusableElements(node);
		if (focusable.length > 0) {
			(focusable[0] as HTMLElement).focus();
		} else if (node.getAttribute('tabindex') !== null) {
			node.focus();
		}
	}

	return {
		destroy() {
			node.removeEventListener('keydown', handleKeydown);
		}
	};
}
