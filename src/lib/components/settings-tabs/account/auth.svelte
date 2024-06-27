<script lang="ts">
	import { _ } from 'svelte-i18n';
	import * as overlay from '$lib/stores/overlay';
	import * as loginOptions from '$lib/stores/loginOptions';
	import { msftLogoutLogger } from '$lib/scripts/settings';
	import { View } from '$lib/types/+page';
	import { updateSelectedAccount } from '$lib/stores/landing';

	export let uuid: string;
	export let username: string;
	export let selected: boolean = false;

	function select() {
		setSelectedAccount(uuid);
		if (window.refrashAccounts) window.refrashAccounts();
	}

	function logout() {
		let isLastAccount = false;
		if (Object.keys(config.getAuthAccounts()).length === 1) {
			isLastAccount = true;
			overlay.setContent(
				'settings.tab.account.auth.logout.lastAccountWarningTitle',
				'settings.tab.account.auth.logout.lastAccountWarningMessage',
				'settings.tab.account.auth.logout.confirmButton',
				'settings.tab.account.auth.logout.cancelButton',
			);
			overlay.setHandler(() => {
				processLogOut(isLastAccount);
				overlay.toggleOverlay(false);
			});
			overlay.setDismiss(() => {
				overlay.toggleOverlay(false);
			});
			overlay.toggleOverlay(true, true);
		} else {
			processLogOut(isLastAccount);
		}
	}

	function processLogOut(isLastAccount: boolean) {
		const targetAcc = config.getAuthAccount(uuid);
		if (targetAcc.type === 'microsoft') {
			syncReplyLogout();
			changeView(View.waiting, () => {
				electron.send(
					MTWNative.ipcconstants.MSFT_OPCODE.OPEN_LOGOUT,
					uuid,
					isLastAccount,
					$_('settings.tab.account.auth.logout.windowTitle'),
				);
			});
		}
	}

	function syncReplyLogout() {
		electron.receiveOne(MTWNative.ipcconstants.MSFT_OPCODE.REPLY_LOGOUT, (...args) => {
			if (args[0] === MTWNative.ipcconstants.MSFT_REPLY_TYPE.ERROR) {
				changeView(View.settings, () => {
					if (
						args.length > 1 &&
						args[1] === MTWNative.ipcconstants.MSFT_ERROR.NOT_FINISHED
					) {
						msftLogoutLogger.info('Logout cancelled by user.');
						return;
					}

					overlay.setContent(
						'settings.msft.logout.errorTitle',
						'settings.msft.logout.errorMessage',
						'settings.msft.logout.okButton',
					);
					overlay.setHandler(() => {
						overlay.toggleOverlay(false);
					});
					overlay.toggleOverlay(true);
				});
			} else if (args[0] === MTWNative.ipcconstants.MSFT_REPLY_TYPE.SUCCESS) {
				const uuid = args[1];
				const isLastAccount = args[2];
				const prevSelAcc = config.getSelectedAccount();

				msftLogoutLogger.info('Logout Successful. uuid:', uuid);

				MTWNative.authManager
					.removeMicrosoftAccount(uuid)
					.then(() => {
						if (!isLastAccount && uuid === prevSelAcc.uuid) {
							const selAcc = config.getSelectedAccount();
							updateSelectedAccount(selAcc);
							//
						}
						if (isLastAccount) {
							loginOptions.cancelEnabled.set(false);
							loginOptions.loginSuccess.set(View.settings);
							loginOptions.loginCancel.set(View.loginOptions);
							changeView(View.loginOptions);
						}
					})
					.finally(() => {
						if (!isLastAccount) {
							changeView(View.settings);
						}
					});
			}
		});
	}
</script>

<div class="auth-account" data-uuid={uuid}>
	<div class="left">
		<img class="image" alt={username} src="https://mc-heads.net/body/{uuid}/60" />
	</div>
	<div class="right">
		<div class="details">
			<div class="pane">
				<div class="title">{$_('settings.tab.account.auth.username')}</div>
				<div class="value">{username}</div>
			</div>
			<div class="pane">
				<div class="title">{$_('settings.tab.account.auth.uuid')}</div>
				<div class="value">{uuid}</div>
			</div>
		</div>
		<div class="actions">
			<button class="select" data-selected={selected} on:click={select}>
				{$_(`settings.tab.account.auth.${selected ? 'selected' : 'select'}`)}
			</button>
			<div class="wrapper">
				<button class="logout" on:click={logout}>
					{$_('settings.tab.account.auth.logout.text')}
				</button>
			</div>
		</div>
	</div>
</div>
