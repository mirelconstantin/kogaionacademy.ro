<script lang="ts">
	import MentorsPage from '../mentors/+page.svelte';
	import type { MentorForDisplay } from '../mentors/+page.server';

	let { data }: { data: { mentors: MentorForDisplay[] } } = $props();
</script>

<MentorsPage {data} />
