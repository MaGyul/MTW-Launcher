const { contextBridge, ipcRenderer, shell } = require('electron');
const { Titlebar, TitlebarColor } = require('custom-electron-titlebar');
const { LoggerUtil } = require('helios-core');
const {
	isDisplayableError,
	validateLocalFile,
	HeliosModule,
	HeliosDistribution,
	HeliosServer
} = require('helios-core/common');
const {
	FullRepair,
	MojangIndexProcessor,
	DistributionIndexProcessor,
	downloadFile
} = require('helios-core/dl');
const { 
	discoverBestJvmInstallation, 
	validateSelectedJvm,
	ensureJavaDirIsRoot,
	javaExecFromRoot,
	latestOpenJDK,
	extractJdk
} = require('helios-core/java');
const ProcessBuilder = require('./processbuilder.cjs');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const nodeFetch = require('node-fetch');
const config = require('./config.cjs');
const lang = require('./lang.cjs');
const log = require('./log.cjs');
const parseMcLog = require('./xmlutil.cjs');
const moment = require('moment');
const { DistroAPI } = require('./distromanager.cjs');

log.disable();
const loggerModChecker = LoggerUtil.getLogger('ModChecker');
var titleBar;

window.addEventListener('DOMContentLoaded', () => {
	titleBar = new Titlebar({
		titleHorizontalAlignment: process.platform === 'darwin' ? 'center' : 'left',
		icon: './icon_64x64.png',
		backgroundColor: TitlebarColor.fromHex('#ffffff00')
	});
});
window.addEventListener('load', () => {
	document.querySelector("div.cet-menubar").style.display = 'none'
});

// contextBridge.exposeInMainWorld('initLang', lang.initLang);
// contextBridge.exposeInMainWorld('lang', lang.lang);
contextBridge.exposeInMainWorld('____', () => {
	setTimeout(console.log.bind(console, 'Sorry, this app does not support eval().'));
});
contextBridge.exposeInMainWorld('getLang', lang.getLang);
contextBridge.exposeInMainWorld('langs', lang.langs);
contextBridge.exposeInMainWorld('config', config);
contextBridge.exposeInMainWorld('MTWNative', {
	env: {...process.env},
	isPackaged: process.env.isPackaged == 'true',
	isAppx: process.env.MAINDIR.includes('WindowsApps'),
	userData: process.env.userData,
	appVersion: process.env.appVersion,
	ipcconstants: getIpcConstants(),
	authManager: require('./authmanager.cjs'),
	DistroAPI: getDistroAPI(),
	os: {
		totalmem: os.totalmem,
		freemem: os.freemem,
		tmpdir: os.tmpdir,
	},
	common: {
		isDisplayableError,
		validateLocalFile
	},
	dl: {
		newFullRepair,
		newMojangIndexProcessor,
		newDistributionIndexProcessor,
		downloadFile
	},
	java: {
		discoverBestJvmInstallation,
		validateSelectedJvm,
		ensureJavaDirIsRoot,
		javaExecFromRoot,
		latestOpenJDK,
		extractJdk
	},
	path: {
		join: (...paths) => path.join(...paths),
		exists: (path) => fs.existsSync(path),
		mkdir: (path) => fs.mkdirSync(path)
	},
	moment: function() {
		let m = moment(...arguments);
		return {
			...m,
			format() {
				return m.format(...arguments);
			}
		}
	},
	parseMcLog: parseMcLog,
	getServerStatus: require('./serverstatus.cjs'),
	getLogger: getLogger,
	isdev: () => require('./isdev.cjs'),
	platform: () => process.platform,
	arch: () => process.arch,
	requestMic: async () => await ipcRenderer.invoke('request-mic'),
	changeTitle: (text, color) => {
		titleBar.titleElement.textContent = text;
		if (color) titleBar.updateBackground(TitlebarColor.fromHex(color));
	},
	updateIcon: (path) => {
		titleBar.updateIcon(path);
	},
	openURL: (url) => {
		if (!url) url = 'https://google.co.kr';
		return shell.openExternal(url);
	},
	clearTempNativeFolder: (logger) => {
		return new Promise(resolve => {
			fs.remove(path.join(os.tmpdir(), config.getTempNativeFolder()), (err) => {
				if (err) {
					logger.warn('Error while cleaning natives directory', err);
				} else {
					logger.info('Cleaned natives directory.');
				}
				resolve();
			})
		})
	},
	nodeFetch: async (url, options) => {
		let res = await nodeFetch(url, options);
		return {
			...res,
			url: res.url,
			ok: res.ok,
			text: () => res.text(),
			json: () => res.json(),
			blob: () => res.blob(),
			arrayBuffer: () => res.arrayBuffer()
		}
	},
	hideWindow: () => {
		ipcRenderer.send('hide-mainWindow');
	},
	showWindow: () => {
		ipcRenderer.send('show-mainWindow');
	},
	closeWindow: () => {
		ipcRenderer.send('program-exit');
	},
	checkMods: checkMods,
	removeMods: removeMods,
	checkInternet: async () => {
		if (typeof navigator.onLine == 'undefined') {
			try {
				await nodeFetch('https://www.google.com/', { signal: AbortSignal.timeout(5000) });
				return true;
			} catch {
				return false;
			}
		}
		return navigator.onLine;
	},
	newProcessBuilder,
	openLog: async () => {
		let id = await ipcRenderer.invoke('open-log');
		return {
			send: (data) => {
				ipcRenderer.send('send-log', id, data);
			},
			sendConfig: (key, value) => {
				ipcRenderer.send('send-config', id, key, value);
			}
		}
	}
});

contextBridge.exposeInMainWorld('electron', {
	send: (channel, ...data) => {
		ipcRenderer.send(channel, ...data);
	},
	sendSync: (channel, ...data) => {
		ipcRenderer.sendSync(channel, ...data);
	},
	invoke: (channel, ...data) => {
		return ipcRenderer.invoke(channel, ...data);
	},
	receive: (channel, func) => {
		ipcRenderer.on(channel, (_, ...args) => func(...args));
	},
	receiveOne: (channel, func) => {
		ipcRenderer.once(channel, (_, ...args) => func(...args));
	},
	removeAllListeners: (channel) => {
		ipcRenderer.removeAllListeners(channel);
	},
	openDialog: (options) => {
		return new Promise(resolve => {
			ipcRenderer.send('open-dialog', options);
			ipcRenderer.once('open-dialog-return', (_, value) => {
				resolve(value);
			});
		});
	},
	openMessage: (options) => {
		return ipcRenderer.invoke('open-message-dialog', options);
	},
	setTitleBarOverlay: (options) => {
		if (options) {
			// const color = options?.color ?? config.getTitleBarColor();
			// titleBar.titlebarElement.style.backgroundColor = color;
			// titleBar.titleElement.style.color = invertColor(color);
			ipcRenderer.send('set-titlebar-overlay', options);
		}
	}
});

function invertColor(hex) {
	if (hex.indexOf('#') === 0) {
		hex = hex.slice(1);
	}
	// convert 3-digit hex to 6-digits.
	if (hex.length === 3) {
		hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
	}
	if (hex.length !== 6) {
		throw new Error('Invalid HEX color.');
	}
	// invert color components
	var r = (255 - parseInt(hex.slice(0, 2), 16)).toString(16),
		g = (255 - parseInt(hex.slice(2, 4), 16)).toString(16),
		b = (255 - parseInt(hex.slice(4, 6), 16)).toString(16);
	// pad each with zeros and return
	return '#' + padZero(r) + padZero(g) + padZero(b);
}

function padZero(str, len) {
	len = len || 2;
	var zeros = new Array(len).join('0');
	return (zeros + str).slice(-len);
}

/**
 * @param {{ path: string, id: string }[]} mods 
 * @returns {string[]}
 */
function checkMods(mods) {
	let instance = config.getInstanceDirectory();
	let serverId = config.getSelectedServer();
	let rootPath;
	let notAccessMods = [];
	if (fs.existsSync(rootPath = path.join(instance, serverId))) {
		let modsPath;
		if (fs.existsSync(modsPath = path.join(rootPath, 'mods'))) {
			let files = fs.readdirSync(modsPath, { encoding: 'utf-8' }).filter(file => {
				if (!file.endsWith('.jar')) return false;
				for (let mod of mods) {
					if (mod.path.includes(file)) {
						return false;
					}
				}
				return true;
			});
			for (let file of files) {
				notAccessMods.push(file);
			}
		}
	}
	return notAccessMods;
}

/**
 * @param {string[]} mods
 */
function removeMods(mods) {
	let instance = config.getInstanceDirectory();
	let serverId = config.getSelectedServer();
	let rootPath;
	if (fs.existsSync(rootPath = path.join(instance, serverId))) {
		let modsPath;
		if (fs.existsSync(modsPath = path.join(rootPath, 'mods'))) {
			for (let file of mods) {
				let modPath;
				if (fs.existsSync(modPath = path.join(modsPath, file))) {
					fs.rmSync(modPath);
				}
			}
		}
	}
}

function newProcessBuilder(serv, vanillaManifest, modManifest, authUser) {
	const pb = new ProcessBuilder(serv, vanillaManifest, modManifest, authUser, process.env.appVersion);
	return {
		...pb,
		build: function() {
			const child = pb.build();
			return {
				killed: child.killed,
				exitCode: child.exitCode,
				stdout: {
					on: function(event, func) {
						child.stdout.on(event, func);
					},
					removeListener: function(event, func) {
						child.stdout.removeListener(event, func);
					}
				},
				stderr: {
					on: function(event, func) {
						child.stderr.on(event, func);
					},
					removeListener: function(event, func) {
						child.stderr.removeListener(event, func);
					}
				},
				close: function(func) {
					child.on('close', func);
				},
				kill: function(signal) {
					child.kill(signal);
				}
			}
		}
	}
}

function newFullRepair(common, instance, launcher, serverId) {
	const fullrepair = new FullRepair(common, instance, launcher, serverId, DistroAPI.isDevMode());
	return {
		...fullrepair,
		childProcess: {
			error: function(func) {
				fullrepair.childProcess.on('error', func);
			},
			close: function(func) {
				fullrepair.childProcess.on('close', func);
			}
		},
		receiverName: function() {
			return fullrepair.receiverName();
		},
		spawnReceiver: function() {
			return fullrepair.spawnReceiver();
		},
		verifyFiles: function(func) {
			return fullrepair.verifyFiles(func);
		},
		download: function(func) {
			return fullrepair.download(func);
		},
		destroyReceiver: function() {
			fullrepair.destroyReceiver();
		}
	};
}

function newMojangIndexProcessor(common, version) {
	const mip = new MojangIndexProcessor(common, version);
	return {
		...mip,
		getVersionJson: function() {
			return mip.getVersionJson();
		},
		init: function() {
			return mip.init();
		},
		postDownload: function() {
			return mip.postDownload();
		},
		totalStages: function() {
			return mip.totalStages();
		},
		validate: function(func) {
			return mip.validate(func);
		}
	};
}

function newDistributionIndexProcessor(common, distro, serverId) {
	const dip = new DistributionIndexProcessor(common, distro, serverId);
	return {
		...dip,
		loadModLoaderVersionJson: function() {
			return dip.loadModLoaderVersionJson();
		}
	}
}

function getIpcConstants() {
	const ipcconstants = require('./ipcconstants.cjs');
	const obj = {...ipcconstants};
	delete obj.AZURE_CLIENT_ID;
	return obj;
}

function getDistroAPI() {
	return {
		setCommonDir: function(dir) {
			DistroAPI['commonDir'] = dir;
		},
		getCommonDir: function() {
			return DistroAPI['commonDir'];
		},
		setInstanceDir: function(dir) {
			DistroAPI['instanceDir'] = dir;
		},
		getInstanceDir: function() {
			return DistroAPI['instanceDir'];
		},
		isDevMode: function() {
			return DistroAPI.isDevMode()
		},
		getDistribution: async function() {
			const dirtribution = await DistroAPI.getDistribution();
			return convertHeliosDistribution(dirtribution);
		},
		refreshDistributionOrFallback: async function() {
			const dirtribution = await DistroAPI.refreshDistributionOrFallback();
			return convertHeliosDistribution(dirtribution)
		}
	};
}

/**
 * @param {HeliosDistribution} dirtribution 
 * @return {HeliosDistribution}
 */
function convertHeliosDistribution(dirtribution) {
	const obj = {
		...dirtribution,
		servers: dirtribution.servers.map(server => convertHeliosServer(server)),
		getServerById: function(id) {
			return convertHeliosServer(dirtribution.getServerById(id));
		},
		getMainServer: function() {
			return convertHeliosServer(dirtribution.getMainServer());
		}
	}
	return obj;
}

/**
 * @param {HeliosServer} server
 * @return {HeliosServer} 
 */
function convertHeliosServer(server) {
	if (server === null) return null;
	const obj = {
		...server,
		modules: convertHeliosModule(server.modules)
	}
	return obj;
}

/**
 * @param {HeliosModule[]} modules 
 * @return {HeliosModule[]}
 */
function convertHeliosModule(modules) {
	let resultModules = [];
	for (let module of modules) {
		const obj = {
			...module,
			subModules: convertHeliosModule(module.subModules),
			getExtensionlessMavenIdentifier: function() {
				return module.getExtensionlessMavenIdentifier();
			},
			getMavenComponents: function() {
				return module.getMavenComponents();
			},
			getMavenIdentifier: function() {
				return module.getMavenIdentifier();
			},
			getPath: function() {
				return module.getPath();
			},
			getRequired: function() {
				return module.getRequired();
			},
			getVersionlessMavenIdentifier: function() {
				return module.getVersionlessMavenIdentifier();
			},
			hasMavenComponents: function() {
				return module.hasMavenComponents();
			},
			hasSubModules: function() {
				return module.hasSubModules();
			}
		};
		resultModules.push(obj);
	}
	return resultModules;
}

function getLogger(label) {
	const logger = LoggerUtil.getLogger(label);
	return {
		error: function() {
			logger.error(...arguments);
		},
		warn: function() {
			logger.warn(...arguments);
		},
		help: function() {
			logger.help(...arguments);
		},
		data: function() {
			logger.data(...arguments);
		},
		info: function() {
			logger.info(...arguments);
		},
		debug: function() {
			logger.debug(...arguments);
		},
		prompt: function() {
			logger.prompt(...arguments);
		},
		http: function() {
			logger.http(...arguments);
		},
		verbose: function() {
			logger.verbose(...arguments);
		},
		input: function() {
			logger.input(...arguments);
		},
		silly: function() {
			logger.silly(...arguments);
		}
	};
}