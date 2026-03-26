<script lang="ts">
	import ProgramDetailPage from '../../programs/[slug]/+page.svelte';
	import type { ProgramForDisplay, MentorForDisplay } from '$lib/server/content';
	import type { ProgramCategory } from '$lib/programs-data';

	let {
		data
	}: {
		data: {
			program: ProgramForDisplay;
			programCategories: ProgramCategory[];
			mentors?: MentorForDisplay[];
			isEditor?: boolean;
		};
	} = $props();
</script>

<ProgramDetailPage {data} />
