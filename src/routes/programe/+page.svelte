<script lang="ts">
	import ProgramsPage from '../programs/+page.svelte';

	let {
		data
	}: {
		data: {
			programs: import('$lib/server/content').ProgramForDisplay[];
			programCategories: import('$lib/programs-data').ProgramCategory[];
			activeAgeFilter?: string | null;
			canonicalUrl?: string;
			baseUrl?: string;
			sections?: Record<string, Record<string, unknown>>;
		};
	} = $props();
</script>

<ProgramsPage {data} />
