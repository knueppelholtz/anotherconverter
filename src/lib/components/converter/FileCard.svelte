<script lang="ts">
	import gsap from 'gsap';
	import { CheckCircle2, Download, Loader2, XCircle } from '@lucide/svelte';
	import { formatBytes } from '$lib/converter/format-utils';
	import type { ConvertItem } from '$lib/converter/types';

	let { item, index }: { item: ConvertItem; index: number } = $props();

	function enter(node: HTMLElement) {
		gsap.from(node, {
			opacity: 0,
			y: 16,
			duration: 0.45,
			delay: index * 0.06,
			ease: 'power3.out'
		});
	}

	function pop(node: HTMLElement) {
		gsap.fromTo(
			node,
			{ scale: 0, rotate: -30, opacity: 0 },
			{ scale: 1, rotate: 0, opacity: 1, duration: 0.5, ease: 'back.out(2)' }
		);
	}

	let savings = $derived(
		item.outputBlob ? Math.round((1 - item.outputBlob.size / item.file.size) * 100) : null
	);

	let outputExt = $derived(item.outputName?.split('.').pop()?.toUpperCase() ?? '');
</script>

<div use:enter class="flex items-center gap-4 rounded-xl border border-border bg-card p-3">
	<img src={item.previewUrl} alt={item.file.name} class="h-14 w-14 rounded-lg object-cover" />
	<div class="min-w-0 flex-1">
		<p class="truncate text-sm font-medium">{item.file.name}</p>
		<p class="text-xs text-muted-foreground">
			{formatBytes(item.file.size)}
			{#if item.outputBlob}
				→ {formatBytes(item.outputBlob.size)}
				<span class={(savings ?? 0) >= 0 ? 'text-green-600' : 'text-orange-600'}>
					({(savings ?? 0) >= 0 ? '-' : '+'}{Math.abs(savings ?? 0)}%)
				</span>
			{/if}
		</p>
	</div>

	{#if item.status === 'converting'}
		<Loader2 class="h-5 w-5 animate-spin text-muted-foreground" />
	{:else if item.status === 'error'}
		<span title={item.error}>
			<XCircle class="h-5 w-5 text-destructive" />
		</span>
	{:else if item.status === 'done' && item.outputUrl}
		<div use:pop class="flex items-center gap-2">
			<CheckCircle2 class="h-5 w-5 text-green-600" />
			<a
				href={item.outputUrl}
				download={item.outputName}
				class="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-all hover:scale-105 hover:brightness-110 active:scale-95"
			>
				<Download class="h-3.5 w-3.5" />
				Download {outputExt}
			</a>
		</div>
	{/if}
</div>
