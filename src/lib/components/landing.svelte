<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly, slide } from 'svelte/transition';
	import { _ } from 'svelte-i18n';
	import {
		username,
		avatar,
		updateSelectedAccount,
		launchArea,
		serverStatus,
		detailsText,
		launchGame,
		onMounted,
		showPercent,
		percent,
		playerList,
	} from '$lib/stores/landing';
	import { c_tab, Tab } from '$lib/stores/settings';
	import { View } from '$lib/types/+page';

	const logger = MTWNative.getLogger('Landing');
	const snsButtons: HTMLButtonElement[] = [];

	const nativeProtocol = 'native://';
	const btnTypes = [
		'settings',
		'userchange',
		'play',
		'refrash/server',
		'open/data-directory',
		'open/game-root/resourcepacks',
		'open/game-root/screenshots',
		'open/game-root/shaderpacks',
		'open/game-root',
	];

	function clickBtn(type: string) {
		return () => {
			if (isURL(type)) {
				if (type.startsWith(nativeProtocol)) {
					let start = nativeProtocol.length;
					let end = type.length;
					if (type.endsWith('/')) end -= 1;
					let nativePath = type.substring(start, end);
					let args = nativePath.split('/');
					if (args.length == 0) return;
					switch (args[0]) {
						case 'refrash':
							if (args.length <= 1) return;
							if (args[1] == 'server') {
								refrashServerStatus(true);
							}
							break;
						case 'open':
							if (args.length <= 1) return;
							switch (args[1]) {
								case 'data-directory':
									MTWNative.openURL(config.getDataDirectory());
									break;
								case 'game-root':
									if (args.length <= 2) {
										var instance = config.getInstanceDirectory();
										var path = MTWNative.path.join(
											instance,
											config.getSelectedServer(),
										);
										if (MTWNative.path.exists(path)) {
											MTWNative.openURL(path);
										}
										return;
									}
									switch (args[2]) {
										case 'screenshots':
										case 'shaderpacks':
										case 'resourcepacks':
											var instance = config.getInstanceDirectory();
											var path = MTWNative.path.join(
												instance,
												config.getSelectedServer(),
												args[2],
											);
											if (!MTWNative.path.exists(path)) {
												MTWNative.path.mkdir(path);
											}
											MTWNative.openURL(path);
											break;
									}
									break;
							}
							break;
						case 'userchange':
							c_tab.set(Tab.account);
						case 'settings':
							changeView(View.settings);
							break;
						case 'play':
							launchGame();
							break;
					}
					return;
				}
				MTWNative.openURL(type);
			}
		};
	}

	function isURL(url: string) {
		try {
			new URL(url);
			return true;
		} catch {
			return false;
		}
	}

	async function isAliveURL(url: string) {
		if (isURL(url)) {
			if (url.startsWith(nativeProtocol)) {
				let start = nativeProtocol.length;
				let end = url.length;
				if (url.endsWith('/')) end -= 1;
				if (btnTypes.includes(url.substring(start, end))) {
					return true;
				}
				return false;
			}
			var res = await MTWNative.nodeFetch(url, { method: 'head' }).catch(() => undefined);
			if (!res) return isAliveURL(url);
			if (res.ok) return true;
		}
		return false;
	}

	async function getSNS(): Promise<
		{
			title: string;
			url: string;
			icon: string;
		}[]
	> {
		try {
			return await fetch('https://mathwor.com/launcher/sns.json', {
				cache: 'no-store',
			}).then((r) => r.json());
		} catch {
			return [
				{
					title: 'landing.sns.youtube',
					url: 'https://mathwor.com/youtube',
					icon: 'assets/images/youtube.svg',
				},
				{
					title: 'landing.sns.discord',
					url: 'https://mathwor.com/discord',
					icon: 'assets/images/discord.svg',
				},
				{
					title: 'landing.sns.kakaotalk',
					url: 'https://mathwor.com/kakaotalk',
					icon: 'assets/images/kakaotalk.svg',
				},
				{
					title: 'landing.sns.cafe',
					url: 'https://mathwor.com/cafe',
					icon: 'assets/images/cafe.svg',
				},
			];
		}
	}

	function checkSNS() {
		setTimeout(() => {
			for (let sns of snsButtons) {
				let url = sns.getAttribute('data-url');
				if (url) {
					isAliveURL(url).then((alive) => {
						if (!alive) {
							sns.style.display = 'none';
						}
					});
				}
			}
		});
		return '';
	}

	window.refrashServerStatus = refreshServerStatus;
	async function refreshServerStatus(fade: boolean = false) {
		logger.info('Refreshing Server Status');
		const serv = (await MTWNative.DistroAPI.getDistribution()).getServerById(
			config.getSelectedServer(),
		);

		if (serv) {
			let val: MessageObject = {
				id: 'landing.text.offline',
			};
			try {
				const servStat = await MTWNative.getServerStatus(47, serv.hostname, serv.port);
				const players = servStat.players;
				val = {
					id: 'landing.text.online',
					values: { online: players.online, max: players.max },
				};
				$playerList = players.sample ?? [];
			} catch (err) {
				logger.warn('Unable to refresh server status, assuming offline.');
			}
			if (fade) {
				jq('.landing > .content > .lower > .status-content > .wrapper').fadeOut(250, () => {
					$serverStatus = val;
					jq('.landing > .content > .lower > .status-content > .wrapper').fadeIn(500);
				});
			} else {
				$serverStatus = val;
			}
		}
	}

	refrashServerStatus();
	updateSelectedAccount(config.getSelectedAccount());

	onMount(() => {
		onMounted();
		let serverStatusListener = setInterval(() => refreshServerStatus(true), 300000);

		return () => {
			clearInterval(serverStatusListener);
		};
	});
</script>

<div class="landing">
	<div class="buttons">
		<div class="sns">
			{#await getSNS() then snss}
				{#each snss as sns}
					<button
						title={$_(sns.title)}
						on:click={clickBtn(sns.url)}
						data-url={sns.url}
						bind:this={snsButtons[snsButtons.length]}
					>
						<img src={sns.icon} alt={sns.icon} />
					</button>
				{/each}
				{checkSNS()}
			{/await}
		</div>
		<div class="bottom">
			<button
				title={$_('landing.buttons.settings')}
				on:click={clickBtn(nativeProtocol + 'settings')}
			>
				<img src="assets/images/settings_white.png" alt="settings" />
			</button>
		</div>
	</div>
	<div class="content">
		<div class="upper">
			<div class="right">
				<div class="container">
					<div class="user-content">
						<span class="user-text">{$_($username)}</span>
						<div class="avatar-container" style="background-image: url('{$avatar}');">
							<!-- svelte-ignore a11y-click-events-have-key-events -->
							<div class="overlay" on:click={clickBtn(nativeProtocol + 'userchange')}>
								{$_('landing.text.change')}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
		<div style="flex: 1;" />
		<div class="lower">
			<div class="status-content">
				<div class="wrapper">
					<div class="server-info">
						<span class="bot-label">{$_('landing.text.server')}</span>
						<span class="player-count">{$_($serverStatus)}</span>
					</div>
					{#if $playerList.length > 0}
						<span class="tooltip">
							{#each $playerList.slice(0, 10) as playerList}
								<div class="player">
									<img
										class="avatar"
										src={`https://mc-heads.net/avatar/${playerList.id}`}
										alt="avatar"
									/>
									<span class="name">{playerList.name}</span>
								</div>
							{/each}
							<!-- {@html $playerList
								.slice(0, 10)
								.map((o) => o.id)
								.join('<br>')}
							<br /> -->
							{$playerList.length > 10 ? $playerList.length - 10 + '+' : ''}
						</span>
					{/if}
				</div>
			</div>
			<div class="launch">
				{#if $launchArea}
					<div
						class="details"
						in:fly={{ x: 100, delay: 250, duration: 250 }}
						out:fly={{ x: -100, duration: 250 }}
					>
						{#if $showPercent}
							<div
								class="panel"
								in:fade={{ delay: 125, duration: 125 }}
								out:fade={{ duration: 125 }}
							>
								<div class="top">
									<span class="progress-label">
										{$percent == -1
											? $_('landing.launch.loading')
											: `${$percent}%`}
									</span>
									<!-- <div class="bot-divider" /> -->
								</div>
								<div class="bottom">
									{#if $percent == -1}
										<progress class="progress" />
									{:else}
										<progress class="progress" value={$percent} max="100" />
									{/if}
									<span class="text">
										{$_($detailsText)}
									</span>
								</div>
							</div>
						{:else}
							<div
								class="panel"
								in:fade={{ delay: 125, duration: 125 }}
								out:fade={{ duration: 125 }}
							>
								<span class="text">
									{$_($detailsText)}
								</span>
							</div>
						{/if}
					</div>
				{:else}
					<div
						class="content"
						in:fly={{ x: 100, delay: 250, duration: 250 }}
						out:fly={{ x: -100, duration: 250 }}
					>
						<button on:click={clickBtn(nativeProtocol + 'play')}>
							{$_('landing.text.play')}
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<style lang="scss">
	.landing {
		display: flex;
		flex-direction: row-reverse;

		width: 100%;
		height: 100%;
		transition: background 2s ease;
		overflow-y: hidden;

		> .buttons {
			display: flex;
			flex-direction: column;
			align-items: flex-end;
			background: rgba(255, 255, 255, 0.3);
			backdrop-filter: blur(6px);
			transition: all 300ms;

			height: 100%;

			> .sns {
				display: flex;
				flex-direction: column;
				align-items: center;
				gap: 25px;
				width: 80px;
				height: 100%;
				z-index: 100;
				overflow-y: auto;

				> button {
					display: flex;
					justify-content: center;
					align-items: center;
					width: 35px;
					min-height: 35px;
					margin: 0;
					border-radius: 50%;
					border: 0;
					background: rgba(0, 0, 0, 0.3);
					color: white;
					font-size: 15px;

					> img {
						width: 20px;
					}

					&:first-child {
						margin-top: 25px;
					}

					&:hover {
						border: 2px solid gold;
					}
				}

				&::-webkit-scrollbar {
					width: 2px;
				}

				&::-webkit-scrollbar-track {
					display: none;
				}

				&::-webkit-scrollbar-thumb {
					border-radius: 10px;
					box-shadow: inset 0 0 10px rgba(255, 255, 255, 0.5);
				}
			}

			> .bottom {
				display: flex;
				justify-content: center;
				width: 80px;
				z-index: 101;

				> button {
					display: flex;
					justify-content: center;
					align-items: center;
					width: 35px;
					height: 35px;
					margin-top: 25px;
					margin-bottom: 25px;
					border-radius: 50%;
					border: 0;
					background: rgba(0, 0, 0, 0.3);
					color: white;
					font-size: 15px;

					> img {
						width: 20px;
					}

					&:hover {
						border: 2px solid gold;
					}
				}
			}
		}

		> .content {
			display: flex;
			flex-direction: column;
			align-items: flex-end;
			justify-content: space-around;

			> .upper {
				// position: relative;
				transition: top 2s ease;
				width: 0px;
				// top: 0px;
				// height: 30%;
				// display: flex;

				> .right {
					// display: inline-flex;
					width: 15%;
					// height: 100%;
					position: relative;
					// float: right;
					right: 155px;
					top: 20px;
					// padding: 0px 0px 0px 100%;

					> .container {
						display: flex;
						flex-direction: column;
						position: relative;
						top: 50px;
						align-items: flex-start;
						height: calc(100% - 50px);

						> .user-content {
							display: flex;
							align-items: center;
							justify-content: center;
							box-sizing: border-box;
							position: relative;

							> .user-text {
								font-size: 12px;
								min-width: 135px;
								font-weight: 900;
								letter-spacing: 1px;
								text-shadow: 0px 0px 20px black;
								position: absolute;
								right: 95px;
								text-align: right;
								user-select: initial;
							}

							> .avatar-container {
								border-radius: 50%;
								border: 2px solid #cad7e1;
								box-sizing: border-box;
								background: rgba(1, 2, 1, 0.5);
								height: 70px;
								width: 70px;
								box-shadow: 0px 0px 10px 0px rgb(0, 0, 0);
								overflow: hidden;
								position: relative;
								background-position: center;
								background-repeat: no-repeat;
								background-size: contain;

								> .overlay {
									opacity: 0;
									position: absolute;
									z-index: 1;
									display: flex;
									justify-content: center;
									align-items: center;
									transition: 0.25s ease;
									font-weight: bold;
									letter-spacing: 2px;
									background-color: rgba(0, 0, 0, 0.35);
									user-select: none;
									border: none;
									cursor: pointer;
									width: 100%;
									height: 100%;
									border-radius: 50%;
									color: white;

									&:hover,
									&:focus {
										opacity: 1;
									}

									&:active {
										background-color: rgba(0, 0, 0, 0.45);
									}
								}
							}
						}
					}
				}
			}

			> .lower {
				display: flex;
				flex-direction: column;
				align-items: flex-end;
				gap: 70px;
				margin-right: 110px;
				margin-bottom: 60px;

				> .status-content {
					// position: relative;
					// float: right;
					// inset: 0px 0px 0px -80px;
					// top: 40%;
					// display: inline-grid;
					margin-right: -20px;
					min-height: 50px;

					> .wrapper {
						display: flex;
						flex-direction: column-reverse;
						align-items: center;
						gap: 10px;

						> .server-info {
							> .player-count {
								color: #949494;
								font-size: 14px;
								font-weight: 900;
								text-shadow: 0px 0px 20px #949494;
								margin-left: 10px;
								margin-top: 1px;
							}
						}

						> .tooltip {
							visibility: hidden;
							min-width: 120px;
							background-color: #000000aa;
							border: 2px solid #191970aa;
							color: #fff;
							text-align: center;
							border-radius: 6px;
							padding: 5px 10px;

							z-index: 1;

							/* Fade in tooltip - takes 1 second to go from 0% to 100% opac: */
							opacity: 0;
							transition: opacity 0.25s;

							gap: 4px;
							display: flex;
							flex-direction: column;

							position: absolute;
							transform: translateY(-30px);

							> .player {
								display: flex;
								align-items: center;
								justify-content: center;

								> .avatar {
									width: 20px;
								}

								> .name {
									margin-left: 8px;
								}
							}
						}

						&:hover > .tooltip {
							visibility: visible;
							opacity: 1;
						}
					}
				}

				> .launch {
					// float: right;
					// top: 55%;
					// position: relative;
					height: 50px;

					> .content {
						display: flex;
						flex-direction: row-reverse;
						width: 300px;
						height: 100%;
						text-align: right;

						> button {
							background: none;
							border: none;
							cursor: pointer;
							font-weight: 900;
							letter-spacing: 2px;
							text-shadow: 0px 0px 0px #bebcbb;
							font-size: 20px;
							padding: 0px;
							transition: 0.25s ease;
							outline: none;
							color: white;

							&:hover,
							&:focus {
								text-shadow: 0px 0px 20px #fff, 0px 0px 20px #fff;
							}

							&:active {
								color: #c7c7c7;
								text-shadow: 0px 0px 20px #c7c7c7, 0px 0px 20px #c7c7c7;
							}

							&:disabled {
								color: #c7c7c7;
								cursor: default;
								pointer-events: none;
							}
						}
					}

					> .details {
						position: relative;
						width: 300px;
						right: -20px;

						> .panel {
							display: flex;
							flex-direction: column;
							justify-content: center;
							align-items: flex-start;
							flex-wrap: wrap;
							align-content: flex-end;
							height: 50px;

							> .top {
								display: flex;

								> .progress-label {
									font-weight: 900;
									letter-spacing: 1px;
									text-shadow: 0px 0px 0px #bebcbb;
									font-size: 20px;
									min-width: 53.21px;
									max-width: 100.21px;
									text-align: right;
								}
							}

							> .bottom {
								width: 100%;
								display: flex;
								flex-direction: column;
								justify-content: center;

								> .progress {
									--_track: hsla(0, 0%, 100%, 0);
									--_progress: hsl(0, 0%, 100%);
									height: 3px;
									width: 100%;
									background-color: transparent;
									appearance: none;

									&:indeterminate {
										block-size: 0;
										margin-bottom: 3px;

										&::after {
											content: '';
											position: absolute;
											background: linear-gradient(
												to right,
												var(--_track) 45%,
												var(--_progress) 0%,
												var(--_progress) 55%,
												var(--_track) 0%
											);
											background-size: 225% 100%;
											background-position: right;
											animation: progress-loading 2s infinite ease;
											width: 100%;
											height: 3px;
											outline: 1px solid white;
										}
									}

									&[value] {
										outline: 1px solid white;

										&::-webkit-progress-bar {
											background-color: transparent;
										}

										&::-webkit-progress-value {
											transition: width 0.5s;
											background-color: #fff;
										}
									}
								}

								> .text {
									font-size: 11px;
									text-overflow: ellipsis;
									white-space: nowrap;
									overflow: hidden;
								}
							}

							> .text {
								// font-size: 11px;
								font-weight: bold;
								text-overflow: ellipsis;
								white-space: nowrap;
								overflow: hidden;
							}
						}
					}
				}
			}
		}

		.bot-label {
			font-size: 15px;
			letter-spacing: 1px;
			font-weight: bold;
			text-shadow: 0px 0px 0px #bebcbb;
		}

		// .bot-divider {
		// 	height: 2px;
		// 	width: 100%;
		// 	background: rgba(107, 105, 105, 0.7);
		// 	margin-right: 20px;
		// }
	}

	@keyframes progress-loading {
		50% {
			background-position: left;
		}
	}
</style>
