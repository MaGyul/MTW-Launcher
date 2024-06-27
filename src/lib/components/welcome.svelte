<script lang="ts">
	import { View } from '$lib/types/+page';
	import * as loginOptions from '$lib/stores/loginOptions';
	import { _ } from 'svelte-i18n';

	let currentLang = config.getLanguage();
	let langs = window.langs;

	function langChange() {
		config.setLanguage(currentLang);
		config.save();
		window.setLocale(currentLang);
	}

	function continueBtn() {
		loginOptions.cancelEnabled.set(false);
		loginOptions.loginSuccess.set(View.landing);
		loginOptions.loginCancel.set(View.loginOptions);
		changeView(View.loginOptions);
	}
</script>

<div class="welcome">
	<div class="content">
		<!-- svelte-ignore a11y-img-redundant-alt -->
		<img class="image" src="icon_256x256.png" alt="welcome-image" />
		<span class="header">{$_('welcome.header')}</span>
		<span class="description">{@html $_('welcome.description')}</span>
		<br />
		<button class="button" on:click={continueBtn}>
			<div class="content">
				{$_('welcome.continue')}
				<svg viewBox="0 0 24.87 13.97">
					<defs>
						<style>
							.arrowLine {
								fill: none;
								stroke: #fff;
								stroke-width: 2px;
								transition: 0.25s ease;
							}
						</style>
					</defs>
					<polyline class="arrowLine" points="0.71 13.26 12.56 1.41 24.16 13.02" />
				</svg>
			</div>
		</button>
	</div>
	<select bind:value={currentLang} on:change={langChange}>
		{#each langs() as lang}
			<option value={lang}>{$_(`settings.langs.${lang}`)}</option>
		{/each}
	</select>
</div>

<style lang="scss">
	.welcome {
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100%;
		width: 100%;
		background: rgba(0, 0, 0, 0.5);

		> select {
			position: absolute;
			top: 10px;
			left: 10px;
			width: 10em;
			height: 2em;
			background: rgba(0, 0, 0, 0.5);
			color: white;
			border-radius: 5px;
		}

		> .content {
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: center;
			width: 50%;
			top: -10%;
			position: relative;

			> .image {
				height: 125px;
				width: 125px;
				margin-bottom: 5%;
				margin-top: 10%;
			}

			> .header {
				font-family: 'Avenir Medium';
				text-align: center;
				color: white;
				margin-bottom: 25px;
				letter-spacing: 1px;
				font-size: 20px;
				text-shadow: white 0px 0px 0px;
			}

			> .description {
				text-align: justify;
				font-size: 13px;
				font-weight: 100;
				text-shadow: rgba(255, 255, 255, 0.75) 0px 0px 20px;
			}

			> .button {
				background: none;
				font-weight: bold;
				letter-spacing: 2px;
				border: none;
				padding: 15px 5px;
				margin: 10px 0px;
				cursor: pointer;
				position: relative;
				right: -20px;
				transition: 0.5s ease;
				margin-top: 5%;
				margin-bottom: -5%;

				&:disabled {
					color: rgba(255, 255, 255, 0.75);
					pointer-events: none;

					> .content > svg > .arrowLine {
						stroke: rgba(255, 255, 255, 0.75);
					}
				}

				&:hover,
				&:focus {
					text-shadow: 0px 0px 20px #fff;
					outline: none;

					> .content > svg {
						filter: drop-shadow(0px 0px 2px #fff);
					}
				}

				&:active {
					color: #c7c7c7;
					text-shadow: 0px 0px 20px #c7c7c7;

					> .content > svg {
						filter: drop-shadow(0px 0px 2px #c7c7c7);

						> .arrowLine {
							stroke: rgba(255, 255, 255, 0.75);
						}
					}
				}

				> .content {
					display: flex;
					align-items: center;

					> svg {
						-webkit-transform: translate3d(0, 0, 0);
						overflow: visible;
						transform: rotate(90deg);
						margin-left: 20px;
						transition: 0.25s ease;
						width: 20px;
						height: 20px;
					}
				}
			}
			// background-color: rgba(0, 0, 0, 0.4);
			// position: absolute;
			// width: 550px;
			// height: 160px;
			// left: 50%;
			// top: 50%;
			// transform: translate(-50%, -50%);
			// display: flex;
			// flex-direction: column;
			// justify-content: center;
			// align-items: center;

			// h4,
			// h6 {
			// 	color: white;
			// }

			// > .title {
			// 	position: relative;
			// }

			// > .description {
			// 	position: relative;
			// 	display: flex;
			// 	flex-direction: column;
			// 	justify-content: center;
			// 	align-items: center;

			// 	> button {
			// 		position: relative;
			// 		background: none;
			// 		border: 1px solid #fff;
			// 		color: white;
			// 		font-family: 'Avenir Medium';
			// 		font-weight: bold;
			// 		border-radius: 2px;
			// 		padding: 0px 8.1px;
			// 		cursor: pointer;
			// 		transition: 0.25s ease;
			// 	}

			// 	> button:hover,
			// 	> button:focus {
			// 		box-shadow: 0px 0px 10px 0px #fff;
			// 		outline: none;
			// 	}

			// 	> button:active {
			// 		border-color: rgba(255, 255, 255, 0.75);
			// 		color: rgba(255, 255, 255, 0.75);
			// 	}
			// }
		}
	}
</style>
