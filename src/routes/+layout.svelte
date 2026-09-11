<script lang="ts">
	import '../app.css';
	import { Code, Moon, Sun } from '@lucide/svelte';
	import { setTheme } from '$lib/theme';

	let { children } = $props();

	let isDark = $state(false);

	$effect(() => {
		isDark = document.documentElement.classList.contains('dark');
	});

	function toggleTheme() {
		isDark = !isDark;
		setTheme(isDark ? 'dark' : 'light');
	}
</script>

<div class="flex min-h-screen flex-col">
	<header class="mx-auto flex w-full max-w-2xl items-center justify-between px-4 pt-6">
		<span class="text-sm font-semibold tracking-tight lowercase">anotherconverter</span>
		<div class="flex items-center gap-1">
			<button
				type="button"
				onclick={toggleTheme}
				aria-label="Toggle theme"
				class="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
			>
				{#if isDark}
					<Sun class="h-4 w-4" />
				{:else}
					<Moon class="h-4 w-4" />
				{/if}
			</button>
			<a
				href="https://github.com/knueppelholtz/anotherconverter"
				target="_blank"
				rel="noreferrer"
				class="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
			>
				<Code class="h-4 w-4" />
				Source
			</a>
		</div>
	</header>

	<div class="flex-1">
		{@render children()}
	</div>
</div>

<footer
	class="mx-auto flex w-full max-w-2xl flex-wrap items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground"
>
	<p>No uploads. No accounts. Open source.</p>
	<nav class="flex items-center gap-4">
		<a href="/imprint" class="hover:text-foreground">Imprint</a>
		<a href="/privacy" class="hover:text-foreground">Privacy</a>
	</nav>
</footer>
