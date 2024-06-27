<script lang="ts">
	import { _ } from 'svelte-i18n';
	import Spinner from './spinner.svelte';
</script>

<div class="waiting">
	<div class="content">
		<Spinner width="50px" height="50px" cursor="default" color="rgb(222, 222, 222)" />
		<div class="textContainer">
			<h2>{$_('waiting.text')}</h2>
		</div>
	</div>
</div>

<style lang="scss">
	.waiting {
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100%;
		width: 100%;
		transition: filter 0.25s ease;
		background: rgba(0, 0, 0, 0.5);

		> .content {
			display: flex;
			flex-direction: row;
			justify-content: center;
			align-items: center;
			width: 50%;
			height: 50%;
			position: relative;
		}

		.textContainer {
			h2 {
				margin-bottom: 65px;
			}
		}
	}
</style>
