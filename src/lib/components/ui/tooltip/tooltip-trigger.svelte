<script lang="ts">
	import { Tooltip as TooltipPrimitive } from "bits-ui";

	let {
		ref = $bindable(null),
		child,
		...restProps
	}: TooltipPrimitive.TriggerProps & {
		child?: import('svelte').Snippet<[{ props: Record<string, unknown> }]>;
	} = $props();
</script>

<TooltipPrimitive.Trigger bind:ref data-slot="tooltip-trigger" {child} {...restProps} />
