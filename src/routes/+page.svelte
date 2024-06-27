<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { View } from '$lib/types/+page';
	import Empty from '$lib/components/empty.svelte';
	import LoginOptions from '$lib/components/loginOptions.svelte';
	import Login from '$lib/components/login.svelte';
	import Landing from '$lib/components/landing.svelte';
	import Settings from '$lib/components/settings.svelte';
	import Waiting from '$lib/components/waiting.svelte';
	import Welcome from '$lib/components/welcome.svelte';
	import Overlay from '$lib/components/overlay.svelte';
	import {
		state as overlayState,
		dismissable,
		content as overlayView,
	} from '$lib/stores/overlay';
	import { fade } from 'svelte/transition';
	import { _currentView } from '$lib/stores/+page';

	if (MTWNative.platform() === 'darwin') {
		MTWNative.requestMic().then(async (result) => {
			if (!result && config.isNotiMic()) {
				var ret = await electron.openMessage({
					title: $_('dialog.microphone.title'),
					message: $_('dialog.microphone.message'),
					checkboxLabel: $_('dialog.microphone.checkbox'),
					type: 'warning',
				});
				if (ret.checkboxChecked) {
					config.setNotiMic(false);
					config.save();
				}
			}
		});
	}

	const views = [Empty, Welcome, Waiting, LoginOptions, Login, Landing, Settings];

	let view_component: typeof Empty;
	let forward_component: typeof Empty;
	let back_component: typeof Empty;

	window.currentView = () => _currentView;

	if (window) {
		window.views = View;
		window.changeView = function (view: View, cb?: () => void) {
			if (view === View.login) return;
			switch ($_currentView) {
				case View.empty:
				case View.welcome:
				case View.waiting:
				case View.loginOptions:
					break;
				default:
					if (view != View.empty) {
						back_component = views[$_currentView];
					}
					break;
			}
			$_currentView = view;
			if (cb) {
				setTimeout(() => {
					cb();
				}, 250);
			}
		};
	}

	document.addEventListener('mousedown', (e) => {
		if (e.button == 3) {
			if (back_component) {
				if (back_component == view_component) return;
				forward_component = view_component;
				view_component = back_component;
				$_currentView = views.findIndex((v) => v === back_component);
			}
		} else if (e.button == 4) {
			if (forward_component) {
				if (forward_component == view_component) return;
				back_component = view_component;
				view_component = forward_component;
				$_currentView = views.findIndex((v) => v === forward_component);
			}
		}
	});

	$: view_component = views[$_currentView];
	$: jq(document).on('click', 'a[href^="http"]', function (event) {
		event.preventDefault();
		if (this.href !== '#') {
			MTWNative.openURL(this.href);
		}
	});
</script>

<main>
	{#key view_component}
		<div in:fade={{ delay: 250, duration: 250 }} out:fade={{ duration: 250 }}>
			<svelte:component this={view_component} />
		</div>
	{/key}
	{#if $overlayState}
		<div in:fade={{ delay: 250, duration: 250 }} out:fade={{ duration: 250 }}>
			<Overlay dismissable={$dismissable} view={$overlayView} />
		</div>
	{/if}
</main>

<style lang="scss">
	:root {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu,
			Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
	}

	main {
		width: 100%;
		height: 100%;
		color: white;
		overflow: hidden !important;

		> div {
			width: 100%;
			height: 100%;
		}
	}
</style>
