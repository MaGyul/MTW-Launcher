<script lang="ts">
	import { _ } from 'svelte-i18n';

	export let uuid: string;
	export let selected: boolean;
	export let name: string;
</script>

<div class="empty">
	<button class="listing" data-uuid={uuid} data-selected={String(selected)}>
		<img src="https://mc-heads.net/head/{uuid}/40" alt="player-head" />
		<div class="name">{name}</div>
	</button>
</div>

<style lang="scss">
	.listing {
		color: white;
		border: 1px solid rgba(126, 126, 126, 0.57);
		border-radius: 3px;
		padding: 5px 45px;
		width: 250px;
		display: flex;
		justify-content: flex-start;
		align-items: center;
		opacity: 0.6;
		transition: 0.25s ease;
		cursor: pointer;
		position: relative;
		background: rgba(0, 0, 0, 0.25);

		> .name {
			display: flex;
			height: 100%;
			width: 100%;
			padding-left: 10px;
		}

		&:not(:first-child):not(:last-child) {
			margin: 5px 0px;
		}

		&:first-child {
			margin-bottom: 5px;
		}

		&:last-child {
			margin-top: 5px;
		}

		&[data-selected='true'] {
			cursor: default;
			opacity: 1;
		}

		&:hover,
		&:focus {
			outline: none;
			opacity: 1;
		}
	}
</style>
