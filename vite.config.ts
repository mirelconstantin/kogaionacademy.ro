import { paraglideVitePlugin } from '@inlang/paraglide-js';
import devtoolsJson from 'vite-plugin-devtools-json';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	ssr: {
		// lowlight is pure ESM with named exports; without noExternal, SSR can resolve a stub and throw
		// "does not provide an export named 'createLowlight'" (e.g. on /admin/legal via Edra editor).
		noExternal: ['@lucide/svelte', 'lowlight']
	},
	plugins: [
		tailwindcss(),
		sveltekit(),
		devtoolsJson(),
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide',
			// RO-only public site: ignore cookie / localStorage so EN is never picked by mistake.
			strategy: ['baseLocale']
		})
	]
});
