<script lang="ts">
	import { onMount } from 'svelte';
	import { startInit } from '$lib/preloader';
	import { locale, _ } from 'svelte-i18n';
	import { View } from '$lib/types/+page';
	import { onMount as onSettingsMount } from '$lib/scripts/settings';
	import * as settingsjava from '$lib/stores/settings.java';
	import * as settingsAbout from '$lib/stores/settings.about';
	import * as settingsUpdate from '$lib/stores/settings.update';
	import * as settingsLauncher from '$lib/stores/settings.launcher';
	import * as settingsMinecraft from '$lib/stores/settings.minecraft';
	import * as overlay from '$lib/stores/overlay';
	import * as loginOptions from '$lib/stores/loginOptions';
	import { updateSelectedAccount } from '$lib/stores/landing';
	import { _currentView } from '$lib/stores/+page';

	enum Type {
		Library = 'Library',
		ForgeHosted = 'ForgeHosted',
		Forge = 'Forge',
		Fabric = 'Fabric',
		LiteLoader = 'LiteLoader',
		ForgeMod = 'ForgeMod',
		FabricMod = 'FabricMod',
		LiteMod = 'LiteMod',
		File = 'File',
		VersionManifest = 'VersionManifest',
	}

	function setLocale(langId: string) {
		locale.set(langId);
		if (location.pathname.startsWith('/log')) return;
		updateSelectedAccount(config.getSelectedAccount());
	}

	function showFatalStartupError(error?: string) {
		$_currentView = View.empty;
		overlay.setContent(
			{
				id: 'overlay.startup.fatalErrorTitle',
				values: { error: error ? error : $_('overlay.startup.errorDefault') },
			},
			{
				id: 'overlay.startup.fatalErrorMessage',
				values: {
					error: error
						? $_('overlay.startup.messageOther')
						: $_('overlay.startup.messageDefault'),
				},
			},
			'overlay.startup.closeButton',
		);
		overlay.setHandler(() => {
			MTWNative.closeWindow();
		});
		overlay.toggleOverlay(true);
		ready = true;
	}

	function onDistroRefresh(data: HeliosDistribution) {
		syncModConfigurations(data);
		ensureJavaSettings(data);
	}

	function ensureJavaSettings(data: HeliosDistribution) {
		for (const serv of data.servers) {
			config.ensureJavaConfig(
				serv.rawServer.id,
				serv.effectiveJavaOptions,
				serv.rawServer.javaOptions?.ram,
			);
		}

		config.save();
	}

	function syncModConfigurations(data: HeliosDistribution) {
		const syncedCfgs: ModConfiguration[] = [];

		for (let serv of data.servers) {
			const id = serv.rawServer.id;
			const mdls = serv.modules;
			const cfg = config.getModConfiguration(id);

			if (cfg != null) {
				const modsOld = cfg.mods;
				const mods: Mods = {};

				for (let mdl of mdls) {
					const type = mdl.rawModule.type;

					if (
						type === Type.ForgeMod ||
						type === Type.LiteMod ||
						type === Type.LiteLoader ||
						type === Type.FabricMod
					) {
						if (!mdl.getRequired().value) {
							const mdlID = mdl.getVersionlessMavenIdentifier();
							if (modsOld[mdlID] == null) {
								mods[mdlID] = scanOptionalSubModules(mdl.subModules, mdl);
							} else {
								mods[mdlID] = mergeModConfiguration(
									modsOld[mdlID],
									scanOptionalSubModules(mdl.subModules, mdl),
									false,
								);
							}
						} else {
							if (mdl.subModules.length > 0) {
								const mdlID = mdl.getVersionlessMavenIdentifier();
								const v = scanOptionalSubModules(mdl.subModules, mdl);
								if (typeof v === 'object') {
									if (modsOld[mdlID] == null) {
										mods[mdlID] = v;
									} else {
										mods[mdlID] = mergeModConfiguration(
											modsOld[mdlID],
											v,
											true,
										);
									}
								}
							}
						}
					}
				}

				syncedCfgs.push({
					id,
					mods,
				});
			} else {
				const mods: Mods = {};

				for (let mdl of mdls) {
					const type = mdl.rawModule.type;
					if (
						type === Type.ForgeMod ||
						type === Type.LiteMod ||
						type === Type.LiteLoader ||
						type === Type.FabricMod
					) {
						if (!mdl.getRequired().value) {
							mods[mdl.getVersionlessMavenIdentifier()] = scanOptionalSubModules(
								mdl.subModules,
								mdl,
							);
						} else {
							if (mdl.subModules.length > 0) {
								const v = scanOptionalSubModules(mdl.subModules, mdl);
								if (typeof v === 'object') {
									mods[mdl.getVersionlessMavenIdentifier()] = v;
								}
							}
						}
					}
				}

				syncedCfgs.push({
					id,
					mods,
				});
			}
		}

		config.setModConfigurations(syncedCfgs);
		config.save();
	}

	function scanOptionalSubModules(mdls: HeliosModule[], origin: HeliosModule) {
		if (mdls != null) {
			const mods: Mods = {};

			for (let mdl of mdls) {
				const type = mdl.rawModule.type;

				if (
					type === Type.ForgeMod ||
					type === Type.LiteMod ||
					type === Type.LiteLoader ||
					type === Type.FabricMod
				) {
					if (!mdl.getRequired().value) {
						mods[mdl.getVersionlessMavenIdentifier()] = scanOptionalSubModules(
							mdl.subModules,
							mdl,
						);
					} else {
						if (mdl.hasSubModules()) {
							const v = scanOptionalSubModules(mdl.subModules, mdl);
							if (typeof v === 'object') {
								mods[mdl.getVersionlessMavenIdentifier()] = v;
							}
						}
					}
				}
			}

			if (Object.keys(mods).length > 0) {
				const ret: {
					mods: Mods;
					value?: boolean;
				} = {
					mods,
				};
				if (!origin.getRequired().value) {
					ret.value = origin.getRequired().value;
				}
				return ret;
			}
		}
		return origin.getRequired().value;
	}

	function mergeModConfiguration(o: boolean | any, n: boolean | any, nReq: boolean = false) {
		if (typeof o === 'boolean') {
			if (typeof n === 'boolean') return o;
			else if (typeof n === 'object') {
				if (!nReq) {
					n.value = o;
				}
				return n;
			}
		} else if (typeof o === 'object') {
			if (typeof n === 'boolean') return typeof o.value !== 'undefined' ? o.value : true;
			else if (typeof n === 'object') {
				if (!nReq) {
					n.value = typeof o.value !== 'undefined' ? o.value : true;
				}

				const newMods = Object.keys(n.mods);
				for (let i = 0; i < newMods.length; i++) {
					const mod = newMods[i];
					if (o.mods[mod] != null) {
						n.mods[mod] = mergeModConfiguration(o.mods[mod], n.mods[mod]);
					}
				}
			}
		}
	}

	async function validateSelectedAccount() {
		const selectedAcc = config.getSelectedAccount();
		if (selectedAcc != null) {
			const val = await MTWNative.authManager.validateSelected();
			if (!val) {
				config.removeAuthAccount(selectedAcc.uuid);
				config.save();
				const accLen = Object.keys(config.getAuthAccounts()).length;
				overlay.setContent(
					'overlay.validateAccount.failedMessageTitle',
					{
						id:
							accLen > 0
								? 'overlay.validateAccount.failedMessage'
								: 'overlay.validateAccount.failedMessageSelectAnotherAccount',
						values: { account: selectedAcc.displayName },
					},
					'overlay.validateAccount.loginButton',
					'overlay.validateAccount.selectAnotherAccountButton',
				);
				overlay.setHandler(() => {
					const isMicrosoft = selectedAcc.type === 'microsoft';

					loginOptions.loginSuccess.set($_currentView);
					loginOptions.loginCancel.set(View.loginOptions);

					if (accLen > 0) {
						loginOptions.viewOnCancel.set($_currentView);
						loginOptions.cancelHandler.set(() => {
							if (isMicrosoft) {
								config.addMicrosoftAuthAccount(
									selectedAcc.uuid,
									selectedAcc.accessToken,
									selectedAcc.username,
									selectedAcc.expiresAt,
									selectedAcc.microsoft.access_token,
									selectedAcc.microsoft.refresh_token,
									selectedAcc.microsoft.expires_at,
								);
							}
							config.save();
							validateSelectedAccount();
						});
						loginOptions.cancelEnabled.set(true);
					} else {
						loginOptions.cancelEnabled.set(false);
					}
					overlay.toggleOverlay(false);
					changeView(View.loginOptions);
				});
				overlay.setDismiss(() => {
					if (accLen > 1) {
						overlay.content.set('account');
					} else {
						const accountsObj = config.getAuthAccounts();
						const accounts = Array.from(
							Object.keys(accountsObj),
							(v) => accountsObj[v],
						);
						setSelectedAccount(accounts[0].uuid);
						overlay.toggleOverlay(false);
					}
				});
				overlay.toggleOverlay(true, accLen > 0);
				return false;
			} else {
				return true;
			}
		} else {
			return true;
		}
	}

	function setSelectedAccount(uuid: any) {
		const authAcc = config.setSelectedAccount(uuid);
		config.save();
		updateSelectedAccount(authAcc);
		validateSelectedAccount();
	}

	// 배포 인덱스가 다운로드 된 후 수행 해야하는 조치.
	let ready: boolean = false;
	onMount(async () => {
		if (location.pathname.startsWith('/log')) {
			await import('$lib/i18n');
			setLocale('en');
			window.setLocale = setLocale;
			ready = true;
			return;
		}
		const logger = MTWNative.getLogger('Preloader');
		logger.info('Checking internet...');
		const checkInternet = await MTWNative.checkInternet();
		if (!checkInternet) {
			logger.info('No internet connection');
		} else {
			logger.info('Internet connected');
		}
		logger.info('Loading Config...');

		// config init
		config.load(checkInternet);
		await import('$lib/i18n');
		setLocale(config.getLanguage());
		MTWNative.changeTitle($_('app.title'));
		window.i18n = (id: string | MessageObject, options?: Omit<MessageObject, 'id'>) =>
			$_(id, options);
		window.setLocale = setLocale;
		window.setSelectedAccount = setSelectedAccount;
		window.onDistroRefresh = onDistroRefresh;
		window.validateSelectedAccount = validateSelectedAccount;
		window.Type = Type;

		if (!checkInternet) {
			$_currentView = View.empty;
			overlay.setContent(
				'overlay.checkInternet.title',
				'overlay.checkInternet.desc',
				'overlay.checkInternet.retry',
			);
			overlay.setHandler(() => {
				location.reload();
			});
			overlay.toggleOverlay(true);
			ready = true;
			return;
		}

		try {
			logger.info('Loading Main...');
			await startInit(logger);
			try {
				const data = await MTWNative.DistroAPI.getDistribution();
				syncModConfigurations(data);
				ensureJavaSettings(data);
				// main load
				const isLoggedIn = Object.keys(config.getAuthAccounts()).length > 0;

				if (MTWNative.isPackaged && isLoggedIn) {
					validateSelectedAccount();
				}

				if (config.isFirstLaunch()) {
					$_currentView = View.welcome;
				} else {
					if (isLoggedIn) {
						$_currentView = View.landing;
					} else {
						loginOptions.cancelEnabled.set(false);
						loginOptions.loginSuccess.set(View.landing);
						loginOptions.loginCancel.set(View.loginOptions);
						$_currentView = View.loginOptions;
					}
				}
				onSettingsMount();
				settingsjava.onInit();
				settingsLauncher.onInit();
				settingsMinecraft.onInit();
				settingsUpdate.onInit();
				settingsAbout.updateReleaceNotes();
				setTimeout(() => {
					ready = true;
				}, 1);
			} catch (err: any) {
				console.error(err);
				showFatalStartupError((err as Error).message);
			}
		} catch (err: any) {
			logger.info('Failed to load an older version of the distribution index.');
			logger.info('Application cannot run.');
			logger.error(err);
			showFatalStartupError();
		}
	});
</script>

{#if ready}
	<slot />
{/if}

<style lang="scss" global>
	html,
	body {
		margin: 0;
		padding: 0;
		width: 100%;
		height: 100%;
		user-select: none;
		-webkit-user-drag: none;
		-webkit-user-select: none;
		font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
			'Noto Sans', 'Liberation Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji',
			'Segoe UI Symbol', 'Noto Color Emoji';
		font-size: 1rem;
		font-weight: 400;
		line-height: 1.5;
		-webkit-text-size-adjust: 100%;
		-webkit-tap-highlight-color: rgba(0, 0, 0, 0);
	}

	body,
	button {
		font-family: 'Avenir Medium';
		&:not(.cet-title) {
			color: white;
		}
	}

	body {
		background-image: var(--background, url(/assets/images/backgrounds/background.png));
		background-position: center;
		background-size: cover;
	}

	.cet-titlebar {
		backdrop-filter: blur(16px);
		background-color: rgba(255, 255, 255, 0.1) !important;
	}

	.cet-title {
		color: black;
	}

	.cet-container {
		overflow: hidden;
	}

	.cet-window-controls {
		display: none;
	}

	#svelte {
		width: 100%;
		height: 100%;
		backdrop-filter: blur(2px);
		background: rgba(0, 0, 0, 0.3);
	}

	img {
		user-select: none;
		-webkit-user-drag: none;
	}
</style>
