<script lang="ts">
	import { _ } from 'svelte-i18n';
</script>

<div class="login">
	<div class="cancel-container">
		<button>
			<div class="icon">X</div>
			<span class="text">{$_('login.cancelText')}</span>
		</button>
	</div>
	<div class="content">
		<form id="loginForm">
			<span class="sub-header">{$_('login.subHeader')}</span>
			<div class="field-container">
				<svg viewBox="40 37 65.36 61.43">
					<g>
						<path
							d="M86.77,58.12A13.79,13.79,0,1,0,73,71.91,13.79,13.79,0,0,0,86.77,58.12M97,103.67a3.41,3.41,0,0,0,3.39-3.84,27.57,27.57,0,0,0-54.61,0,3.41,3.41,0,0,0,3.39,3.84Z"
						/>
					</g>
				</svg>
				<span class="error">{$_('login.email.error')}</span>
				<input
					class="login-field"
					type="text"
					placeholder={$_('login.email.placeholder')}
				/>
			</div>
			<div class="field-container">
				<svg viewBox="40 32 60.36 70.43">
					<g>
						<path
							d="M86.16,54a16.38,16.38,0,1,0-32,0H44V102.7H96V54Zm-25.9-3.39a9.89,9.89,0,1,1,19.77,0A9.78,9.78,0,0,1,79.39,54H60.89A9.78,9.78,0,0,1,60.26,50.59ZM70,96.2a6.5,6.5,0,0,1-6.5-6.5,6.39,6.39,0,0,1,3.1-5.4V67h6.5V84.11a6.42,6.42,0,0,1,3.39,5.6A6.5,6.5,0,0,1,70,96.2Z"
						/>
					</g>
				</svg>
				<span class="error">{$_('login.password.error')}</span>
				<input
					class="login-field"
					type="password"
					placeholder={$_('login.password.placeholder')}
				/>
			</div>
			<div class="options">
				<span class="span-dim">
					<a href={$_('login.forgotPassword.link')}>
						{$_('login.forgotPassword.text')}
					</a>
				</span>
				<label class="checkmark-container">
					<input class="remember-option" type="checkbox" checked />
					<span class="remember-text">{$_('login.rememberMeText')}</span>
					<span class="checkmark" />
				</label>
			</div>
			<button class="login" disabled>
				<div class="content">
					{$_('login.buttonText')}
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
					<div class="stateful-spinner" data-state="LOADING">
						<div class="stateful-spinner-spacer">
							<svg viewBox="0 0 50 50">
								<circle
									class="outline"
									cx="25"
									cy="25"
									r="20"
									fill="none"
									stroke-width="5"
								/>
								<circle class="effect1" cx="25" cy="25" r="22" fill="none" />
								<circle class="background" cx="25" cy="25" r="22" fill="none" />
								<path
									class="checkpath"
									stroke-linecap="round"
									stroke-linejoin="miter"
									fill-opacity="0"
									stroke-miterlimit="4"
									transform="scale(0.1) translate(250 250)"
								/>
							</svg>
						</div>
					</div>
				</div>
			</button>
			<div class="disclaimer">
				<span class="span-dim">
					<a href={$_('login.needAccount.link')}>
						{$_('login.needAccount.text')}
					</a>
				</span>
				<p class="text">{$_('login.passwordDisclaimer.1')}</p>
				<p class="text">
					{$_('login.passwordDisclaimer.2', {
						values: { appName: $_('app.title') },
					})}
				</p>
			</div>
		</form>
	</div>
</div>

<style lang="scss">
	.login {
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100%;
		width: 100%;
		transition: filter 0.25s ease;
		background: rgba(0, 0, 0, 0.5);

		.span-dim {
			font-size: 12px;
			color: #848484;
			font-weight: bold;
		}

		> .cancel-container {
			position: absolute;
			top: 5%;
			right: 5%;

			> button {
				background: none;
				border: none;
				outline: none;
				cursor: pointer;
				transition: 0.25s ease;

				> .icon {
					border-radius: 50%;
					border: 1px solid white;
					box-sizing: border-box;
					height: 30px;
					width: 30px;
					font-size: 19px;
					line-height: 30px;
					margin: 0 auto;
					margin-bottom: 5px;
					transition: 0.25s ease;
				}

				> .text {
					font-size: 15px;
					transition: 0.25s ease;
				}

				&:hover,
				&:focus {
					> .text,
					> .icon {
						text-shadow: 0px 0px 20px white;
					}

					> .icon {
						box-shadow: 0px 0px 20px white;
					}
				}

				&:active {
					> .text,
					> .icon {
						text-shadow: 0px 0px 20px rgba(255, 255, 255, 0.75);
						color: rgba(255, 255, 255, 0.75);
						border-color: rgba(255, 255, 255, 0.75);
					}

					> .icon {
						box-shadow: 0px 0px 20px rgba(255, 255, 255, 0.75);
					}
				}

				&:disabled {
					pointer-events: none;

					> .text,
					> .icon {
						color: rgba(255, 255, 255, 0.75);
						border-color: rgba(255, 255, 255, 0.75);
					}
				}
			}
		}

		> .content {
			display: flex;
			justify-content: center;
			align-items: center;
			height: 100%;
			padding: 0px 25px;

			> #loginForm {
				display: flex;
				flex-direction: column;
				justify-content: center;
				align-items: center;

				a {
					font-size: 12px;
					color: #848484;
					font-weight: bold;
					text-decoration: none;
					transition: 0.25s ease;

					&:hover,
					&:focus {
						color: #a2a2a2;
						outline: none;
					}

					&:active {
						color: #8b8b8b;
					}
				}

				> .sub-header {
					font-family: 'Avenir Medium';
					margin-bottom: 25px;
					font-size: 12px;
					letter-spacing: 1px;
					font-weight: bold;
				}

				> .field-container {
					position: relative;
					display: flex;
					flex-direction: column;
					justify-content: center;
					align-items: center;

					> svg {
						fill: #fff;
						height: 20px;
						width: 20px;
					}

					> .error {
						font-family: 'Avenir Medium';
						font-weight: bold;
						font-size: 8px;
						color: #ff1b0c;
						width: 100%;
						text-align: right;
						position: absolute;
						top: 7px;
						opacity: 0;
						transition: 0.25s ease;
					}

					> .login-field {
						font-family: 'Avenir Book';
						background: none;
						border-width: 1.5px 0px 0px 0px;
						border-style: solid;
						width: 250px;
						margin-bottom: 20px;
						border-color: #fff;
						color: rgba(255, 255, 255, 0.75);
						font-weight: bold;
						text-align: center;
						box-sizing: border-box;
						padding: 7.5px;
						font-size: 10px;
						letter-spacing: 1px;

						&:focus {
							outline: none;

							&::-webkit-input-placeholder {
								color: transparent;
							}
						}

						&:disabled {
							color: rgba(255, 255, 255, 0.5);
						}

						&::-webkit-input-placeholder {
							color: rgba(255, 255, 255, 0.75);
							font-size: 10px;
							letter-spacing: 1px;
							text-align: center;
							font-weight: bold;
						}

						&[type='password'] {
							margin-bottom: 13px;
						}
					}
				}

				> .options {
					display: flex;
					justify-content: space-between;
					width: 100%;

					> .checkmark-container {
						> .remember-text {
							padding-right: 10px;
							transition: 0.25s ease;
						}
					}
				}

				> button.login {
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

						> .stateful-spinner {
							width: 35px;
							height: 35px;
							margin-left: 36px;
							--spinner: #c7c7c7;
						}
					}

					&:disabled {
						color: rgba(255, 255, 255, 0.75);
						pointer-events: none;

						> .content > svg > .arrowLine {
							stroke: rgba(255, 255, 255, 0.75);
						}
					}

					&[data-loading='true'] {
						color: #fff;

						> .content > svg {
							display: none;
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
								stroke: #c7c7c7;
							}
						}
					}
				}
			}
		}
	}
</style>
