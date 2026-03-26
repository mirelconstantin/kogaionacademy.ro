import { browser } from '$app/environment';

/**
 * Payload contract for form/fetch outcomes: success/warning/error are mutually exclusive in practice.
 * action is optional and can be used to avoid showing toasts for unrelated results.
 */
export type ActionToastPayload = {
	success?: boolean;
	warning?: string;
	error?: string;
	action?: string;
};

/** Lazy toast API so svelte-sonner (and its .svelte files) is never loaded on the server. */
async function getToast() {
	if (!browser) return null;
	const { toast } = await import('svelte-sonner');
	return toast;
}

/**
 * Shows a single toast based on action result payload.
 * Precedence: error > warning > success. Only one toast is shown per call.
 */
export function toastFromAction(payload: ActionToastPayload | null | undefined): void {
	if (!payload || !browser) return;
	getToast().then((toast) => {
		if (!toast) return;
		if (payload.error) {
			toast.error(payload.error);
			return;
		}
		if (payload.warning) {
			toast.warning(payload.warning);
			return;
		}
		if (payload.success) {
			toast.success('Salvat.');
		}
	});
}

/**
 * Like toastFromAction but with a custom success message.
 */
export function toastFromActionWithMessage(
	payload: ActionToastPayload | null | undefined,
	successMessage: string
): void {
	if (!payload || !browser) return;
	getToast().then((toast) => {
		if (!toast) return;
		if (payload.error) {
			toast.error(payload.error);
			return;
		}
		if (payload.warning) {
			toast.warning(payload.warning);
			return;
		}
		if (payload.success) {
			toast.success(successMessage);
		}
	});
}
