<script lang="ts">
	import gsap from 'gsap';
	import { UploadCloud } from '@lucide/svelte';
	import { isSupportedImage } from '$lib/converter/format-utils';

	let { onFiles }: { onFiles: (files: File[]) => void } = $props();

	const ACCEPTED_FORMATS = ['PNG', 'JPEG', 'WebP', 'AVIF', 'HEIC', 'SVG'];

	let zone = $state<HTMLDivElement | null>(null);
	let overlay = $state<HTMLDivElement | null>(null);
	let fileInput = $state<HTMLInputElement | null>(null);
	let isPageDragging = $state(false);
	let dragDepth = 0;

	$effect(() => {
		if (!overlay) return;
		gsap.to(overlay, {
			opacity: isPageDragging ? 1 : 0,
			duration: 0.2,
			ease: 'power1.out'
		});
	});

	function hasFiles(e: DragEvent) {
		return !!e.dataTransfer?.types.includes('Files');
	}

	function extractFiles(e: DragEvent) {
		return Array.from(e.dataTransfer?.files ?? []).filter(isSupportedImage);
	}

	function bounceZone() {
		if (!zone) return;
		gsap.fromTo(zone, { scale: 1.06 }, { scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.5)' });
	}

	function handleWindowDragEnter(e: DragEvent) {
		if (!hasFiles(e)) return;
		e.preventDefault();
		dragDepth++;
		isPageDragging = true;
	}

	function handleWindowDragOver(e: DragEvent) {
		if (!hasFiles(e)) return;
		e.preventDefault();
	}

	function handleWindowDragLeave(e: DragEvent) {
		if (!hasFiles(e)) return;
		dragDepth = Math.max(0, dragDepth - 1);
		if (dragDepth === 0) isPageDragging = false;
	}

	function handleWindowDrop(e: DragEvent) {
		if (!hasFiles(e)) return;
		e.preventDefault();
		dragDepth = 0;
		isPageDragging = false;
		const files = extractFiles(e);
		if (files.length) {
			bounceZone();
			onFiles(files);
		}
	}

	function handleSelect(e: Event) {
		const target = e.currentTarget as HTMLInputElement;
		const files = Array.from(target.files ?? []);
		if (files.length) onFiles(files);
		target.value = '';
	}
</script>

<svelte:window
	ondragenter={handleWindowDragEnter}
	ondragover={handleWindowDragOver}
	ondragleave={handleWindowDragLeave}
	ondrop={handleWindowDrop}
/>

{#if isPageDragging}
	<div
		bind:this={overlay}
		class="pointer-events-none fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 border-4 border-dashed border-primary bg-background/90 opacity-0 backdrop-blur-sm"
	>
		<UploadCloud class="h-16 w-16 text-primary" />
		<p class="text-xl font-semibold">Drop anywhere to convert</p>
	</div>
{/if}

<div
	bind:this={zone}
	role="button"
	tabindex="0"
	class="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border p-10 text-center transition-colors hover:border-muted-foreground"
	onclick={() => fileInput?.click()}
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			fileInput?.click();
		}
	}}
>
	<UploadCloud class="h-10 w-10 text-muted-foreground" />
	<div>
		<p class="font-medium">Drag & drop images here</p>
		<p class="text-sm text-muted-foreground">or click to browse, or drop anywhere on the page</p>
	</div>
	<p class="text-xs text-muted-foreground">Accepts {ACCEPTED_FORMATS.join(', ')}</p>
	<input
		bind:this={fileInput}
		type="file"
		accept="image/*,.heic,.heif,.svg"
		multiple
		class="hidden"
		onchange={handleSelect}
	/>
</div>
