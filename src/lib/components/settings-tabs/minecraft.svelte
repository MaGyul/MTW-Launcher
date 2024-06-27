<script lang="ts">
	import { _ } from 'svelte-i18n';
	import {
		gameWidth,
		gameHeight,
		fullscreen,
		autoConnect,
		launchDetached,
	} from '$lib/stores/settings.minecraft';
	import * as script from '$lib/scripts/settings';
	const config = window.config;

	function change(type: 'width' | 'height' | 'full' | 'auto' | 'launch') {
		return (e: Event) => {
			let target = e.target as HTMLInputElement;
			let value;
			switch (type) {
				case 'width':
					value = Number(target.value);
					if (!Number.isNaN(value)) gameWidth.set(value);
					break;
				case 'height':
					value = Number(target.value);
					if (!Number.isNaN(value)) gameHeight.set(value);
					break;
				case 'full':
					fullscreen.set(target.checked);
					break;
				case 'auto':
					autoConnect.set(target.checked);
					break;
				case 'launch':
					launchDetached.set(target.checked);
					break;
			}
		};
	}
</script>

<div class="tab-minecraft settings-tab">
	<div class="tab-header">
		<span class="text">{$_('settings.tab.minecraft.header.text')}</span>
		<span class="desc">{$_('settings.tab.minecraft.header.desc')}</span>
	</div>
	<div class="game-resolution-container">
		<span class="field-title">{$_('settings.tab.minecraft.gameResolution')}</span>
		<div class="content">
			<input
				type="number"
				id="game-width"
				min="0"
				value={$gameWidth}
				on:keyup={script.keyupGameResolution(config.validateGameWidth)}
				on:change={change('width')}
			/>
			<div class="cross">&#10006;</div>
			<input
				type="number"
				id="game-height"
				min="0"
				value={$gameHeight}
				on:keyup={script.keyupGameResolution(config.validateGameHeight)}
				on:change={change('height')}
			/>
		</div>
	</div>
	<div class="field-container">
		<div class="left">
			<span class="title">{$_('settings.tab.minecraft.launchFullscreen')}</span>
		</div>
		<div class="right">
			<label class="toggle-switch">
				<input type="checkbox" checked={$fullscreen} on:change={change('full')} />
				<span class="toggle-switch-clider" />
			</label>
		</div>
	</div>
	<div class="field-container">
		<div class="left">
			<span class="title">{$_('settings.tab.minecraft.autoConnect')}</span>
		</div>
		<div class="right">
			<label class="toggle-switch">
				<input type="checkbox" checked={$autoConnect} on:change={change('auto')} />
				<span class="toggle-switch-clider" />
			</label>
		</div>
	</div>
	<div class="field-container">
		<div class="left">
			<span class="title">
				{$_('settings.tab.minecraft.launchDetached.title')}
			</span>
			<span class="desc">{$_('settings.tab.minecraft.launchDetached.desc')}</span>
		</div>
		<div class="right">
			<label class="toggle-switch">
				<input type="checkbox" checked={$launchDetached} on:change={change('launch')} />
				<span class="toggle-switch-clider" />
			</label>
		</div>
	</div>
</div>
