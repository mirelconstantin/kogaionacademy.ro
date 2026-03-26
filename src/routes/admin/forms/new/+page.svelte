<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
</script>

<div class="mx-auto max-w-lg space-y-6">
	<h1 class="text-2xl font-semibold">Formular nou</h1>
	<form method="POST" use:enhance class="space-y-4">
		<div class="space-y-2">
			<Label for="key">Cheie stabilă (ex. contact, newsletter)</Label>
			<Input id="key" name="key" required class="rounded-none" placeholder="contact" />
		</div>
		<div class="space-y-2">
			<Label for="locale">Locale</Label>
			<Input id="locale" name="locale" class="rounded-none" value="ro" />
		</div>
		<div class="space-y-2">
			<Label for="title">Titlu admin</Label>
			<Input id="title" name="title" class="rounded-none" />
		</div>
		<Button type="submit" class="rounded-none">Creează draft</Button>
	</form>
</div>
