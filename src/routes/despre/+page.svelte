<script lang="ts">
	import AboutPage from '../about/+page.svelte';

	let { data } = $props();
</script>

<AboutPage {data} />
