<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { writable, get } from 'svelte/store';
	import { fade } from 'svelte/transition';
	import { AnsiUp } from '$lib/utils/ansi_up';
	import { onMount } from 'svelte';

	type LevelType = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

	let filterInput: HTMLInputElement;

	const ansi_up = new AnsiUp();

	const debugCount = writable(0);
	const infoCount = writable(0);
	const warnCount = writable(0);
	const errorCount = writable(0);
	const fatalCount = writable(0);
	const isBottom = writable(true);
	const isHide = writable({
		debug: true,
		info: false,
		warn: false,
		error: false,
		fatal: false,
	});
	window.isBottom = isBottom;
	window.get = get;
	window.isHide = isHide;

	function updateHide(type: LevelType) {
		return (e: Event) => {
			let target = e.target as HTMLInputElement;
			if (!target.checked) {
				$isHide[type] = true;
				// document.querySelectorAll(`.logs > table #${type}`).forEach((ele) => {
				// 	ele.classList.add('hideLog');
				// });
			} else {
				$isHide[type] = false;
				// document.querySelectorAll(`.logs > table #${type}`).forEach((ele) => {
				// 	if (!ele.classList.contains('filter')) ele.classList.remove('hideLog');
				// });
			}
			let table = jq('.logs > table');
			table.attr(
				'hide',
				Object.keys($isHide)
					.filter((e) => $isHide[e as LevelType])
					.join(','),
			);
			toBottom();
		};
	}

	function logScroll() {
		let scrollTop = jq('.logs').scrollTop() as number;
		let logs_height = jq('.logs').height() as number;
		let table_height = Math.round(jq('.logs > table').height() as number);
		if (scrollTop + logs_height == table_height) {
			$isBottom = true;
		} else {
			$isBottom = false;
		}
	}

	function toBottom() {
		jq('.logs')
			.stop()
			.animate(
				{
					scrollTop: jq('.logs > table').height(),
				},
				500,
			);
	}

	function filterInputLis(event: Event & { currentTarget: EventTarget & HTMLInputElement }) {
		let value = event.currentTarget.value;
		document.querySelectorAll('.logs > table #msg').forEach((element) => {
			let ele = jq(element);
			let tr = ele.closest('tr');
			if (ele.text().includes(value)) {
				let id = tr.attr('id');
				switch (id) {
					case 'debug':
					case 'info':
					case 'warn':
					case 'error':
					case 'fatal':
						tr.removeClass('hideLog');
						break;
				}
			} else {
				tr.addClass('hideLog');
			}
		});
	}

	function allLevelCount(): number {
		return $debugCount + $infoCount + $warnCount + $errorCount + $fatalCount;
	}

	function upLogCount(type: LevelType) {
		switch (type) {
			case 'debug':
				$debugCount++;
				break;
			case 'info':
				$infoCount++;
				break;
			case 'warn':
				$warnCount++;
				break;
			case 'error':
				$errorCount++;
				break;
			case 'fatal':
				$fatalCount++;
				break;
		}
	}

	function clearLog() {
		$debugCount = 0;
		$infoCount = 0;
		$warnCount = 0;
		$errorCount = 0;
		$fatalCount = 0;
		setTimeout(() => ($isBottom = true), 100);
		jq('.logs > table').empty();
	}

	electron.receive('receive-config', (key, value) => {
		switch (key) {
			case 'language':
				window.setLocale(value);
				break;
		}
	});
	MTWNative.changeTitle('Minecraft game output', '#00000000');
	// if (MTWNative.platform() !== 'darwin') {
	// 	MTWNative.updateIcon('./icon_white_64x64.png');
	// }
	let style = document.createElement('style');
	style.textContent =
		'.cet-titlebar {background-color: #262626 !important;} .cet-title {color: white !important;}';
	document.head.appendChild(style);
	onMount(() => {
		jq('.logs > table').attr('hide', 'debug');
		const logList = document.querySelector('.logs > table') as HTMLTableElement;
		electron.receive('receive-log', async (data: LogData) => {
			if (typeof data.logger == 'undefined') data.logger = 'Minecraft';
			let type = data.level.toLowerCase() as LevelType;
			let time = data.timestamp as string;
			let msg = data.message;
			// if (msg.includes('[CHAT]')) {
			// 	msg = ansi_up.ansi_to_html(msg);
			// }

			let lastNode = logList.lastChild as HTMLElement;
			if (lastNode != null) {
				if (lastNode.id == type) {
					let td = lastNode.getElementsByTagName('td') as any;
					let msgE = td.msg;
					if (msgE != undefined && msgE.textContent == msg) {
						let countE = td.count;
						if (countE != undefined) {
							if (td[0] != null) {
								td[0].textContent = time;
							}
							if (countE.textContent == '') {
								countE.textContent = '1';
								return;
							}
							countE.textContent = +countE.textContent + 1;
							return;
						}
					}
				}
			}

			upLogCount(type);
			let tr = document.createElement('tr');
			let td = document.createElement('td');
			let count = document.createElement('td');
			let logger = document.createElement('td');
			let thread = document.createElement('td');
			let td_msg = document.createElement('td');
			let pre = document.createElement('pre');
			tr.id = type;
			if (filterInput.value.length > 0) {
				if (!msg.includes(filterInput.value)) {
					tr.classList.add('hideLog');
				}
			}
			td.textContent = time;
			count.id = 'count';
			logger.id = 'logger';
			logger.textContent = data.logger.includes('net.minecraft') ? 'Minecraft' : data.logger;
			thread.id = 'thread';
			thread.textContent = data.thread;
			td_msg.id = 'msg';
			pre.textContent = msg;
			td_msg.appendChild(pre);
			tr.appendChild(td);
			tr.appendChild(count);
			tr.appendChild(logger);
			tr.appendChild(thread);
			tr.appendChild(td_msg);
			logList.appendChild(tr);

			if ($isBottom) {
				jq('.logs').scrollTop(jq('.logs > table').height() as number);
			}

			if (allLevelCount() > 50000) {
				clearLog();
			}
		});
	});
</script>

<div class="container">
	<div class="head">
		<div class="filter">
			<span class="title">{$_('gamelog.filter.title')}</span>
			<input
				type="text"
				class="filter-input"
				placeholder={$_('gamelog.filter.placeholder')}
				bind:this={filterInput}
				on:input={filterInputLis}
			/>
		</div>
		<div class="level">
			<span class="title">{$_('gamelog.level.title')}</span>
			<div class="levels">
				<div class="checkbox">
					<input
						type="checkbox"
						id="debug-cb"
						checked={!$isHide.debug}
						on:change={updateHide('debug')}
					/>
					<label for="debug-cb">
						{$_('gamelog.level.debug', { values: { count: $debugCount } })}
					</label>
				</div>
				<div class="checkbox">
					<input
						type="checkbox"
						id="info-cb"
						checked={!$isHide.info}
						on:change={updateHide('info')}
					/>
					<label for="info-cb">
						{$_('gamelog.level.info', { values: { count: $infoCount } })}
					</label>
				</div>
				<div class="checkbox">
					<input
						type="checkbox"
						id="warn-cb"
						checked={!$isHide.warn}
						on:change={updateHide('warn')}
					/>
					<label for="warn-cb">
						{$_('gamelog.level.warn', { values: { count: $warnCount } })}
					</label>
				</div>
				<div class="checkbox">
					<input
						type="checkbox"
						id="error-cb"
						checked={!$isHide.error}
						on:change={updateHide('error')}
					/>
					<label for="error-cb">
						{$_('gamelog.level.error', { values: { count: $errorCount } })}
					</label>
				</div>
				<div class="checkbox">
					<input
						type="checkbox"
						id="fatal-cb"
						checked={!$isHide.fatal}
						on:change={updateHide('fatal')}
					/>
					<label for="fatal-cb">
						{$_('gamelog.level.fatal', { values: { count: $fatalCount } })}
					</label>
				</div>
			</div>
		</div>
		<div class="action">
			<span class="title">{$_('gamelog.action.title')}</span>
			<button class="log-clear" on:click={clearLog}>{$_('gamelog.action.logclear')}</button>
		</div>
	</div>
	<div class="content">
		<div class="logs" on:scroll={logScroll}>
			{#if $debugCount + $infoCount + $warnCount + $errorCount + $fatalCount == 0}
				<div class="waitMsg" transition:fade={{ duration: 100 }}>
					Waiting for log output...
				</div>
			{/if}
			<table width="100%" />
		</div>
		{#if !$isBottom}
			<div
				class="to-bottom"
				transition:fade={{ duration: 100 }}
				on:click={toBottom}
				on:keypress={() => {}}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="black"
					width="18px"
					height="18px"
				>
					<path d="M0 0h24v24H0V0z" fill="none" />
					<path d="M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z" />
				</svg>
			</div>
		{/if}
	</div>
</div>

<style lang="scss" global="true">
	.container {
		background-color: #303030;
		color: white;
		padding: 0;
		margin: 0;
		max-width: 100%;
		max-height: 100%;
		height: 100%;

		> .head {
			display: flex;
			flex-direction: row;
			align-items: center;
			background-color: #262626;
			width: 100%;
			height: auto;
			padding: 10px 0px 5px 0px;
			user-select: none;

			> div {
				display: flex;
				flex-direction: column;
				margin-left: 20px;
				&.action {
					position: absolute;
					right: 20px;
				}

				> .title {
					font-family: 'Cabin VF Beta', sans-serif;
					font-weight: bold;
				}

				> .filter-input {
					width: 300px;
					padding: 5px 7px 5px 7px;
					border-style: none;
					border-radius: 5px;
					background-color: #0e0e0e;
					color: white;
					margin-bottom: 5px;
					margin-top: 5px;
				}

				> .levels {
					width: 500px;
					display: flex;
					flex-direction: row;
					align-items: center;
					justify-content: space-between;
					margin-top: 5px;
					margin-bottom: 5px;

					label {
						font-family: Noto Sans;
					}
				}

				> .log-clear {
					background-color: #262626;
					border-radius: 10px;
					border-width: 1px;
					border-color: #ffffff;
					outline: 0;
					color: white;
					font-weight: bold;
					cursor: pointer;
					padding: 5px 20px 5px 20px;
					margin-top: 5px;
					margin-bottom: 5px;

					&:hover {
						background-color: #515151;
					}

					&:active {
						background-color: #464646;
					}
				}
			}
		}

		> .content {
			width: 100%;
			height: 100%;
			overflow: hidden;

			> .logs {
				height: calc(100% - 74px);
				font-family: Consolas;
				overflow-x: hidden;
				overflow-y: auto;

				> .waitMsg {
					padding: 10px;
				}

				> table {
					user-select: text;

					> tr {
						td {
							vertical-align: text-top;
						}

						> td:nth-child(1) {
							width: 80px;
							padding: 3px 0px 3px 10px;
							font-size: 10px;
						}

						> #count {
							width: 20px;
							font-size: 10px;
						}

						> #logger {
							word-break: break-all;
							width: 150px;
							font-size: 10px;
						}

						> #thread {
							word-break: break-all;
							width: 100px;
							font-size: 10px;
						}

						> #msg {
							word-break: break-all;
							padding-left: 4px;
							font-size: 13px;

							> pre {
								tab-size: 4;
								margin: 0;
								font-family: Consolas;
								white-space: pre-wrap;
							}
						}
					}

					&[hide*='debug'] > #debug {
						display: none;
					}

					&[hide*='info'] > #info {
						display: none;
					}

					&[hide*='warn'] > #warn {
						display: none;
					}

					&[hide*='error'] > #error {
						display: none;
					}

					&[hide*='fatal'] > #fatal {
						display: none;
					}
				}

				#debug > #msg {
					color: #d0d0d0;
					font-style: oblique;
				}

				#error > #msg {
					color: #de6b71;
				}

				#warn > #msg {
					color: #ffcb6b;
				}

				#fatal > #msg {
					background-color: red;
				}
			}

			> .to-bottom {
				position: absolute;
				width: 50px;
				height: 50px;
				border-radius: 50%;
				right: 0;
				bottom: 0;
				z-index: 32;
				background-color: rgba(255, 255, 255, 0.8);
				margin: 16px 16px;

				> svg {
					width: 50px;
					height: 50px;
					transform: scale(0.66);
				}

				&:hover {
					background-color: rgba(255, 255, 255, 0.6);
				}
				&:active {
					background-color: rgba(255, 255, 255, 0.4);
				}
			}
		}

		::-webkit-scrollbar {
			width: 10px;
		}

		::-webkit-scrollbar-thumb {
			background-color: #595959;

			&:hover {
				background-color: #646464;
			}

			&:active {
				background-color: #6f6f6f;
			}
		}

		::-webkit-scrollbar-track {
			background-color: #3f3f3f;
		}
	}

	.hideLog {
		display: none;
	}
</style>
