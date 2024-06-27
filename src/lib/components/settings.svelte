<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { View } from '$lib/types/+page';
	import * as script from '$lib/scripts/settings';
	import Account from './settings-tabs/account.svelte';
	import Minecraft from './settings-tabs/minecraft.svelte';
	import Java from './settings-tabs/java.svelte';
	import Launcher from './settings-tabs/launcher.svelte';
	import About from './settings-tabs/about.svelte';
	import Update from './settings-tabs/update.svelte';
	import { fade } from 'svelte/transition';
	import { c_tab, Tab } from '$lib/stores/settings';

	const tabs = [Account, Minecraft, Java, Launcher, About, Update];

	let tab_component: typeof Account;

	function changeTab(tab: Tab) {
		return () => {
			$c_tab = tab;
		};
	}

	function done() {
		changeView(View.landing);
	}

	$: tab_component = tabs[$c_tab];
</script>

<div class="settings">
	<div class="container-left">
		<div class="nav-container">
			<div class="nav-header">
				<span class="text">{$_('settings.nav.headerText')}</span>
			</div>
			<div class="nav-items">
				<div class="content">
					<button
						class="nav-item"
						data-rsc="account"
						data-selected={$c_tab === Tab.account ? 'true' : 'false'}
						on:click={changeTab(Tab.account)}
					>
						{$_('settings.nav.account')}
					</button>
					<button
						class="nav-item"
						data-rsc="minecraft"
						data-selected={$c_tab === Tab.minecraft ? 'true' : 'false'}
						on:click={changeTab(Tab.minecraft)}
					>
						{$_('settings.nav.minecraft')}
					</button>
					<button
						class="nav-item"
						data-rsc="java"
						data-selected={$c_tab === Tab.java ? 'true' : 'false'}
						on:click={changeTab(Tab.java)}
					>
						{$_('settings.nav.java')}
					</button>
					<button
						class="nav-item"
						data-rsc="launcher"
						data-selected={$c_tab === Tab.launcher ? 'true' : 'false'}
						on:click={changeTab(Tab.launcher)}
					>
						{$_('settings.nav.launcher')}
					</button>
					<div class="nav-spacer" />
					<button
						class="nav-item"
						data-rsc="about"
						data-selected={$c_tab === Tab.about ? 'true' : 'false'}
						on:click={changeTab(Tab.about)}
					>
						{$_('settings.nav.about')}
					</button>
					<button
						class="nav-item"
						data-rsc="updates"
						data-selected={$c_tab === Tab.update ? 'true' : 'false'}
						on:click={changeTab(Tab.update)}
					>
						{$_('settings.nav.updates')}
					</button>
					<div class="bottom">
						<div class="nav-divider" />
						<button
							class="nav-done"
							bind:this={script.elements.navDone}
							on:click={done}
						>
							{$_('settings.nav.done')}
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
	<div class="container-right">
		{#key tab_component}
			<div in:fade={{ delay: 250, duration: 250 }} out:fade={{ duration: 250 }}>
				<svelte:component this={tab_component} />
			</div>
		{/key}
		<!--  -->
	</div>
</div>

<style lang="scss" global="true">
	.settings {
		width: 100%;
		height: 100%;
		overflow-y: auto;
		position: relative;
		display: flex;
		background-color: rgba(0, 0, 0, 0.5);
		transition: background-color 0.25s cubic-bezier(0.02, 0.01, 0.47, 1);

		&::before {
			content: '';
			background: linear-gradient(rgba(0, 0, 0, 0.25), transparent);
			width: 100%;
			height: 5px;
			position: absolute;
			opacity: 0;
			transition: opacity 0.25s ease;
		}

		&[scrolled]::before {
			opacity: 1;
		}

		> .container-left {
			padding-top: 4%;
			height: 100%;
			width: 20%;
			box-sizing: border-box;

			> .nav-container {
				height: 100%;
				display: flex;
				flex-direction: column;

				> .nav-header {
					height: 15%;
					display: flex;
					justify-content: center;

					> .text {
						font-size: 20px;
					}
				}

				> .nav-items {
					height: 85%;
					display: flex;
					justify-content: center;
					box-sizing: border-box;

					> .content {
						height: 100%;
						display: flex;
						flex-direction: column;
						position: relative;

						> .nav-item {
							background: none;
							border: none;
							text-align: center;
							margin: 5px 0px;
							padding: 0px 20px;
							color: gray;
							cursor: pointer;
							outline: none;
							transition: 0.25s ease;

							&:hover,
							&:focus {
								color: #c1c1c1;
								text-shadow: 0px 0px 20px #c1c1c1;
							}

							&[data-selected='true'] {
								cursor: default;
								color: white;
								text-shadow: none;
							}
						}

						> .nav-spacer {
							height: 25px;
						}

						> .bottom {
							position: absolute;
							top: 65%;
							width: 100%;

							> .nav-divider {
								width: 60%;
								height: 1px;
								background: rgba(126, 126, 126, 0.57);
								margin-left: auto;
								margin-right: auto;
								margin-bottom: 25px;
							}

							> .nav-done {
								background: none;
								border: none;
								text-align: center;
								margin: 5px 0px;
								padding: 0px 20px;
								color: white;
								cursor: pointer;
								outline: none;
								transition: 0.25s ease;
								width: 100%;

								&:hover,
								&:focus {
									text-shadow: 0px 0px 20px white, 0px 0px 20px white,
										0px 0px 20px white;
								}

								&:active {
									text-shadow: 0px 0px 20px rgba(255, 255, 255, 0.75),
										0px 0px 20px rgba(255, 255, 255, 0.75),
										0px 0px 20px rgba(255, 255, 255, 0.75);
									color: rgba(255, 255, 255, 0.75);
								}

								&:disabled {
									color: rgba(255, 255, 255, 0.75);
									pointer-events: none;
								}
							}
						}
					}
				}
			}
		}

		> .container-right {
			height: 100%;
			width: 80%;
			box-sizing: border-box;
			overflow-y: hidden;

			> div {
				width: 100%;
				height: 100%;

				> .settings-tab {
					width: 100%;
					height: 100%;
					overflow-y: auto;

					> *:first-child {
						margin-top: 5%;
					}

					> *:last-child {
						margin-bottom: 20%;
					}

					> .tab-header {
						display: flex;
						flex-direction: column;
						margin-bottom: 20px;

						> .text {
							font-size: 20px;
							font-family: 'Avenir Medium';
						}

						> .desc {
							font-size: 12px;
						}
					}

					> .field-container {
						display: flex;
						align-items: center;
						justify-content: space-between;
						padding: 20px 0px;
						width: 80%;
						border-bottom: 1px solid rgba(255, 255, 255, 0.5);

						> .left {
							display: flex;
							flex-direction: column;

							> .title {
								font-size: 14px;
								font-family: 'Avenir Medium';
								color: rgba(255, 255, 255, 0.95);
							}

							> .desc {
								font-size: 12px;
								color: rgba(255, 255, 255, 0.95);
								margin-top: 5px;
							}
						}

						> .right {
							> .toggle-switch {
								position: relative;
								display: inline-block;
								width: 40px;
								height: 20px;
								border-radius: 50px;
								box-sizing: border-box;

								> input {
									display: none;

									&:checked + .toggle-switch-clider {
										background-color: rgb(31, 140, 11);
										border: 1px solid rgb(31, 140, 11);
									}

									&:checked + .toggle-switch-clider::before {
										transform: translateX(15px);
									}
								}

								> .toggle-switch-clider {
									position: absolute;
									cursor: pointer;
									top: 0;
									left: 0;
									right: 0;
									bottom: 0;
									background-color: rgba(255, 255, 255, 0.35);
									transition: 0.4s;
									border-radius: 50px;
									border: 1px solid rgba(126, 126, 126, 0.57);

									&::before {
										position: absolute;
										content: '';
										height: 13px;
										width: 16px;
										left: 3px;
										bottom: 3px;
										background-color: white;
										box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.75);
										border-radius: 50px;
										transition: 0.4s;
									}
								}
							}
						}
					}

					> .file-sel-container {
						display: flex;
						flex-direction: column;
						border-bottom: 1px solid rgba(255, 255, 255, 0.5);
						margin-bottom: 20px;
						margin-top: 20px;
						width: 80%;

						> .title {
							margin-bottom: 10px;
						}

						> .content {
							> .java-exec-details {
								font-weight: bold;
								color: gray;
								font-size: 12px;
							}

							> .actions {
								display: flex;
								width: 90%;

								> .file-sel-icon {
									display: flex;
									align-items: center;
									background: rgba(126, 126, 126, 0.57);
									border-radius: 3px 0px 0px 3px;
									padding: 5px;
									transition: 0.25s ease;

									> .file-sel-svg {
										width: 20px;
										height: 20px;
										fill: white;
									}
								}

								> .file-sel-val {
									border-radius: 0px !important;
									width: 100%;
									padding: 5px 10px;
									font-size: 12px;
									height: 18px;
								}

								> .file-sel-button {
									border: 0px;
									border-radius: 0px 3px 3px 0px;
									font-size: 12px;
									padding: 0px 5px;
									cursor: pointer;
									background: rgba(126, 126, 126, 0.57);
									transition: 0.25s ease;
									white-space: nowrap;
									outline: none;

									&:hover,
									&:focus {
										text-shadow: 0px 0px 20px white;
									}

									&:active {
										text-shadow: 0px 0px 20px rgba(255, 255, 255, 0.75);
										color: rgba(255, 255, 255, 0.75);
									}
								}
							}
						}

						> .desc {
							font-size: 10px;
							margin: 20px 0px;
							color: lightgray;
							width: 89%;

							& strong {
								font-family: 'Avenir Medium';
							}
						}
					}

					> .auth-account-type-container {
						display: flex;
						width: 80%;
						flex-direction: column;

						> .header {
							display: flex;
							align-items: center;
							width: 100%;
							justify-content: space-between;
							padding: 10px 0px;
							border-bottom: 1px solid #ffffff85;
							margin-bottom: 30px;

							> .left {
								display: flex;
								column-gap: 5px;
							}

							> .right {
								> .add-auth-account {
									background: none;
									border: none;
									text-align: left;
									padding: 2px 0px;
									color: white;
									cursor: pointer;
									outline: none;
									transition: 0.25s ease;

									&:hover,
									&:focus {
										text-shadow: 0px 0px 20px white, 0px 0px 20px white,
											0px 0px 20px white;
									}

									&:active {
										text-shadow: 0px 0px 20px rgba(255, 255, 255, 0.75),
											0px 0px 20px rgba(255, 255, 255, 0.75),
											0px 0px 20px rgba(255, 255, 255, 0.75);
										color: rgba(255, 255, 255, 0.75);
									}

									&:disabled {
										color: rgba(255, 255, 255, 0.75);
										pointer-events: none;
									}
								}
							}
						}

						> .current-accounts {
							margin-bottom: 5%;

							> .auth-account {
								display: flex;
								background: rgba(0, 0, 0, 0.25);
								border-radius: 3px;
								border: 1px solid rgba(126, 126, 126, 0.57);

								> .left {
									padding: 5px 5px 5px 20px;

									> .image {
										height: 115px;
									}
								}

								> .right {
									display: flex;
									width: 100%;

									> .details {
										display: flex;
										flex-direction: column;
										justify-content: center;
										margin-left: 20px;
										width: 100%;

										& > *:not(:last-child) {
											margin-bottom: 20px;
										}

										> .pane {
											display: flex;
											flex-direction: column;

											> .title {
												font-size: 12px;
												color: gray;
												font-weight: bold;
												font-family: 'Avenir Medium';
											}

											> .value {
												font-size: 14px;
												user-select: initial;
											}
										}
									}

									> .actions {
										display: flex;
										flex-direction: column;
										justify-content: space-between;
										align-items: flex-end;
										padding: 10px;

										> .select {
											opacity: 0;
											border: none;
											white-space: nowrap;
											background: none;
											font-family: 'Avenir Medium';
											outline: none;
											transition: 0.25s ease;

											&:hover[data-selected='false'],
											&:focus[data-selected='false'] {
												text-shadow: 0px 0px 20px white, 0px 0px 20px white;
												cursor: pointer;
											}

											&[data-selected='true'] {
												pointer-events: none;
											}
										}

										> .wrapper {
											> .logout {
												opacity: 0;
												border: 1px solid rgb(241, 55, 55);
												color: rgb(241, 55, 55);
												background: none;
												font-size: 12px;
												border-radius: 3px;
												font-family: 'Avenir Medium';
												transition: 0.25s ease;
												cursor: pointer;
												outline: none;

												&:hover,
												&:focus {
													box-shadow: 0px 0px 20px rgb(241, 55, 55);
													background: rgba(241, 55, 55, 0.25);
												}

												&:active {
													box-shadow: 0px 0px 20px rgb(185, 47, 47);
													background: rgba(185, 47, 47, 0.25);
													border: 1px solid rgb(185, 47, 47);
													color: rgb(185, 47, 47);
												}
											}
										}
									}
								}

								&:not(:last-child) {
									margin-bottom: 10px;
								}

								&:not(:first-child) {
									margin-top: 10px;
								}

								&:hover .select[data-selected='false'],
								& > .right > .actions > .select[data-selected='true'] {
									opacity: 1;
								}

								&:hover > .right > .actions > .wrapper > .logout {
									opacity: 1;
								}
							}
						}
					}

					> .game-resolution-container {
						display: flex;
						flex-direction: column;
						padding-bottom: 20px;
						border-bottom: 1px solid rgba(255, 255, 255, 0.5);
						width: 80%;

						> .content {
							display: flex;
							align-items: center;
							padding-top: 10px;

							> .cross {
								color: gray;
								padding: 0px 15px;
							}

							> #game-width,
							> #game-height {
								padding: 7.5px 5px;
								width: 75px;
							}
						}
					}

					&.tab-java {
						a {
							color: rgba(202, 202, 202, 0.75);
							transition: 0.25s ease;
							outline: none;

							&:hover,
							&:focus {
								color: rgba(255, 255, 255, 0.75);
							}

							&:active {
								color: rgba(165, 165, 165, 0.75);
							}
						}
					}

					.memory-container {
						width: 80%;
						display: flex;
						flex-direction: column;
						border-bottom: 1px solid rgba(255, 255, 255, 0.5);
						margin-bottom: 20px;

						> .title {
							margin-bottom: 10px;
							padding-bottom: 5px;
							border-bottom: 1px solid rgba(255, 255, 255, 0.5);
						}

						> .content {
							display: flex;
							justify-content: space-between;
							width: 100%;

							> .left {
								width: 69%;

								.action-container {
									display: flex;
									align-items: center;
									justify-content: space-between;

									> .label {
										font-size: 14px;
										margin-right: 2%;
									}

									> #max-ram-range,
									> #min-ram-range {
										width: 85%;
									}
								}

								> .memory-desc {
									font-size: 10px;
									margin: 20px 0px;
									color: lightgray;
									font-weight: bold;
								}
							}

							> .right {
								display: flex;
								align-items: center;
								margin-right: 10%;

								> .memory-status {
									display: flex;
									flex-direction: column;

									> .status-container {
										display: flex;
										flex-direction: column;
										align-items: center;

										> .title {
											font-size: 12px;
											color: gray;
											font-weight: bold;
										}

										> .status-value {
											color: lightgray;
											font-size: 16px;
										}

										&:not(:last-child) {
											margin-bottom: 50%;
										}
									}
								}
							}

							> .left,
							> .right {
								> .header {
									font-size: 14px;
								}
							}
						}
					}

					> .jvm-opts-container {
						width: 80%;

						> .title {
							margin-bottom: 10px;
						}

						> .content {
							display: flex;
							width: 90%;

							> .file-sel-icon {
								display: flex;
								align-items: center;
								background: rgba(126, 126, 126, 0.57);
								border-radius: 3px 0px 0px 3px;
								padding: 5px;
								transition: 0.25s ease;

								> .file-sel-svg {
									width: 20px;
									height: 20px;
									fill: white;
								}
							}

							> #jvm-opts-val {
								border-radius: 0px 3px 3px 0px !important;
								width: 100%;
								padding: 5px 10px;
								font-size: 12px;
							}

							&:focus-within > .java-icon {
								background: rgba(126, 126, 126, 0.87);
							}
						}

						> .jvm-opts-desc {
							font-size: 10px;
							margin: 20px 0px;
							color: lightgray;
							font-weight: bold;
							width: 89%;
						}
					}

					> .about-current-container {
						display: flex;
						flex-direction: column;
						background: rgba(0, 0, 0, 0.25);
						border: 1px solid rgba(126, 126, 126, 0.57);
						border-radius: 3px;
						width: 80%;
						margin-bottom: 20px;

						> .content {
							display: flex;
							flex-direction: column;
							padding: 15px;

							> .headline {
								display: flex;
								align-items: center;
								padding-bottom: 5px;
								border-bottom: 1px solid rgba(126, 126, 126, 0.57);

								> .logo {
									width: 30px;
									height: 30px;
									padding: 5px;
								}

								> .title {
									font-size: 23px;
									padding-left: 10px;
								}
							}

							> .version {
								display: flex;
								align-items: center;
								padding-top: 10px;

								> .check {
									border-radius: 50%;
									background: #23aa23;
									text-align: center;
									font-weight: bold;
									margin: 11px 12px;
									color: white;
									height: 15px;
									width: 15px;
									font-size: 12px;
									line-height: 17px;
								}

								> .details {
									margin-left: 10px;

									> .title {
										font-size: 12px;
										font-family: 'Avenir Medium';
										color: #23aa23;
										font-weight: bold;
									}

									> .line {
										font-size: 10px;
										color: gray;
										font-weight: bold;
									}
								}
							}
						}

						> .buttons {
							display: flex;
							padding: 0px 15px;
							margin-bottom: 5px;

							> .about-button {
								background: none;
								border: none;
								font-size: 10px;
								color: gray;
								padding: 0px 5px;
								transition: 0.25s ease;
								outline: none;
								text-decoration: none;

								&:hover,
								&:focus {
									color: rgb(165, 165, 165);
								}

								&:active {
									color: rgba(124, 124, 124, 0.75);
								}
							}
						}
					}

					> .changelog-container {
						display: flex;
						flex-direction: column;
						background: rgba(0, 0, 0, 0.25);
						border: 1px solid rgba(126, 126, 126, 0.57);
						border-radius: 3px;
						width: 80%;
						margin-bottom: 20px;

						> .content {
							display: flex;
							flex-direction: column;
							padding: 15px;

							> .headline {
								padding-bottom: 10px;
								margin-bottom: 10px;
								border-bottom: 1px solid rgba(126, 126, 126, 0.57);

								> .label {
									font-size: 12px;
									color: gray;
									font-weight: bold;
								}
							}

							> .text {
								font-size: 12px;

								p {
									margin-bottom: 16px;
									line-height: 1.5;
								}

								blockquote {
									border-left: 0.25em solid rgba(126, 126, 126, 0.95);
									margin: 0px;
									padding: 0 0 0 1em;
									color: rgba(255, 255, 255, 0.85);
								}

								code {
									padding: 0.1em 0.4em;
									font-size: 85%;
									background-color: rgba(255, 255, 255, 0.25);
									color: white;
									border-radius: 3px;
									font-family: 'Avenir Book';
								}

								li + li {
									margin-top: 0.25em;
								}

								a.commit-link {
									font-weight: 400;
									color: #ffffff;
									text-decoration: none;

									&:hover {
										text-decoration: underline !important;
										text-decoration-color: black;

										tt {
											text-decoration: underline;
											text-decoration-color: black;
										}
									}
								}

								tt {
									padding: 0.1em 0.4em;
									font-size: 86%;
									background-color: white;
									border-radius: 3px;
									color: black;
									font-weight: bold;
								}

								.highlight {
									background: rgba(0, 0, 0, 0.3);
									user-select: initial;
									padding: 5px 10px;

									pre {
										margin: 0px;
									}
								}
							}
						}

						> .actions {
							padding: 0px 15px 5px 15px;

							> .button {
								padding: 0px;
							}

							> .about-button {
								background: none;
								border: none;
								font-size: 10px;
								color: grey;
								padding: 0px 5px;
								transition: 0.25s ease;
								outline: none;
								text-decoration: none;

								&:hover,
								&:focus {
									color: rgb(165, 165, 165);
								}

								&:active {
									color: rgb(124, 124, 124, 0.75);
								}
							}
						}

						a {
							color: rgba(202, 202, 202, 0.75);
							transition: 0.25s ease;
							outline: none;

							&:hover,
							&:focus {
								color: rgba(255, 255, 255, 0.75);
							}

							&:active {
								color: rgba(165, 165, 165, 0.75);
							}
						}
					}

					> .status-container {
						display: flex;
						flex-direction: column;
						background: rgba(0, 0, 0, 0.25);
						border: 1px solid rgba(126, 126, 126, 0.57);
						border-radius: 3px;
						width: 80%;
						margin-bottom: 20px;

						> .content {
							display: flex;
							flex-direction: column;
							padding: 15px;

							> .headline {
								display: flex;
								align-items: center;
								padding-bottom: 5px;
								border-bottom: 1px solid rgba(126, 126, 126, 0.57);

								> .title {
									font-size: 16px;
									padding-left: 10px;
									font-weight: bold;
								}
							}

							> .version {
								display: flex;
								align-items: center;
								padding: 10px 0px;
								border-bottom: 1px solid rgba(126, 126, 126, 0.57);

								> .check {
									border-radius: 50%;
									background: #23aa23;
									text-align: center;
									font-weight: bold;
									margin: 11px 12px;
									color: white;
									height: 15px;
									width: 15px;
									font-size: 12px;
									line-height: 17px;
								}

								> .details {
									margin-left: 10px;

									> .title {
										font-size: 12px;
										font-family: 'Avenir Medium';
										color: #23aa23;
										font-weight: bold;
									}

									> .line {
										font-size: 10px;
										color: grey;
										font-weight: bold;
									}
								}
							}

							> .action-container {
								display: flex;
								align-items: center;
								padding-top: 10px;
								font-size: 14px;
								font-weight: bold;
								height: 21px;

								> .progress {
									display: flex;
									align-items: center;
									flex-direction: row;

									> .label {
										margin-left: 10px;
										margin-right: 10px;
										font-size: 14px;
										font-family: 'Avenir Medium';
										font-weight: bold;
									}

									> progress {
										border-radius: 5px;

										&[value] {
											height: 5px;
											width: 180px;
											appearance: none;
											outline: 1px solid white;
											background-color: transparent;

											&::-webkit-progress-bar {
												background-color: transparent;
											}

											&::-webkit-progress-value {
												transition: width 0.5s;
												background-color: #fff;
											}
										}
									}
								}

								> .button {
									display: flex;
									flex-direction: column;
									padding-left: 10px;
									background: none;
									border: none;
									font-size: 14px;
									font-weight: bold;
									cursor: pointer;
									outline: none;
									text-align: left;
									transition: 0.25s ease;

									&:hover,
									&:focus {
										text-shadow: 0px 0px 20px white, 0px 0px 20px white,
											0px 0px 20px white;
									}

									&:active {
										text-shadow: 0px 0px 20px #c7c7c7, 0px 0px 20px #c7c7c7,
											0px 0px 20px #c7c7c7;
										color: #c7c7c7;
									}

									&:disabled {
										pointer-events: none;
									}
								}
							}
						}
					}

					> .language-selector {
						width: 80%;
						border-bottom: 1px solid rgba(255, 255, 255, 0.5);

						> .content {
							margin-bottom: 20px;

							select {
								height: 2em;
								width: 8em;
								margin-top: 8px;
							}
						}
					}

					> .title-color {
						> .content {
							margin-top: 5px;
							margin-bottom: 20px;
							display: flex;
							align-items: center;

							> .color-picker {
								margin-left: 10px;
								inline-size: 60px;
								block-size: 30px;
								background-color: transparent;
								border: none;
								padding: 0px;
							}
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
			}
		}

		input[type='number']::-webkit-inner-spin-button {
			-webkit-appearance: none;
		}

		input[type='number'],
		input[type='text'],
		select {
			color: white;
			background: rgba(0, 0, 0, 0.25);
			border-radius: 3px;
			border: 1px solid rgba(126, 126, 126, 0.57);
			font-family: 'Avenir Book';
			transition: 0.25s ease;

			&:focus {
				outline: none;
				border-color: rgba(126, 126, 126, 0.87);
			}

			&[data-error] {
				border-color: rgb(255, 27, 12);
				background: rgba(236, 0, 0, 0.25);
				color: rgb(255, 27, 12);
			}
		}
	}

	.range-slider {
		width: 35%;
		height: 5px;
		margin: 15px 0px;
		background: gray;
		border-radius: 3px;
		position: relative;

		> .range-slider-bar {
			position: absolute;
			background: #8be88b;
			width: 50%;
			height: 5px;
			border-radius: 3px 0px 0px 3px;
			transition: background 0.25s ease;
		}

		> .range-slider-track {
			position: absolute;
			top: -7.5px;
			width: 10px;
			height: 20px;
			background: white;
			border-radius: 3px;
			left: 50%;
			cursor: ew-resize;
		}
	}
</style>
