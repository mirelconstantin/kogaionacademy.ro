import prettier from 'eslint-config-prettier';
import path from 'node:path';
import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

const gitignorePath = path.resolve(import.meta.dirname, '.gitignore');

export default defineConfig(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs.recommended,
	prettier,
	...svelte.configs.prettier,
	{
		languageOptions: { globals: { ...globals.browser, ...globals.node } },
		rules: {
			// typescript-eslint strongly recommend that you do not use the no-undef lint rule on TypeScript projects.
			// see: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
			'no-undef': 'off'
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser,
				svelteConfig
			}
		}
	},
	{
		// =====================================================================
		// Rules whose setting is specific to THIS project.
		//
		// Each one is set for a reason that is checkable, not because it was
		// noisy. If the reason stops holding, change the setting back.
		// =====================================================================
		rules: {
			// OFF. The rule protects a configured `paths.base`, and this project has
			// none -- svelte.config.js is `kit: { adapter: adapter() }` with no base, so
			// resolve('/x') returns '/x' and the rule guards nothing at all.
			//
			// It fired 104 times. 85 were external URLs -- CMS content, OAuth callback
			// targets, policy links -- and hash fragments, where resolve() would be
			// actively wrong. The other 19 were plain internal hrefs, already correct.
			//
			// If the site is ever served from a subpath, set paths.base AND turn this
			// back on: that is precisely the breakage it would catch.
			'svelte/no-navigation-without-resolve': 'off',

			// A leading underscore means "deliberately unused" and nothing else. Without
			// this, every `catch (_)` in the codebase is an error, which trains people to
			// delete the binding instead -- and `catch {}` reads as an accident.
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrors: 'all',
					caughtErrorsIgnorePattern: '^_',
					destructuredArrayIgnorePattern: '^_'
				}
			],

			// WARN, not off. This is a true positive that needs a decision from the
			// team rather than a lint fix.
			//
			// src/routes/blog/[slug]/+page.svelte renders the article body with
			// `{@html post.body}`, and that body is read straight from the database with
			// no sanitisation on the read path. The project HAS a sanitiser --
			// src/lib/server/markdown-safe.ts wraps marked + DOMPurify -- but it is wired
			// only to the consent banner, not to blog posts.
			//
			// So today a compromised editor account can store script that runs in every
			// visitor's browser. That is real, and it stays visible on purpose: the fix
			// has a content-compatibility cost -- DOMPurify strips iframes and inline
			// styles the Edra editor emits -- and that trade is the team's to make.
			'svelte/no-at-html-tags': 'warn'
		}
	},
	{
		// Scoped to the vendored editor ONLY, and deliberately not global.
		//
		// src/lib/components/edra/ is a copy of the `edra` npm package targeting an
		// older Tiptap API than the one installed, so nine of its files carry
		// `// @ts-nocheck` with a comment explaining the vendoring. The rule objects
		// on principle, not on substance -- each pragma is on a file that is not
		// application code.
		//
		// The boundary is what matters and it is enforced by the pragmas themselves,
		// not by this rule: EdraFormField.svelte and EdraTooltipContent.svelte are
		// consumed by /admin/blog and /admin/legal and carry NO pragma, so the
		// integration seam stays type-checked by `bun run check`.
		//
		// Turning this rule off globally would be a real regression: `@ts-ignore` and
		// bare `@ts-expect-error` can hide anything. Hence `files`, not a global setting.
		files: ['src/lib/components/edra/**/*.ts'],
		rules: {
			'@typescript-eslint/ban-ts-comment': 'off'
		}
	}
);
