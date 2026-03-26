import { getLocale, localizeHref } from '$lib/paraglide/runtime';

type ContentRouteKey = 'home' | 'about' | 'programs' | 'mentors' | 'contact' | 'blog';
type LocaleCode = 'ro' | 'en';

const ROUTE_MAP: Record<ContentRouteKey, Record<LocaleCode, string>> = {
	home: { ro: '/', en: '/' },
	about: { ro: '/despre', en: '/about' },
	programs: { ro: '/programe', en: '/programs' },
	mentors: { ro: '/mentori', en: '/mentors' },
	contact: { ro: '/contact', en: '/contact' },
	blog: { ro: '/blog', en: '/blog' }
};

function normalizeToCanonical(pathname: string): string {
	if (pathname === '/despre' || pathname.startsWith('/despre/')) {
		return pathname.replace('/despre', '/about');
	}
	if (pathname === '/programe' || pathname.startsWith('/programe/')) {
		return pathname.replace('/programe', '/programs');
	}
	if (pathname === '/mentori' || pathname.startsWith('/mentori/')) {
		return pathname.replace('/mentori', '/mentors');
	}
	return pathname;
}

function canonicalToLocalePath(pathname: string, locale: LocaleCode): string {
	if (locale === 'ro') {
		if (pathname === '/about' || pathname.startsWith('/about/'))
			return pathname.replace('/about', '/despre');
		if (pathname === '/programs' || pathname.startsWith('/programs/'))
			return pathname.replace('/programs', '/programe');
		if (pathname === '/mentors' || pathname.startsWith('/mentors/'))
			return pathname.replace('/mentors', '/mentori');
	}
	return pathname;
}

export function contentHref(route: ContentRouteKey): string {
	const locale = getLocale() as LocaleCode;
	return localizeHref(ROUTE_MAP[route][locale]);
}

export function localizedPathForSwitch(pathname: string, targetLocale: string): string {
	const locale = (targetLocale === 'ro' ? 'ro' : 'en') as LocaleCode;
	const canonical = normalizeToCanonical(pathname);
	const localized = canonicalToLocalePath(canonical, locale);
	return localizeHref(localized, { locale });
}
