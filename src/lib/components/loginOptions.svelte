<script lang="ts">
	import { View } from '$lib/types/+page';
	import { _ } from 'svelte-i18n';
	import {
		cancelEnabled,
		loginSuccess,
		loginCancel,
		viewOnCancel,
		cancelHandler,
	} from '$lib/stores/loginOptions';
	import { onDestroy } from 'svelte';

	type LoginType = 'microsoft' | 'mojang';

	function login(type: LoginType) {
		return () => {
			if ($loginSuccess != View.empty && $loginCancel != View.empty) {
				if (type === 'microsoft') {
					changeView(View.waiting, () => {
						electron.send(
							MTWNative.ipcconstants.MSFT_OPCODE.OPEN_LOGIN,
							$loginSuccess,
							$loginCancel,
							$_('settings.msft.login.windowTitle'),
						);
					});
				} else {
					// setContext('loginview.success', successView);
					// setContext('loginview.cancel', cancelView);
					// changeView(View.login);
				}
			} else {
				console.error('Wrong');
			}
		};
	}

	function cancel() {
		if ($viewOnCancel != View.empty) {
			changeView($viewOnCancel, () => {
				$cancelHandler();
			});
		} else {
			console.error('Wrong');
		}
	}

	onDestroy(() => {
		cancelEnabled.set(false);
		cancelHandler.set(() => {});
	});
</script>

<div class="login-options">
	<div class="content">
		<div class="main">
			<h2>{$_('loginOptions.title')}</h2>
			<div class="actions">
				<div class="button-container">
					<button on:click={login('microsoft')}>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="22"
							height="22"
							viewBox="0 0 23 23"
						>
							<path fill="#f35325" d="M1 1h10v10H1z" />
							<path fill="#81bc06" d="M12 1h10v10H12z" />
							<path fill="#05a6f0" d="M1 12h10v10H1z" />
							<path fill="#ffba08" d="M12 12h10v10H12z" />
						</svg>
						<span>{$_('loginOptions.withMicrosoft')}</span>
					</button>
				</div>
				<div class="button-container">
					<button on:click={login('mojang')} disabled>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="22"
							height="22"
							viewBox="0 0 9.677 9.667"
						>
							<path
								d="M-26.332-12.098h2.715c-1.357.18-2.574 1.23-2.715 2.633z"
								fill="#fff"
							/>
							<path
								d="M2.598.022h7.07L9.665 7c-.003 1.334-1.113 2.46-2.402 2.654H0V2.542C.134 1.2 1.3.195 2.598.022z"
								fill="#db2331"
							/>
							<path
								d="M1.54 2.844c.314-.76 1.31-.46 1.954-.528.785-.083 1.503.272 2.1.758l.164-.9c.327.345.587.756.964 1.052.28.254.655-.342.86-.013.42.864.408 1.86.54 2.795l-.788-.373C6.9 4.17 5.126 3.052 3.656 3.685c-1.294.592-1.156 2.65.06 3.255 1.354.703 2.953.51 4.405.292-.07.42-.34.87-.834.816l-4.95.002c-.5.055-.886-.413-.838-.89l.04-4.315z"
								fill="#fff"
							/>
						</svg>
						<span>{$_('loginOptions.withMojang')}</span>
					</button>
				</div>
			</div>
			{#if $cancelEnabled == true}
				<div class="cancel-container">
					<button on:click={cancel}>{$_('loginOptions.cancel')}</button>
				</div>
			{/if}
		</div>
	</div>
</div>

<style lang="scss">
	.login-options {
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100%;
		width: 100%;
		transition: filter 0.25s ease;
		background: rgba(0, 0, 0, 0.5);

		> .content {
			border-radius: 3px;
			position: relative;
			top: -5%;

			> .main {
				display: flex;
				flex-direction: column;
				align-items: center;

				> h2 {
					margin-bottom: 1em;
				}

				> .actions {
					display: flex;
					flex-direction: column;
					align-items: center;

					> .button-container {
						width: 16em;
						margin-bottom: 8px;

						> button {
							background: rgba(0, 0, 0, 0.25);
							border: 1px solid rgba(126, 126, 126, 0.57);
							border-radius: 3px;
							height: 50px;
							width: 100%;
							text-align: left;
							padding: 0px 25px;
							cursor: pointer;
							outline: none;
							transition: 0.25s ease;
							display: flex;
							align-items: center;
							column-gap: 5px;

							&:hover:not([disabled]),
							&:focus:not([disabled]) {
								background: rgba(54, 54, 54, 0.25);
								text-shadow: 0px 0px 20px white;
							}

							&[disabled] {
								background: rgba(0, 0, 0, 0.5);
								border: 1px solid rgba(126, 126, 126, 0.8);
								color: gray;
								cursor: no-drop;
							}
						}
					}
				}

				> .cancel-container {
					position: absolute;
					bottom: -100px;

					> button {
						background: none;
						border: none;
						padding: 2px 0px;
						font-size: 16px;
						font-weight: bold;
						color: lightgrey;
						cursor: pointer;
						outline: none;
						transition: 0.25s ease;

						&:hover,
						&:focus {
							text-shadow: 0px 0px 20px lightgrey;
						}

						&:active {
							text-shadow: 0px 0px 20px rgba(211, 211, 211, 0.75);
							color: rgba(211, 211, 211, 0.75);
						}

						&:disabled {
							color: rgba(211, 211, 211, 0.75);
							pointer-events: none;
						}
					}
				}
			}
		}
	}
</style>
