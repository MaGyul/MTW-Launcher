<script lang="ts">
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { title, text, link, updateReleaceNotes } from '$lib/stores/settings.about';

	let version: string = MTWNative.appVersion;

	onMount(() => {
		updateReleaceNotes();
	});
</script>

<div class="tab-about settings-tab">
	<div class="tab-header">
		<span class="text">{$_('settings.tab.about.header.text')}</span>
		<span class="desc">{$_('settings.tab.about.header.desc')}</span>
	</div>
	<div class="about-current-container">
		<div class="content">
			<div class="headline">
				<img class="logo" src="icon_256x256.png" alt="logo-img" />
				<span class="title">
					{$_('settings.tab.about.title', {
						values: { appName: $_('app.title') },
					})}
				</span>
			</div>
			<div class="version">
				<div class="check">&#10003;</div>
				<div class="details">
					<span class="title">{$_('settings.tab.stableRelease')}</span>
					<div class="line">
						<span class="text">{$_('settings.tab.versionText')}</span>
						<span class="value">{version ? version : '0.0.0-alpha.18'}</span>
					</div>
				</div>
			</div>
		</div>
		<div class="buttons">
			<a href={$_('settings.poweredByLink')} class="about-button">
				{$_('settings.tab.about.poweredBy')}
			</a>
		</div>
	</div>
	<div class="changelog-container">
		<div class="content">
			<div class="headline">
				<div class="label">{$_('settings.tab.about.releaseNotes')}</div>
				<div class="title">
					{$_($title)}
				</div>
			</div>
			<div class="text">
				{@html $_($text)}
			</div>
		</div>
		<div class="actions">
			<a class="button about-button" href={$_($link)}>
				{$_('settings.tab.about.viewReleaseNotes')}
			</a>
		</div>
	</div>
</div>
