<script lang="ts">
	import { page } from '$app/state';
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import Plus from '@lucide/svelte/icons/plus';
	import Pencil from '@lucide/svelte/icons/pencil';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import FileText from '@lucide/svelte/icons/file-text';
	import History from '@lucide/svelte/icons/history';
	import Trash2 from '@lucide/svelte/icons/trash-2';

	let { data }: { data: { posts: { id: number; slug: string; title: string; status: string; publishedAt: Date | null; scheduledFor: Date | null; createdAt: Date }[] } } = $props();

	const base = $derived(page.url.pathname);

	function statusLabel(s: string) {
		return s === 'published' ? 'Publicat' : s === 'scheduled' ? 'Programat' : 'Ciornă';
	}

	function statusClass(s: string) {
		return s === 'published'
			? 'bg-primary/12 text-primary border-primary/25'
			: s === 'scheduled'
				? 'bg-amber-500/12 text-amber-700 border-amber-500/25 dark:text-amber-400'
				: 'bg-muted text-muted-foreground border-border';
	}

	const canViewOnSite = (s: string) => s === 'published';
</script>

<div>
	<div class="flex flex-wrap items-center justify-between gap-4">
		<div>
			<div class="flex flex-wrap items-center gap-2">
				<h2 class="text-2xl font-semibold text-foreground">Blog</h2>
				<Button href="/admin/history?context=blog" variant="outline" class="rounded-none" size="sm">
					<History class="size-4 shrink-0" aria-hidden="true" />
					Istoric modificări
				</Button>
			</div>
			<p class="mt-1 text-muted-foreground">
				Articole și știri. Doar articolele publicate apar pe site.
			</p>
		</div>
		<Button href="/admin/blog/new" class="gap-2 rounded-none">
			<Plus class="size-4" />
			Articol nou
		</Button>
	</div>

	<div class="mt-8">
		{#if data.posts.length === 0}
			<div
				class="flex flex-col items-center justify-center rounded-none border border-dashed border-border bg-card py-16 text-center"
			>
				<FileText class="size-12 text-muted-foreground/60" />
				<p class="mt-4 font-medium text-foreground">Niciun articol</p>
				<p class="mt-1 max-w-sm text-sm text-muted-foreground">
					Adaugă primul articol pentru a-l afișa pe pagina Blog.
				</p>
				<Button href="/admin/blog/new" class="mt-6 gap-2 rounded-none">
					<Plus class="size-4" />
					Articol nou
				</Button>
			</div>
		{:else}
			<ul class="space-y-2">
				{#each data.posts as post (post.id)}
					<li>
						<div
							class="flex flex-wrap items-center justify-between gap-4 rounded-none border border-border bg-card px-4 py-3 transition-colors hover:border-primary/30"
						>
							<a href="{base}/{post.id}" class="min-w-0 flex-1">
								<div class="flex flex-wrap items-center gap-2">
									<p class="font-medium text-foreground">{post.title}</p>
									<span
										class="inline-flex shrink-0 items-center rounded border px-2 py-0.5 text-xs font-medium {statusClass(post.status)}"
									>
										{statusLabel(post.status)}
									</span>
								</div>
								<p class="mt-0.5 text-sm text-muted-foreground">
									{#if post.publishedAt}
										{new Date(post.publishedAt).toLocaleDateString('ro-RO')}
									{:else if post.scheduledFor}
										Programat: {new Date(post.scheduledFor).toLocaleDateString('ro-RO')}
									{:else}
										Creat: {new Date(post.createdAt).toLocaleDateString('ro-RO')}
									{/if}
								</p>
							</a>
							<div class="flex shrink-0 items-center gap-1">
								{#if canViewOnSite(post.status)}
									<a
										href={"/blog/" + encodeURIComponent(post.slug)}
										target="_blank"
										rel="noopener noreferrer"
										class="inline-flex items-center gap-1 rounded-none border border-border bg-muted/40 px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
										title="Vezi pe site"
									>
										<ExternalLink class="size-3.5" />
										Vezi
									</a>
								{/if}
								<a
									href="{base}/{post.id}"
									class="inline-flex items-center gap-1 rounded-none border border-border bg-muted/40 px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
									title="Editează"
								>
									<Pencil class="size-3.5" />
									Editează
								</a>
								<form
									method="POST"
									action="{base}/{post.id}?/delete"
									use:enhance={({ cancel }) => {
										if (!confirm('Ștergi articolul „' + post.title + '”? Nu va mai apărea pe site.')) cancel();
									}}
									class="inline"
								>
									<button
										type="submit"
										class="inline-flex items-center gap-1 rounded-none border border-border bg-muted/40 px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-destructive"
										title="Șterge"
									>
										<Trash2 class="size-3.5" />
										Șterge
									</button>
								</form>
							</div>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>
