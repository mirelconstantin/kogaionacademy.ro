<script lang="ts">
	import Instagram from '@lucide/svelte/icons/instagram';
	import Facebook from '@lucide/svelte/icons/facebook';
	import Linkedin from '@lucide/svelte/icons/linkedin';
	import Youtube from '@lucide/svelte/icons/youtube';
	import Twitter from '@lucide/svelte/icons/twitter';
	import Globe from '@lucide/svelte/icons/globe';
	import * as Tooltip from '$lib/components/ui/tooltip';

	const ICON_MAP: Record<
		string,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(typeof Instagram) | null
	> = {
		instagram: Instagram,
		facebook: Facebook,
		linkedin: Linkedin,
		youtube: Youtube,
		twitter: Twitter,
		x: Twitter,
		tiktok: null
	};

	const LABELS: Record<string, string> = {
		instagram: 'Instagram',
		facebook: 'Facebook',
		linkedin: 'LinkedIn',
		youtube: 'YouTube',
		twitter: 'X (Twitter)',
		x: 'X (Twitter)',
		tiktok: 'TikTok'
	};

	type Props = {
		socials: { name: string; url: string }[];
		variant?: 'default' | 'hero' | 'footer';
	};

	let { socials = [], variant = 'default' }: Props = $props();

	const linkClass = $derived(
		variant === 'hero'
			? 'btn-diagonal inline-flex size-10 items-center justify-center border border-white bg-transparent text-white transition-colors hover:border-white hover:bg-[var(--brand-blue)] hover:text-white'
			: variant === 'footer'
				? 'btn-diagonal inline-flex size-10 items-center justify-center border border-white bg-transparent text-white transition-colors hover:border-white hover:bg-[var(--brand-blue)] hover:text-white'
				: 'btn-diagonal inline-flex size-10 items-center justify-center border border-[var(--brand-blue)] bg-transparent text-[var(--brand-blue)] transition-colors hover:border-[var(--brand-blue)] hover:bg-[var(--brand-blue)] hover:text-white'
	);
</script>

{#each socials as { name, url }}
	{@const key = name.toLowerCase().replace(/\s+/g, '')}
	{@const IconComponent = ICON_MAP[key] ?? Globe}
	{@const label = LABELS[key] ?? name}
	<Tooltip.Root>
		<Tooltip.Trigger>
			<a
				href={url}
				target="_blank"
				rel="noopener noreferrer"
				class={linkClass}
				aria-label={label}
			>
				{#if key === 'tiktok'}
					<svg class="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
						<path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z" />
					</svg>
				{:else}
					<IconComponent class="size-5" />
				{/if}
			</a>
		</Tooltip.Trigger>
		<Tooltip.Content>{label}</Tooltip.Content>
	</Tooltip.Root>
{/each}
