<script lang="ts">
	import { View } from '$lib/types/+page';
	import { _ } from 'svelte-i18n';
	import { ddValue, launcherOpen, gameLogOpen, trayMove } from '$lib/stores/settings.launcher';
	import * as script from '$lib/scripts/settings';

	function langs() {
		return window.langs();
	}

	let currentLang: string = config.getLanguage();
	let colorValue: string = config.getTitleBarColor();

	function langChange() {
		config.setLanguage(currentLang);
		config.save();
		changeView(View.empty, () => {
			window.setLocale(currentLang);
			changeView(View.settings);
		});
	}

	function change(type: 'launcher' | 'game' | 'tray') {
		return (e: Event) => {
			let target = e.target as HTMLInputElement;
			if (type == 'launcher') {
				launcherOpen.set(target.checked);
			} else if (type == 'game') {
				gameLogOpen.set(target.checked);
			} else {
				trayMove.set(target.checked);
			}
		};
	}

	// function titleColor(type: 'input' | 'change') {
	// 	return (e: Event & { currentTarget: EventTarget & HTMLInputElement }) => {
	// 		if (type === 'input') {
	// 			electron.setTitleBarOverlay({
	// 				color: e.currentTarget.value,
	// 			});
	// 		} else {
	// 			tbColor.set(e.currentTarget.value);
	// 		}
	// 	};
	// }
</script>

<div class="tab-launcher settings-tab">
	<div class="tab-header">
		<span class="text">{$_('settings.tab.launcher.header.text')}</span>
		<span class="desc">{$_('settings.tab.launcher.header.desc')}</span>
	</div>
	<div class="file-sel-container">
		<div class="title">
			{$_('settings.tab.launcher.dataDirectory.title')}
		</div>
		<div class="content">
			<div class="actions">
				<div class="file-sel-icon">
					<svg class="file-sel-svg">
						<g>
							<path
								fill="gray"
								d="m10.044745,5c0,0.917174 -0.746246,1.667588 -1.667588,1.667588l-4.168971,0l-2.501382,0c-0.921009,0 -1.667588,0.750415 -1.667588,1.667588l0,6.670353l0,2.501382c0,0.917174 0.746604,1.667588 1.667588,1.667588l16.675882,0c0.921342,0 1.667588,-0.750415 1.667588,-1.667588l0,-2.501382l0,-8.337941c0,-0.917174 -0.746246,-1.667588 -1.667588,-1.667588l-8.337941,0z"
							/>
							<path
								fill="gray"
								d="m1.627815,1.6c-0.921009,0 -1.667588,0.746579 -1.667588,1.667588l0,4.168971l8.337941,0l0,0.833794l11.673118,0l0,-4.168971c0,-0.921009 -0.746246,-1.667588 -1.667588,-1.667588l-8.572237,0c-0.288493,-0.497692 -0.816284,-0.833794 -1.433292,-0.833794l-6.670353,0z"
							/>
							<path
								fill="lightgray"
								d="m10.025276,4c0,0.918984 -0.747719,1.670879 -1.670879,1.670879l-4.177198,0l-2.506319,0c-0.922827,0 -1.670879,0.751896 -1.670879,1.670879l0,6.683517l0,2.506319c0,0.918984 0.748078,1.670879 1.670879,1.670879l16.708794,0c0.923161,0 1.670879,-0.751896 1.670879,-1.670879l0,-2.506319l0,-8.354397c0,-0.918984 -0.747719,-1.670879 -1.670879,-1.670879l-8.354397,0z"
							/>
						</g>
					</svg>
				</div>
				<input class="file-sel-val" type="text" value={$ddValue} disabled />
				<button
					class="file-sel-button"
					on:click={script.fileSelector(
						false,
						$_('settings.tab.launcher.dataDirectory.select'),
						true,
					)}
				>
					{$_('settings.tab.launcher.dataDirectory.chooseFolder')}
				</button>
			</div>
		</div>
		<div class="desc">{@html $_('settings.tab.launcher.dataDirectory.desc')}</div>
	</div>
	<div class="language-selector">
		<div class="title">{$_('settings.tab.launcher.language.title')}</div>
		<div class="content">
			<select name="language" bind:value={currentLang} on:change={langChange}>
				{#each langs() as lang}
					<option value={lang}>
						{$_(`settings.langs.${lang}`)}
					</option>
				{/each}
			</select>
		</div>
	</div>
	<div class="field-container">
		<div class="left">
			<span class="title">
				{$_('settings.tab.launcher.launcherOpen.title')}
			</span>
			<span class="desc">{$_('settings.tab.launcher.launcherOpen.desc')}</span>
		</div>
		<div class="right">
			<label class="toggle-switch">
				<input type="checkbox" checked={$launcherOpen} on:change={change('launcher')} />
				<span class="toggle-switch-clider" />
			</label>
		</div>
	</div>
	<div class="field-container">
		<div class="left">
			<span class="title">
				{$_('settings.tab.launcher.gameLogOpen.title')}
			</span>
			<span class="desc">{$_('settings.tab.launcher.gameLogOpen.desc')}</span>
		</div>
		<div class="right">
			<label class="toggle-switch">
				<input type="checkbox" checked={$gameLogOpen} on:change={change('game')} />
				<span class="toggle-switch-clider" />
			</label>
		</div>
	</div>
	<div class="field-container">
		<div class="left">
			<span class="title">
				{$_('settings.tab.launcher.trayMove.title')}
			</span>
			<span class="desc">{$_('settings.tab.launcher.trayMove.desc')}</span>
		</div>
		<div class="right">
			<label class="toggle-switch">
				<input type="checkbox" checked={$trayMove} on:change={change('tray')} />
				<span class="toggle-switch-clider" />
			</label>
		</div>
	</div>
	<!-- <div class="title-color">
		<div class="title">{$_('settings.tab.launcher.titleBar.title')}</div>
		<div class="content">
			<span class="text">{$_('settings.tab.launcher.titleBar.text')}</span>
			<input
				class="color-picker"
				type="color"
				value={colorValue}
				on:input={titleColor('input')}
				on:change={titleColor('change')}
			/>
		</div>
	</div> -->
</div>
