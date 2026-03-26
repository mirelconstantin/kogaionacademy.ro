<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { toastFromAction, toastFromActionWithMessage } from '$lib/client';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { Avatar } from '$lib/components/ui/avatar';
	import UserPlus from '@lucide/svelte/icons/user-plus';
	import Mail from '@lucide/svelte/icons/mail';
	import type { ActionData, PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let inviteEmail = $state('');
	let inviteRole = $state('blog_editor');

	const pendingInvites = $derived(data.invites.filter((i) => i.effectiveStatus === 'pending'));
	const permissions = $derived((data as { permissions?: string[] }).permissions ?? []);
	const isCurrentUserSuperAdmin = $derived((data as { isCurrentUserSuperAdmin?: boolean }).isCurrentUserSuperAdmin === true);
	const canInvite = $derived(permissions.includes('team.invite') && isCurrentUserSuperAdmin);
	const canEditRoles = $derived(permissions.includes('team.edit_roles') && isCurrentUserSuperAdmin);
</script>

<div class="space-y-8">
	<header class="border-b border-border pb-6">
		<h2 class="text-2xl font-semibold text-foreground">Echipa</h2>
		<p class="mt-1 text-muted-foreground">
			Utilizatori cu acces la panoul de administrare, invitații și permisiuni.
		</p>
	</header>

	<section class="space-y-4">
		<h3 class="text-lg font-medium text-foreground">Utilizatori existenți</h3>
		<div class="rounded-none border border-border bg-card">
			<ul class="divide-y divide-border">
				{#each data.adminUsers as u (u.id)}
					<li class="flex flex-wrap items-center gap-4 px-4 py-3">
						<Avatar
							src={u.image ?? undefined}
							fallback={(u.name ?? u.email ?? '?').slice(0, 2).toUpperCase()}
							class="size-10 rounded-none"
						/>
						<div class="min-w-0 flex-1">
							<p class="font-medium text-foreground">{u.name ?? u.email}</p>
							<p class="text-sm text-muted-foreground">{u.email}</p>
						</div>
						<div class="flex items-center gap-2">
							{#if canEditRoles && u.email !== 'pazalgroup@gmail.com'}
								<form
									method="POST"
									action="?/updateUserRole"
									use:enhance={() => async ({ result: r }) => {
										if (r.type === 'success' || r.type === 'failure') toastFromAction(r.data as ActionData);
										if (r.type === 'success') await invalidateAll();
									}}
									class="inline-flex items-center gap-1"
									id={"role-form-" + u.id}
								>
									<input type="hidden" name="userId" value={u.id} />
									<input type="hidden" name="role" value={u.role ?? 'user'} />
									<Select.Root
										type="single"
										value={u.role ?? 'user'}
										onValueChange={(v: string | undefined) => {
											if (!v) return;
											const form = document.getElementById('role-form-' + u.id) as HTMLFormElement | null;
											const roleInput = form?.elements.namedItem('role') as HTMLInputElement | null;
											if (!form || !roleInput) return;
											roleInput.value = v;
											form.requestSubmit();
										}}
									>
										<Select.Trigger class="h-8 w-[190px] rounded-none text-sm">
											{data.roleOptions.find((opt) => opt.value === (u.role ?? 'user'))?.label ??
												(u.role ?? 'user')}
										</Select.Trigger>
										<Select.Content>
											{#each data.roleOptions as opt (opt.value)}
												<Select.Item value={opt.value} label={opt.label}>
													{opt.label}
												</Select.Item>
											{/each}
										</Select.Content>
									</Select.Root>
								</form>
							{:else}
								<span
									class="rounded-none border border-border bg-muted/50 px-2 py-1 text-xs font-medium text-foreground"
								>
									{data.roleOptions.find((opt) => opt.value === (u.role ?? 'user'))?.label ??
										(u.role ?? 'user')}
								</span>
							{/if}
						</div>
						{#if (data.overridesByUser[u.id] ?? []).length > 0}
							<p class="text-xs text-muted-foreground">
								Override: {(data.overridesByUser[u.id] ?? []).map((o) => `${o.permissionKey}:${o.mode}`).join(', ')}
							</p>
						{/if}
					</li>
				{/each}
			</ul>
		</div>
	</section>

	<section class="space-y-4">
		<div class="flex items-center justify-between">
			<h3 class="text-lg font-medium text-foreground">Invitații</h3>
			{#if canInvite}
				<form
					method="POST"
					action="?/invite"
					use:enhance={() => async ({ result: r }) => {
						if (r.type === 'success' || r.type === 'failure') toastFromActionWithMessage(r.data as ActionData, 'Invitație creată.');
						if (r.type === 'success' && r.data && (r.data as { success?: boolean }).success) {
							inviteEmail = '';
							await invalidateAll();
						}
					}}
					class="flex flex-wrap items-end gap-2"
				>
					<div class="space-y-1">
						<Label for="invite-email" class="sr-only">Email</Label>
						<Input
							id="invite-email"
							name="email"
							type="email"
							class="w-56 rounded-none"
							placeholder="email@example.com"
							bind:value={inviteEmail}
							required
						/>
					</div>
					<div class="space-y-1">
						<Label for="invite-role" class="sr-only">Rol</Label>
						<input type="hidden" name="role" value={inviteRole} />
						<Select.Root type="single" bind:value={inviteRole}>
							<Select.Trigger id="invite-role" class="h-9 w-[210px] rounded-none text-sm">
								{data.roleOptions.find((opt) => opt.value === inviteRole)?.label ?? 'Selectează rol'}
							</Select.Trigger>
							<Select.Content>
								{#each data.roleOptions as opt (opt.value)}
									<Select.Item value={opt.value} label={opt.label}>
										{opt.label}
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
					<Button type="submit" class="rounded-none">
						<UserPlus class="mr-1 size-4" />
						Invită
					</Button>
				</form>
			{/if}
		</div>
		<div class="rounded-none border border-border bg-card">
			<ul class="divide-y divide-border">
				{#each data.invites as inv (inv.id)}
					<li class="flex flex-wrap items-center gap-4 px-4 py-3">
						<Mail class="size-5 text-muted-foreground" />
						<div class="min-w-0 flex-1">
							<p class="font-medium text-foreground">{inv.email}</p>
							<p class="text-sm text-muted-foreground">
								Rol: {data.roleOptions.find((opt) => opt.value === inv.role)?.label ?? inv.role} · {inv.effectiveStatus} · expiră {new Date(inv.expiresAt).toLocaleDateString()}
							</p>
						</div>
						{#if inv.effectiveStatus === 'pending'}
							<form
								method="POST"
								action="?/resendInvite"
								use:enhance={() => async ({ result: r }) => {
									const payload = (r.type === 'success' || r.type === 'failure') ? (r.data as ActionData) : null;
									if (payload) toastFromActionWithMessage(payload, 'Invitație prelungită.');
									if (r.type === 'success') await invalidateAll();
								}}
								class="inline"
							>
								<input type="hidden" name="id" value={inv.id} />
								<Button type="submit" variant="outline" size="sm" class="rounded-none">Prelungește</Button>
							</form>
							<form
								method="POST"
								action="?/revokeInvite"
								use:enhance={() => async ({ result: r }) => {
									if (r.type === 'success' || r.type === 'failure') toastFromActionWithMessage(r.data as ActionData, 'Invitație revocată.');
									if (r.type === 'success') await invalidateAll();
								}}
								class="inline"
							>
								<input type="hidden" name="id" value={inv.id} />
								<Button type="submit" variant="outline" size="sm" class="rounded-none text-destructive">
									Revocă
								</Button>
							</form>
						{/if}
					</li>
				{/each}
			</ul>
			{#if data.invites.length === 0}
				<p class="px-4 py-6 text-center text-sm text-muted-foreground">Nicio invitație.</p>
			{/if}
		</div>
	</section>

	<section class="rounded-none border border-border bg-muted/30 p-4">
		<h3 class="text-lg font-medium text-foreground">Roluri predefinite</h3>
		<ul class="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
			<li><strong class="text-foreground">Super Admin</strong> — toate permisiunile</li>
			<li><strong class="text-foreground">Admin</strong> — pagini, programe, mentori, blog, media, setări, istoric</li>
			<li><strong class="text-foreground">Page Editor</strong> — pagini, programe, mentori, media (fără blog/setări)</li>
			<li><strong class="text-foreground">Blog Editor</strong> — doar blog și media</li>
		</ul>
		<p class="mt-2 text-xs text-muted-foreground">
			Override-urile per utilizator adaugă (allow) sau scad (deny) permisiuni din rol.
		</p>
	</section>
</div>
