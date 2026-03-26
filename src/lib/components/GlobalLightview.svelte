<script lang="ts">
	import X from '@lucide/svelte/icons/x';

	type ViewRect = { top: number; left: number; width: number; height: number };

	const CLOSE_DURATION_MS = 360;

	let isOpen = $state(false);
	let isVisible = $state(false);
	let backdropActive = $state(false);
	let controlsVisible = $state(false);

	let imageSrc = $state('');
	let imageAlt = $state('');
	let imageWidth = $state(0);
	let imageHeight = $state(0);

	let originImage = $state<HTMLImageElement | null>(null);
	let originImageOriginalVisibility: string | null = null;
	let animatedRect = $state<ViewRect | null>(null);
	let targetRect = $state<ViewRect | null>(null);

	let closeTimer: ReturnType<typeof setTimeout> | null = null;

	function clearCloseTimer() {
		if (!closeTimer) return;
		clearTimeout(closeTimer);
		closeTimer = null;
	}

	function restoreOriginImage() {
		if (!originImage || !originImage.isConnected) {
			originImageOriginalVisibility = null;
			return;
		}
		originImage.style.visibility = originImageOriginalVisibility ?? '';
		originImageOriginalVisibility = null;
	}

	function isEligibleImage(img: HTMLImageElement) {
		if (!img.src) return false;
		if (img.dataset.lightview === 'false') return false;
		if (img.closest('[data-lightview="false"]')) return false;
		/** Portrete / poze de profil (mentori, fondatori, avatar etc.) — fără lightview */
		if (img.dataset.profilePhoto === 'true' || img.closest('[data-profile-photo]')) return false;
		if (img.closest('button,[role="button"],a,input,label,summary')) return false;
		return true;
	}

	function toViewRect(rect: DOMRect): ViewRect {
		return { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
	}

	function getCornerRadius(rect: ViewRect): number {
		const base = Math.min(rect.width, rect.height);
		return Math.max(10, Math.min(38, base * 0.075));
	}

	function computeTargetRect(): ViewRect | null {
		if (typeof window === 'undefined') return null;
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;
		const safePadding = Math.min(96, Math.max(40, viewportWidth * 0.06));
		const maxWidth = viewportWidth - safePadding * 2;
		const maxHeight = viewportHeight - safePadding * 2;
		if (maxWidth <= 0 || maxHeight <= 0) return null;

		const sourceRatio =
			imageWidth > 0 && imageHeight > 0
				? imageWidth / imageHeight
				: (animatedRect?.width ?? 1) / Math.max(animatedRect?.height ?? 1, 1);

		let width = maxWidth;
		let height = width / sourceRatio;
		if (height > maxHeight) {
			height = maxHeight;
			width = height * sourceRatio;
		}

		return {
			top: (viewportHeight - height) / 2,
			left: (viewportWidth - width) / 2,
			width,
			height
		};
	}

	function openFromImage(img: HTMLImageElement) {
		const rect = img.getBoundingClientRect();
		if (rect.width < 6 || rect.height < 6) return;

		clearCloseTimer();
		restoreOriginImage();
		originImage = img;
		originImageOriginalVisibility = img.style.visibility;
		img.style.visibility = 'hidden';
		imageSrc = img.currentSrc || img.src;
		imageAlt = img.alt || 'Preview imagine';
		imageWidth = img.naturalWidth || 0;
		imageHeight = img.naturalHeight || 0;
		animatedRect = toViewRect(rect);
		targetRect = null;
		controlsVisible = false;
		isVisible = true;
		isOpen = true;

		requestAnimationFrame(() => {
			targetRect = computeTargetRect();
			if (!targetRect) return;
			requestAnimationFrame(() => {
				animatedRect = targetRect;
				backdropActive = true;
				controlsVisible = true;
			});
		});
	}

	function closeLightview() {
		if (!isVisible || !animatedRect) return;
		clearCloseTimer();

		backdropActive = false;
		controlsVisible = false;
		isOpen = false;

		const originRect = originImage?.isConnected ? toViewRect(originImage.getBoundingClientRect()) : null;
		if (originRect && originRect.width > 6 && originRect.height > 6) {
			animatedRect = originRect;
		} else {
			animatedRect = {
				top: animatedRect.top + animatedRect.height * 0.05,
				left: animatedRect.left + animatedRect.width * 0.05,
				width: animatedRect.width * 0.9,
				height: animatedRect.height * 0.9
			};
		}

		closeTimer = setTimeout(() => {
			isVisible = false;
			imageSrc = '';
			imageAlt = '';
			restoreOriginImage();
			originImage = null;
			animatedRect = null;
			targetRect = null;
			closeTimer = null;
		}, CLOSE_DURATION_MS);
	}

	function handleDocumentClick(event: MouseEvent) {
		if (isVisible) return;
		const target = event.target;
		if (!(target instanceof Element)) return;
		const img = target.closest('img');
		if (!(img instanceof HTMLImageElement)) return;
		if (!isEligibleImage(img)) return;
		if (event.defaultPrevented) return;
		if (event.button !== 0) return;
		if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

		event.preventDefault();
		openFromImage(img);
	}

	function handleGlobalKeydown(event: KeyboardEvent) {
		if (!isVisible) return;
		if (event.key === 'Escape') {
			event.preventDefault();
			closeLightview();
		}
	}

	function handleResize() {
		if (!isOpen || !isVisible) return;
		const nextRect = computeTargetRect();
		if (!nextRect) return;
		targetRect = nextRect;
		animatedRect = nextRect;
	}

	$effect(() => {
		if (typeof document === 'undefined') return;
		const originalOverflow = document.body.style.overflow;
		if (isVisible) document.body.style.overflow = 'hidden';
		else document.body.style.overflow = originalOverflow;
		return () => {
			document.body.style.overflow = originalOverflow;
			if (originImage && originImage.isConnected) {
				originImage.style.visibility = originImageOriginalVisibility ?? '';
			}
			originImageOriginalVisibility = null;
		};
	});
</script>

<svelte:document onclick={handleDocumentClick} onkeydown={handleGlobalKeydown} />
<svelte:window onresize={handleResize} />

{#if isVisible && animatedRect}
	<div class="lightview-root" aria-hidden={!isOpen}>
		<button
			type="button"
			class="lightview-backdrop"
			class:is-active={backdropActive}
			onclick={closeLightview}
			aria-label="Închide previzualizarea imaginii"
		></button>

		<div class="lightview-stage">
			<img
				src={imageSrc}
				alt={imageAlt}
				class="lightview-image"
				class:is-open={isOpen}
				style={`top:${animatedRect.top}px;left:${animatedRect.left}px;width:${animatedRect.width}px;height:${animatedRect.height}px;--lightview-corner:${getCornerRadius(animatedRect)}px;`}
			/>
		</div>

		<button
			type="button"
			class="lightview-close"
			class:is-active={controlsVisible}
			onclick={closeLightview}
			aria-label="Închide"
		>
			<X class="size-5" />
		</button>
	</div>
{/if}

<style>
	.lightview-root {
		position: fixed;
		inset: 0;
		z-index: 9998;
	}

	.lightview-stage {
		position: fixed;
		inset: 0;
		z-index: 1;
		pointer-events: none;
	}

	.lightview-backdrop {
		position: fixed;
		inset: 0;
		z-index: 0;
		border: 0;
		background: oklch(0.13 0.02 255 / 0.02);
		opacity: 0;
		backdrop-filter: blur(0px);
		transition:
			opacity 360ms cubic-bezier(0.22, 1, 0.36, 1),
			background-color 360ms cubic-bezier(0.22, 1, 0.36, 1),
			backdrop-filter 360ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	.lightview-backdrop.is-active {
		opacity: 1;
		background: oklch(0.13 0.02 255 / 0.52);
		backdrop-filter: blur(1.1px);
	}

	.lightview-image {
		position: fixed;
		z-index: 2;
		margin: 0;
		border-radius: var(--lightview-corner, 0.8rem) 0 var(--lightview-corner, 0.8rem) 0;
		object-fit: contain;
		transform-origin: center;
		transition:
			top 420ms cubic-bezier(0.22, 1, 0.36, 1),
			left 420ms cubic-bezier(0.22, 1, 0.36, 1),
			width 420ms cubic-bezier(0.22, 1, 0.36, 1),
			height 420ms cubic-bezier(0.22, 1, 0.36, 1),
			border-radius 360ms cubic-bezier(0.22, 1, 0.36, 1),
			box-shadow 360ms cubic-bezier(0.22, 1, 0.36, 1);
		box-shadow: 0 2px 14px oklch(0 0 0 / 0.22);
		will-change: top, left, width, height;
	}

	.lightview-image.is-open {
		border-radius: var(--lightview-corner, 0.8rem) 0 var(--lightview-corner, 0.8rem) 0;
		box-shadow:
			0 30px 90px -25px oklch(0 0 0 / 0.88),
			0 6px 32px -12px oklch(0 0 0 / 0.5);
	}

	.lightview-close {
		position: fixed;
		top: 1rem;
		right: 1rem;
		z-index: 3;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.35rem;
		height: 2.35rem;
		border-radius: 9999px;
		border: 1px solid oklch(1 0 0 / 0.28);
		background: oklch(0 0 0 / 0.38);
		color: white;
		opacity: 0;
		transform: translateY(-6px) scale(0.94);
		transition:
			opacity 220ms ease,
			transform 260ms cubic-bezier(0.22, 1, 0.36, 1),
			background-color 180ms ease;
	}

	.lightview-close.is-active {
		opacity: 1;
		transform: translateY(0) scale(1);
	}

	.lightview-close:hover {
		background: oklch(0 0 0 / 0.58);
	}
	.lightview-close:focus-visible {
		outline: 2px solid white;
		outline-offset: 2px;
	}
	@media (prefers-reduced-motion: reduce) {
		.lightview-backdrop,
		.lightview-image,
		.lightview-close {
			transition-duration: 1ms;
		}
	}
</style>
