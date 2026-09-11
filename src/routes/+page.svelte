<script lang="ts">
	import gsap from 'gsap';
	import JSZip from 'jszip';
	import { Code, Download, Infinity, Link2, Lock, Trash2 } from '@lucide/svelte';
	import Dropzone from '$lib/components/converter/Dropzone.svelte';
	import FileCard from '$lib/components/converter/FileCard.svelte';
	import {
		FORMAT_OPTIONS,
		convertImage,
		outputFileName,
		type OutputFormat
	} from '$lib/converter/format-utils';
	import type { ConvertItem } from '$lib/converter/types';

	let items = $state<ConvertItem[]>([]);
	let format = $state<OutputFormat>('image/webp');
	let quality = $state(0.8);
	let heroRef = $state<HTMLElement | null>(null);

	const currentFormat = $derived(FORMAT_OPTIONS.find((f) => f.value === format)!);
	const doneCount = $derived(items.filter((i) => i.status === 'done').length);

	$effect(() => {
		if (heroRef) gsap.from(heroRef, { opacity: 0, y: -12, duration: 0.5, ease: 'power2.out' });
	});

	async function convertItem(item: ConvertItem) {
		item.status = 'converting';
		try {
			const blob = await convertImage(item.file, format, quality);
			if (item.outputUrl) URL.revokeObjectURL(item.outputUrl);
			item.outputBlob = blob;
			item.outputUrl = URL.createObjectURL(blob);
			item.outputName = outputFileName(item.file.name, currentFormat.ext);
			item.status = 'done';
		} catch (err) {
			item.status = 'error';
			item.error = err instanceof Error ? err.message : 'Unknown error';
		}
	}

	function addFiles(files: File[]) {
		const ids = files.map(() => crypto.randomUUID());
		const newItems: ConvertItem[] = files.map((file, i) => ({
			id: ids[i],
			file,
			previewUrl: URL.createObjectURL(file),
			status: 'pending'
		}));
		items = [...items, ...newItems];
		// convert via the reactive items array, not the plain objects above —
		// mutating those directly bypasses Svelte's proxy and never updates the UI
		for (const id of ids) {
			const item = items.find((i) => i.id === id);
			if (item) convertItem(item);
		}
	}

	function reconvertAll() {
		for (const item of items) convertItem(item);
	}

	function removeItem(id: string) {
		const item = items.find((i) => i.id === id);
		if (item) {
			URL.revokeObjectURL(item.previewUrl);
			if (item.outputUrl) URL.revokeObjectURL(item.outputUrl);
		}
		items = items.filter((i) => i.id !== id);
	}

	function clearAll() {
		for (const item of items) {
			URL.revokeObjectURL(item.previewUrl);
			if (item.outputUrl) URL.revokeObjectURL(item.outputUrl);
		}
		items = [];
	}

	async function downloadAll() {
		const zip = new JSZip();
		for (const item of items) {
			if (item.status === 'done' && item.outputBlob && item.outputName) {
				zip.file(item.outputName, item.outputBlob);
			}
		}
		const blob = await zip.generateAsync({ type: 'blob' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'converted-images.zip';
		a.click();
		URL.revokeObjectURL(url);
	}

	function selectFormat(value: OutputFormat) {
		if (format === value) return;
		format = value;
		reconvertAll();
	}
</script>

<svelte:head>
	<title>anotherconverter.com — yes, another one</title>
	<meta
		name="description"
		content="A fast, local, open-source image converter. No uploads, no accounts. We know — another converter."
	/>
	<meta property="og:title" content="anotherconverter.com — yes, another one" />
	<meta
		property="og:description"
		content="A fast, local, open-source image converter. No uploads, no accounts."
	/>
	<meta name="twitter:card" content="summary" />
</svelte:head>

<main class="mx-auto flex max-w-2xl flex-col gap-6 p-4">
	<div class="flex min-h-screen flex-col gap-6 py-10 md:py-16">
		<div bind:this={heroRef} class="flex flex-col items-center gap-2 text-center">
			<h1 class="text-3xl font-semibold tracking-tight">Convert images. Instantly.</h1>
			<p class="text-muted-foreground">
				Yes, another converter. This one just doesn't touch your files.
			</p>
		</div>

		<Dropzone onFiles={addFiles} />

		<div
			class="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4"
		>
			<div class="flex flex-wrap items-center gap-2">
				<span class="text-sm text-muted-foreground">Output format</span>
				<div class="flex flex-wrap gap-1.5">
					{#each FORMAT_OPTIONS as opt (opt.value)}
						<button
							type="button"
							class={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
								format === opt.value
									? 'border-primary bg-primary text-primary-foreground'
									: 'border-border bg-transparent hover:bg-accent'
							}`}
							onclick={() => selectFormat(opt.value)}
						>
							{opt.label}
						</button>
					{/each}
				</div>
			</div>

			{#if currentFormat.lossy}
				<div class="flex items-center gap-2">
					<span class="text-sm text-muted-foreground">Quality</span>
					<input
						type="range"
						min="0.1"
						max="1"
						step="0.05"
						bind:value={quality}
						onchange={reconvertAll}
						class="w-32 accent-primary"
					/>
					<span class="w-10 text-sm tabular-nums">{Math.round(quality * 100)}%</span>
				</div>
			{/if}
		</div>

		{#if items.length}
			<div class="flex flex-col gap-3">
				{#each items as item, i (item.id)}
					<div class="group relative">
						<FileCard {item} index={i} />
						<button
							type="button"
							class="absolute -top-2 -right-2 hidden h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-destructive text-white transition-all group-hover:flex hover:scale-110 hover:brightness-110 active:scale-90"
							onclick={() => removeItem(item.id)}
							aria-label="Remove"
						>
							<Trash2 class="h-3.5 w-3.5 text-white" />
						</button>
					</div>
				{/each}
			</div>

			<div class="flex items-center justify-between">
				<button
					type="button"
					class="cursor-pointer text-sm text-muted-foreground hover:text-foreground"
					onclick={clearAll}
				>
					Remove all
				</button>
				{#if doneCount > 1}
					<button
						type="button"
						class="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:scale-105 hover:brightness-110 active:scale-95"
						onclick={downloadAll}
					>
						<Download class="h-4 w-4" />
						Download all as ZIP ({doneCount})
					</button>
				{/if}
			</div>
		{/if}
	</div>

	<section class="grid grid-cols-1 gap-4 border-t border-border pt-8 sm:grid-cols-3">
		<div class="flex flex-col gap-2 rounded-xl border border-border bg-card p-5">
			<Lock class="h-5 w-5 text-muted-foreground" />
			<h3 class="font-medium">100% local</h3>
			<p class="text-sm text-muted-foreground">
				Your files never leave your browser. No uploads, ever.
			</p>
		</div>
		<div class="flex flex-col gap-2 rounded-xl border border-border bg-card p-5">
			<Infinity class="h-5 w-5 text-muted-foreground" />
			<h3 class="font-medium">No accounts, no limits</h3>
			<p class="text-sm text-muted-foreground">No signup, no email, no daily cap. Just convert.</p>
		</div>
		<div class="flex flex-col gap-2 rounded-xl border border-border bg-card p-5">
			<Code class="h-5 w-5 text-muted-foreground" />
			<h3 class="font-medium">Open source</h3>
			<p class="text-sm text-muted-foreground">Don't trust us, check the code yourself.</p>
		</div>
	</section>

	<a
		href="https://lienks.com"
		target="_blank"
		rel="noreferrer"
		class="flex flex-col gap-2 rounded-xl border border-border bg-card p-5 transition-colors hover:bg-accent"
	>
		<p class="text-xs text-muted-foreground">Also by me</p>
		<div class="flex items-center gap-2">
			<Link2 class="h-5 w-5 text-muted-foreground" />
			<h3 class="font-medium">lienks.com</h3>
		</div>
		<p class="text-sm text-muted-foreground">Simple, privacy-friendly analytics for your website.</p>
	</a>
</main>
