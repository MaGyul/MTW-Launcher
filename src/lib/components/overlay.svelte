<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { View } from '$lib/types/+page';
	import {
		title,
		desc,
		acknowledge,
		dismiss,
		confirmHandler,
		dismissHandler,
	} from '$lib/stores/overlay';
	import AccountListing from './overlay.account.svelte';

	const accountsObj = config.getAuthAccounts();
	const accounts = Array.from(Object.keys(accountsObj), (v) => accountsObj[v as any]);
	let selectedAccount: any = accounts.length == 0 ? '' : accounts[0].uuid;

	function accountSelect(uuid: any) {
		return () => {
			selectedAccount = uuid;
		};
	}
	function accountBtn(type: 'confirm' | 'cancel') {
		return () => {
			if (type === 'confirm') {
				const authAcc = config.setSelectedAccount(selectedAccount);
				config.save();
				//updateSelectedAccount(authAcc);
				if (currentView() === View.settings) {
					//await prepareSettings();
				}
				//toggleOverlay(false);
				//validateSelectedAccount();
			} else {
				view = 'content';
			}
		};
	}

	function keyHandler(e: KeyboardEvent) {
		if (dismissable) {
			if (e.key == 'Enter') {
				$confirmHandler();
			} else if (e.key == 'Escape') {
				$dismissHandler();
			}
		} else {
			if (e.key == 'Enter') {
				accountBtn('confirm')();
			}
		}
	}

	export let dismissable: boolean;
	export let view: 'account' | 'content';

	onMount(() => {
		document.addEventListener('keydown', keyHandler);

		return () => {
			document.removeEventListener('keydown', keyHandler);
		};
	});
</script>

<div class="overlay">
	{#if view === 'account'}
		<div
			class="account-content"
			in:fade={{ delay: 250, duration: 250 }}
			out:fade={{ duration: 250 }}
		>
			<span class="header">{$_('overlay.header')}</span>
			<div class="list">
				<div class="scrollable">
					{#each accounts as { uuid, displayName }}
						<AccountListing
							{uuid}
							selected={selectedAccount === uuid}
							name={displayName}
							on:click={accountSelect(uuid)}
						/>
					{/each}
				</div>
			</div>
			<div class="actions">
				<button class="confirm" type="submit" on:click={accountBtn('confirm')}>
					{$_('overlay.confirm')}
				</button>
				<div class="wrapper">
					<button class="cancel" on:click={accountBtn('cancel')}>
						{$_('overlay.cancel')}
					</button>
				</div>
			</div>
		</div>
	{:else if view === 'content'}
		<div class="content" in:fade={{ delay: 250, duration: 250 }} out:fade={{ duration: 250 }}>
			<span class="title">{@html $_($title)}</span>
			<span class="desc">{@html $_($desc)}</span>
			<div class="action-container">
				<button class="confirm" on:click={$confirmHandler}>{$_($acknowledge)}</button>
				<div class="wrapper">
					{#if dismissable}
						<button class="dismiss" on:click={$dismissHandler}>{$_($dismiss)}</button>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>

<style lang="scss" global>
	.overlay {
		position: absolute;
		z-index: 500;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		top: 0;

		> .account-content {
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: center;
			height: 75%;

			> .header {
				font-family: 'Avenir Medium';
				font-size: 20px;
				font-weight: bold;
				color: #fff;
				margin-bottom: 25px;
			}

			> .list {
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				max-height: 65%;
				min-height: 40%;

				> .scrollable {
					padding: 0px 5px;
					overflow-y: scroll;

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

			> .actions {
				display: flex;
				flex-direction: column;
				justify-content: center;
				align-items: center;
				margin-top: 25px;

				> .confirm {
					background: none;
					border: 1px solid #ffffff;
					color: white;
					font-family: 'Avenir Medium';
					font-weight: bold;
					border-radius: 2px;
					padding: 0px 8.1px;
					cursor: pointer;
					transition: 0.25s ease;
					min-height: 20.67px;

					&:hover,
					&:focus {
						box-shadow: 0px 0px 10px 0px #fff;
						outline: none;
					}

					&:active {
						border-color: rgba(255, 255, 255, 0.75);
						color: rgba(255, 255, 255, 0.75);
					}
				}

				> .wrapper > .cancel {
					font-weight: bold;
					font-size: 10px;
					text-decoration: none;
					padding-top: 2.5px;
					color: rgba(202, 202, 202, 0.75);
					transition: 0.25s ease;
					background: none;
					border: none;
					outline: none;
					cursor: pointer;

					&:hover,
					&:focus {
						color: rgba(255, 255, 255, 0.75);
					}

					&:active {
						color: rgba(165, 165, 165, 0.75);
					}
				}
			}
		}

		> .content {
			position: relative;
			display: flex;
			flex-direction: column;
			align-items: center;
			width: 800px;
			box-sizing: border-box;
			padding: 15px 0px;
			text-align: center;

			a,
			.dismiss {
				color: rgba(202, 202, 202, 0.75);
				transition: 0.25s ease;

				&:hover,
				&:focus {
					color: rgba(255, 255, 255, 0.75);
				}

				&:active {
					color: rgba(165, 165, 165, 0.75);
				}
			}

			> * {
				margin: 8px 0px;

				&:first-child {
					margin-top: 0px !important;
				}

				&:last-child {
					margin-bottom: 0px !important;
				}
			}

			> .title {
				font-family: 'Avenir Medium';
				font-size: 20px;
				font-weight: bold;
				letter-spacing: 1px;
				user-select: initial;
			}

			> .desc {
				font-size: 12px;
				font-weight: bold;
				user-select: initial;
			}

			> .action-container {
				display: flex;
				flex-direction: column;
				justify-content: center;

				> .confirm {
					background: none;
					border: 1px solid #ffffff;
					color: white;
					font-family: 'Avenir Medium';
					font-weight: bold;
					border-radius: 2px;
					padding: 0px 8.1px;
					cursor: pointer;
					transition: 0.25s ease;

					&:hover,
					&:focus {
						box-shadow: 0px 0px 10px 0px #fff;
						outline: none;
					}

					&:active {
						border-color: rgba(255, 255, 255, 0.75);
						color: rgba(255, 255, 255, 0.75);
					}
				}

				> .wrapper > .dismiss {
					font-weight: bold;
					font-size: 10px;
					text-decoration: none;
					padding-top: 2.5px;
					background: none;
					border: none;
					outline: none;
					cursor: pointer;

					&:hover {
						color: rgba(255, 255, 255, 0.75);
					}

					&:active {
						color: rgba(165, 165, 165, 0.75);
					}
				}
			}
		}
	}
</style>
