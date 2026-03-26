<script lang="ts">
	import { enhance } from '$app/forms';
	import EdraFormField from '$lib/components/edra/EdraFormField.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	let { data, form } = $props();

	const emptyPolicies = () => ({
		operatorLegalName: '',
		operatorAddress: '',
		operatorEmail: '',
		dpoEmail: '',
		cookiePolicyMarkdown: '',
		privacyPolicyMarkdown: '',
		termsMarkdown: '',
		consentBannerTitle: '',
		consentBannerBodyMarkdown: '',
		cookiePolicyLastUpdatedNote: '',
		privacyPolicyLastUpdatedNote: '',
		termsLastUpdatedNote: ''
	});

	const policies = $derived.by(() => ({ ...emptyPolicies(), ...data.policies }));
</script>

<div class="space-y-8">
	<header class="border-b border-border pb-6">
		<h1 class="text-2xl font-semibold tracking-tight">Politici & GDPR</h1>
		<p class="mt-2 max-w-3xl text-sm text-muted-foreground">
			Textele de mai jos alimentează paginile publice
			<a class="underline" href="/politica-cookie-uri">/politica-cookie-uri</a>
			,
			<a class="underline" href="/politica-de-confidentialitate">/politica-de-confidentialitate</a>
			și
			<a class="underline" href="/termeni-si-conditii">/termeni-si-conditii</a>. Bannerul de consimțământ de pe site nu se
			editează aici deocamdată. Pentru textele lungi folosești editorul <strong>Edra</strong> (toolbar implicit), cu titluri
			afișate ca pe paginile publice; câmpurile esențiale rămân separate mai jos.
		</p>
		{#if data.contactHints.email}
			<p class="mt-2 text-xs text-muted-foreground">
				Indiciu din contact (RO): {data.contactHints.email} · {data.contactHints.address}
			</p>
		{/if}
	</header>

	{#if form?.message}
		<p class="text-sm text-destructive">{form.message}</p>
	{:else if form?.ok}
		<p class="text-sm text-green-700 dark:text-green-400">
			{form?.reset ? 'S-a revenit la șabloanele implicite.' : 'Salvat.'}
		</p>
	{/if}

	<form method="POST" action="?/save" use:enhance class="space-y-8">
		<section class="space-y-4 border border-border bg-card p-4">
			<h2 class="text-lg font-medium">Date operator</h2>
			<div class="grid gap-4 sm:grid-cols-2">
				<div class="space-y-2 sm:col-span-2">
					<Label for="operatorLegalName">Denumire</Label>
					<Input id="operatorLegalName" name="operatorLegalName" class="rounded-none" value={policies.operatorLegalName} />
				</div>
				<div class="space-y-2 sm:col-span-2">
					<Label for="operatorAddress">Adresă</Label>
					<Input id="operatorAddress" name="operatorAddress" class="rounded-none" value={policies.operatorAddress} />
				</div>
				<div class="space-y-2">
					<Label for="operatorEmail">Email contact</Label>
					<Input id="operatorEmail" name="operatorEmail" type="email" class="rounded-none" value={policies.operatorEmail} />
				</div>
				<div class="space-y-2">
					<Label for="dpoEmail">Email protecția datelor / DPO</Label>
					<Input id="dpoEmail" name="dpoEmail" type="email" class="rounded-none" value={policies.dpoEmail} />
				</div>
			</div>
		</section>

		<section class="space-y-4 border border-border bg-card p-4">
			<h2 class="text-lg font-medium">Politica de cookie-uri</h2>
			<div class="space-y-2">
				<Label for="cookiePolicyLastUpdatedNote">Ultima actualizare (afișată pe pagina politicii)</Label>
				<Input
					id="cookiePolicyLastUpdatedNote"
					name="cookiePolicyLastUpdatedNote"
					class="rounded-none"
					placeholder="ex. Martie 2026"
					value={policies.cookiePolicyLastUpdatedNote}
				/>
			</div>
			<EdraFormField proseVariant="legal" name="cookiePolicyMarkdown" value={policies.cookiePolicyMarkdown} placeholder="Scrie politica de cookie-uri..." />
		</section>

		<section class="space-y-4 border border-border bg-card p-4">
			<h2 class="text-lg font-medium">Politica de confidențialitate</h2>
			<div class="space-y-2">
				<Label for="privacyPolicyLastUpdatedNote">Ultima actualizare (afișată pe pagina politicii)</Label>
				<Input
					id="privacyPolicyLastUpdatedNote"
					name="privacyPolicyLastUpdatedNote"
					class="rounded-none"
					placeholder="ex. Martie 2026"
					value={policies.privacyPolicyLastUpdatedNote}
				/>
			</div>
			<EdraFormField
				proseVariant="legal"
				name="privacyPolicyMarkdown"
				value={policies.privacyPolicyMarkdown}
				placeholder="Scrie politica de confidențialitate..."
			/>
		</section>

		<section class="space-y-4 border border-border bg-card p-4">
			<h2 class="text-lg font-medium">Termeni și condiții</h2>
			<div class="space-y-2">
				<Label for="termsLastUpdatedNote">Ultima actualizare (afișată pe pagina politicii)</Label>
				<Input
					id="termsLastUpdatedNote"
					name="termsLastUpdatedNote"
					class="rounded-none"
					placeholder="ex. Martie 2026"
					value={policies.termsLastUpdatedNote}
				/>
			</div>
			<EdraFormField
				proseVariant="legal"
				name="termsMarkdown"
				value={policies.termsMarkdown}
				placeholder="Scrie termenii și condițiile..."
			/>
		</section>

		<div class="flex flex-wrap gap-2">
			<Button type="submit" class="rounded-none">Salvează</Button>
		</div>
	</form>

	<form
		method="POST"
		action="?/resetDefaults"
		use:enhance
		class="border border-dashed border-border p-4"
		onsubmit={(e) => {
			if (!confirm('Ștergi conținutul curent și revii la șabloanele implicite?')) e.preventDefault();
		}}
	>
		<p class="text-sm text-muted-foreground">
			Resetează toate câmpurile la șabloanele implicite (suprascrie conținutul curent).
		</p>
		<Button type="submit" variant="destructive" class="mt-3 rounded-none">Reset șabloane</Button>
	</form>
</div>
