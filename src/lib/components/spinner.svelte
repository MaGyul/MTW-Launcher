<script lang="ts">
	import { _ } from 'svelte-i18n';
	export let width: string;
	export let height: string;
	export let color: string;
	export let cursor: Cursor;
	export let state: 'LOADING' | 'SUCCESS' | 'ERROR' = 'LOADING';
	export let style: string = '';
</script>

<div
	class="stateful-spinner"
	data-state={state}
	style="width: {width};height: {height};cursor: {cursor};--spinner: {color};{style}"
>
	<div class="stateful-spinner-spacer">
		<svg viewBox="0 0 50 50">
			<circle class="outline" cx="25" cy="25" r="20" fill="none" stroke-width="5" />
			<circle class="effect1" cx="25" cy="25" r="22" fill="none" />
			<circle class="background" cx="25" cy="25" r="22" fill="none" />
			<path
				class="checkpath"
				stroke-linecap="round"
				stroke-linejoin="miter"
				fill-opacity="0"
				stroke-miterlimit="4"
				transform="scale(0.1) translate(250 250)"
			/>
		</svg>
	</div>
</div>

<style lang="scss">
	.stateful-spinner {
		position: relative;
		top: 0;
		left: 0;
	}
</style>
