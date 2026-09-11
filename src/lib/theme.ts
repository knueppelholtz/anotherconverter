export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';

export function setTheme(theme: Theme) {
	document.documentElement.classList.toggle('dark', theme === 'dark');
	try {
		localStorage.setItem(STORAGE_KEY, theme);
	} catch {
		// storage disabled (e.g. private browsing) — theme just won't persist
	}
}
