<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { fade } from 'svelte/transition';
	import { onMount } from 'svelte';
	import {
		buttonText,
		buttonDisabled,
		buttonHandler,
		progressEnabled,
		progressPercent,
		changeLogTitle,
		changeLogText,
		updateTitle,
		updateVersion,
		changeLogEnabled,
	} from '$lib/stores/settings.update';

	// let version: string;
	// let showChangelog: boolean;
	let actionButton: HTMLButtonElement;

	// function setup() {
	// 	if ($updateData !== undefined) {
	// 		updateTitle = $_('settings.tab.update.newReleaseTitle');
	// 		showChangelog = true;
	// 		// changelogTitle = $updateData.releaseName;
	// 		// changelogText = $updateData.releaseNotes;
	// 		version = $updateData.version;

	// 		$checkingUpdate = false;

	// 		if (MTWNative.platform() === 'darwin') {
	// 			$buttonText = $_('settings.tab.update.downloadButton');
	// 			$buttonDisabled = false;
	// 		} else {
	// 			$buttonText = $_('settings.tab.update.downloadingButton');
	// 			$buttonDisabled = true;
	// 		}
	// 	} else {
	// 		updateTitle = $_('settings.tab.update.latestVersionTitle');
	// 		showChangelog = false;
	// 		version = MTWNative.appVersion;
	// 		if (!$checkingUpdate) {
	// 			$buttonText = $_('settings.tab.update.checkForUpdatesButton');
	// 			$buttonDisabled = false;
	// 		} else {
	// 			$buttonText = $_('settings.tab.update.checkingForUpdatesButton');
	// 			$buttonDisabled = true;
	// 		}
	// 	}
	// }

	onMount(() => {
		// const unsubUD = updateData.subscribe(setup);
		const unsubBE = buttonDisabled.subscribe((v) => (actionButton.disabled = v));

		return () => {
			// 	unsubUD();
			unsubBE();
		};
	});
</script>

<div class="tab-update settings-tab">
	<div class="tab-header">
		<span class="text">{$_('settings.tab.update.header.text')}</span>
		<span class="desc">{$_('settings.tab.update.header.desc')}</span>
	</div>
	<div class="status-container">
		<div class="content">
			<div class="headline">
				<span class="title">{$_($updateTitle)}</span>
			</div>
			<div class="version">
				<div class="check">&#10003;</div>
				<div class="details">
					<span class="title">
						{$_('settings.tab.stableRelease')}
					</span>
					<div class="line">
						<span class="text">{$_('settings.tab.versionText')}</span>
						<span class="value">{$updateVersion}</span>
					</div>
				</div>
			</div>
			<div class="action-container">
				<button class="button" bind:this={actionButton} on:click={$buttonHandler}>
					{@html $_($buttonText)}
				</button>
				{#if $progressEnabled}
					<div
						class="progress"
						in:fade={{ delay: 250, duration: 250 }}
						out:fade={{ duration: 250 }}
					>
						<span class="label">{$progressPercent}%</span>
						<progress value={$progressPercent} max="100" />
					</div>
				{/if}
			</div>
		</div>
	</div>
	{#if $changeLogEnabled}
		<div
			class="changelog-container"
			in:fade={{ delay: 250, duration: 250 }}
			out:fade={{ duration: 250 }}
		>
			<div class="content">
				<div class="headline">
					<div class="label">{$_('settings.tab.whatsNew')}</div>
					<div class="title">
						{$_($changeLogTitle)}
					</div>
				</div>
				<div class="text">
					{@html $_($changeLogText)}
				</div>
			</div>
		</div>
	{/if}
</div>
