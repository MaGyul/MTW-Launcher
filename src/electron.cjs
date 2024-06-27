const windowStateManager = require('electron-window-state');
const { app, BrowserWindow, ipcMain, Menu, dialog, shell, Tray, systemPreferences } = require('electron');
const { autoUpdater } = require('electron-updater');
const { AZURE_CLIENT_ID, MSFT_ERROR, MSFT_OPCODE, MSFT_REPLY_TYPE, SHELL_OPCODE } = require('./ipcconstants.cjs');
// const contextMenu = require('electron-context-menu');
const serve = require('electron-serve');
const path = require('path');
const fs = require('fs');
const { setupTitlebar, attachTitlebarToWindow } = require('custom-electron-titlebar/main');

if (require('electron-squirrel-startup')) {
	app.quit();
	return;
}

if (app.isPackaged) {
	if (!app.requestSingleInstanceLock()) {
		app.quit();
		return;
	}
}

try {
	require('electron-reloader')(module);
} catch (e) {
	console.error(e);
}

if (__dirname.includes('WindowsApps')) {
	const packages = path.join(app.getPath('userData'), '..', '..', 'Local', 'Packages');
	if (fs.existsSync(packages)) {
		const packageName = fs.readdirSync(packages).filter(s => s != undefined).find(s => s.includes('MTWLauncher'));
		if (packageName !== undefined) {
			const packagePath = path.join(packages, packageName);
			if (fs.existsSync(packagePath)) {
				const localCache = path.join(packagePath, 'LocalCache');
				
				if (!fs.existsSync(localCache)) {
					fs.mkdirSync(localCache);
				}
				const roamingPath = path.join(localCache, 'Roaming');
				const localPath = path.join(localCache, 'Local');
				if (!fs.existsSync(roamingPath)) {
					fs.mkdirSync(roamingPath);
				}
				if (!fs.existsSync(localPath)) {
					fs.mkdirSync(localPath);
				}
				const tempDir = path.join(localPath, 'Temp');
				if (!fs.existsSync(tempDir)) {
					fs.mkdirSync(tempDir);
				}
				const launcherDir = path.join(roamingPath, 'mtw-launcher');
				if (!fs.existsSync(launcherDir)) {
					fs.mkdirSync(launcherDir);
				}
				app.setPath('userData', launcherDir);
				process.env.TEMP = tempDir;
				process.env.TMP = tempDir;
				process.env.LOCALAPPDATA = localPath;
				process.env.APPDATA = roamingPath;
			}
		}
	}
}

process.env.userData = app.getPath('userData');
process.env.appVersion = app.getVersion();
process.env.isPackaged = app.isPackaged;
process.env.MAINDIR = __dirname;

Menu.setApplicationMenu(null);
setupTitlebar();

if (process.platform === 'win32') {
	app.setAppUserModelId(app.name);
}

let staticPath = path.join(__dirname, '../', 'static');
if (!fs.existsSync(staticPath)) {
	staticPath = path.join(staticPath, '../');
}

if (process.platform === 'darwin') {
	var menu = Menu.buildFromTemplate([
		{
			label: app.name,
			submenu: [
				{
					id: 'title',
					label: 'MTW Launcher',
					icon: path.join(staticPath, 'icon_white_16x16.png'),
					enabled: false
				}, 
				{ type: 'separator' }, 
				{ role: 'about' },
				{ type: 'separator' }, 
				{ role: 'services' },
				{ type: 'separator' }, 
				{ role: 'hide' },
				{ role: 'hideOthers' },
				{ role: 'unhide' },
				{ type: 'separator' },
				{ role: 'quit' }
			]
		},
		{
			label: 'Edit',
			submenu: [
				{ role: 'undo' },
				{ role: 'redo' },
				{ type: 'separator' },
				{ role: 'cut' },
				{ role: 'copy' },
				{ role: 'paste' },
				{ role: 'pasteAndMatchStyle' },
				{ role: 'delete' },
				{ role: 'selectAll' },
				{ type: 'separator' },
				{
					label: 'Speech',
					submenu: [
						{ role: 'startSpeaking' },
						{ role: 'stopSpeaking' }
					]
				}
			]
		}
	]);
	Menu.setApplicationMenu(menu);
}

const REDIRECT_URI_PREFIX = 'https://login.microsoftonline.com/common/oauth2/nativeclient?'
const autoUpdaterChannel = 'autoUpdateNotification';
const serveURL = serve({ directory: '.' });
const port = process.env.PORT || 5173;
const dev = !app.isPackaged;
let mainWindow;
let tray;
let trayMove = false;

/**
 * 
 * @param {Electron.IpcMainEvent} event 
 */
function initAutoUpdater(event) {
	autoUpdater.removeAllListeners();
	autoUpdater.allowPrerelease = false;

	if (dev) {
		autoUpdater.autoInstallOnAppQuit = false;
		autoUpdater.forceDevUpdateConfig = path.join(__dirname, 'dev-app-update.yml');
	}

	autoUpdater.autoDownload = false;

	autoUpdater.on('update-available', (info) => {
		event.sender.send(autoUpdaterChannel, 'update-available', info);
	});
	autoUpdater.on('download-progress', (info) => {
		event.sender.send(autoUpdaterChannel, 'download-progress', info);
	});
	autoUpdater.on('update-downloaded', (info) => {
		event.sender.send(autoUpdaterChannel, 'update-downloaded', info);
	});
	autoUpdater.on('update-not-available', (info) => { 
		event.sender.send(autoUpdaterChannel, 'update-not-available', info);
	});
	autoUpdater.on('checking-for-update', () => {
		event.sender.send(autoUpdaterChannel, 'checking-for-update');
	});
	autoUpdater.on('error', (err) => {
		console.error(err);
		event.sender.send(autoUpdaterChannel, 'realerror', err);
	});
}

function createWindow() {
	let windowState = windowStateManager({
		defaultWidth: 1000,
		defaultHeight: 632,
	});

	const mainWindow = new BrowserWindow({
		titleBarStyle: 'hidden',
		titleBarOverlay: {
			color: '#ffffff00'
		},
		fullscreenable: false,
		autoHideMenuBar: true,
		trafficLightPosition: {
			x: 6,
			y: 6
		},
		icon: path.join(staticPath, 'favicon.ico'),
		webPreferences: {
			contextIsolation: true,
			nodeIntegration: true,
			// devTools: dev,
			preload: path.join(__dirname, 'preload.cjs'),
		},
		x: windowState.x,
		y: windowState.y,
		width: windowState.width,
		height: windowState.height,
	});

	windowState.manage(mainWindow);

	mainWindow.once('ready-to-show', () => {
		mainWindow.show();
		mainWindow.focus();
		if (dev && process.platform === 'darwin') {
			mainWindow.webContents.toggleDevTools();
		}
	});

	mainWindow.on('close', (event) => {
		if (trayMove) {
			event.preventDefault();
			mainWindow.hide();
			return;
		}
		windowState.saveState(mainWindow);
	});

	mainWindow.webContents.on('before-input-event', (event, input) => {
		let control = input.control || input.meta; // input.meta > macOS command 키
		let keyup = process.platform === 'darwin' ? true : input.type === 'keyUp'; // macOS일 경우 키 입력시 무조건 keyDown로 넘어옴
		if (control && input.alt && input.shift && input.code == 'KeyI' && keyup) {
			mainWindow.webContents.toggleDevTools();
		}
	});

	mainWindow.webContents.on('will-attach-webview', (_, webPreferences) => {
		delete webPreferences.preload;
		webPreferences.nodeIntegration = false;
	});

	attachTitlebarToWindow(mainWindow);

	mainWindow.setMinimumSize(1000, 632);
	return mainWindow;
}
function createTray(title = 'MTW Launcher') {
	const tray = new Tray(path.join(staticPath, 'icon_white_16x16.png'));
	tray.setToolTip(title);
	if (process.platform !== 'darwin') {
		tray.setTitle(title);
	}
	tray.setContextMenu(Menu.buildFromTemplate([
		{
			id: 'title',
			label: title,
			icon: path.join(staticPath, 'icon_white_16x16.png'),
			enabled: false
		}, {
			type: 'separator'
		}, {
			label: 'Show / Hide',
			click() {
				if (mainWindow) {
					mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
				} else {
					createMainWindow();
				}
			}
		}, {
			type: 'separator'
		}, {
			label: 'Quit Launcher',
			click() {
				process.exit();
			}
		}
	]));
	if (process.platform !== 'darwin') {
		tray.on('click', () => {
			if (mainWindow) {
				mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
			} else {
				createMainWindow();
			}
		});
	}
	return tray;
}

/**
 * @param {BrowserWindow} window 
 * @param {number} port 
 * @param {string} path 
 */
function loadVite(window, port, path = '') {
	window.loadURL(`http://localhost:${port}${path}`).catch((e) => {
		console.log('Error loading URL, retrying', e);
		setTimeout(() => {
			loadVite(window, port, path);
		}, 200);
	});
}

function createMainWindow() {
	mainWindow = createWindow();
	if (!tray) {
		tray = createTray();
	}
	mainWindow.on('close', () => {
		if (!trayMove) {
			mainWindow = null;
		}
	});

	if (dev) loadVite(mainWindow, port);
	else serveURL(mainWindow);
}

app.once('ready', createMainWindow);
app.on('activate', () => {
	if (!mainWindow) {
		createMainWindow();
	}
});
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
});
app.on('second-instance', (_, argv, __) => {
	if (mainWindow) {
		if (argv.includes('--login')) {
			mainWindow.webContents.send('argv-info', { type: 'login' });
		} else {
			console.log(argv);
		}
		if (mainWindow.isMinimized()) mainWindow.restore();
		if (!mainWindow.isVisible()) mainWindow.show();
		mainWindow.focus();
	}
});
process.on('exit', () => {
	app.quit();
	app.exit();
	if (tray) tray.destroy();
});

// ipc zone

ipcMain.on('autoUpdateAction', (event, arg, data) => {
	switch (arg) {
		case 'initAutoUpdater':
			console.log('Initializing auto updater.');
			initAutoUpdater(event, data);
			event.sender.send(autoUpdaterChannel, 'ready');
			break;
		case 'checkForUpdate':
			autoUpdater.checkForUpdates()
				.catch(err => {
					event.sender.send(autoUpdaterChannel, 'realerror', err);
				});
			break;
		case 'downloadNow':
			autoUpdater.downloadUpdate();
			break;
		case 'installUpdateNow':
			autoUpdater.quitAndInstall();
			break;
		default:
			console.log('Unknown argument', arg);
	}
});
ipcMain.on('focus.window', (e) => {
	mainWindow.show();
	e.sender.send('focus.window.cb');
});
ipcMain.on('open-dialog', 
/**
 * @param {import('electron').IpcMainEvent} event 
 * @param {import('electron').OpenDialogOptions} options 
 * @returns 
 */
async (event, options) => {
	const res = await dialog.showOpenDialog(mainWindow, options);
	event.sender.send('open-dialog-return', res);
});
ipcMain.on('set-titlebar-overlay', (_, options) => {
	mainWindow.setTitleBarOverlay(options);
});
ipcMain.on('set-progress-bar', (_, {percent, options}) => {
	mainWindow.setProgressBar(percent, options);
});
ipcMain.on('hide-mainWindow', () => {
	mainWindow.hide();
});
ipcMain.on('show-mainWindow', () => {
	mainWindow.show();
});
ipcMain.on('program-exit', () => {
	process.exit();
});
ipcMain.on('send-log', (_, id, ...args) => {
	const win = BrowserWindow.fromId(id);
	if (win) {
		win.webContents.send('receive-log', ...args);
	}
});
ipcMain.on('send-config', (_, id, ...args) => {
	if (id === 'trayMove') {
		trayMove = args[0];
		return;
	}
	const win = BrowserWindow.fromId(id);
	if (win) {
		win.webContents.send('receive-config', ...args);
	}
});
ipcMain.handle('open-log', () => {
	let windowState = windowStateManager({
		defaultWidth: 1282,
		defaultHeight: 752,
		file: 'log-window-state.json'
	});
	let win = new BrowserWindow({
		titleBarStyle: 'hidden',
		titleBarOverlay: {
			color: '#ffffff00'
		},
		fullscreenable: false,
		autoHideMenuBar: true,
		trafficLightPosition: {
			x: 6,
			y: 6
		},
		title: 'Minecraft game output',
		icon: path.join(staticPath, 'icon_white_64x64.png'),
		webPreferences: {
			contextIsolation: true,
			nodeIntegration: true,
			preload: path.join(__dirname, 'preload.cjs'),
		},
		x: windowState.x,
		y: windowState.y,
		width: windowState.width,
		height: windowState.height,
	});

	windowState.manage(win);

	win.on('close', () => {
		windowState.saveState(win);
	});

	win.webContents.on('before-input-event', (event, input) => {
		let control = input.control || input.meta; // input.meta > macOS command 키
		let keyup = process.platform === 'darwin' ? true : input.type === 'keyUp'; // macOS일 경우 키 입력시 무조건 keyDown로 넘어옴
		if (control && input.alt && input.shift && input.code == 'KeyI' && keyup) {
			win.webContents.toggleDevTools();
		}
	});

	win.webContents.on('will-attach-webview', (_, webPreferences) => {
		delete webPreferences.preload;
		webPreferences.nodeIntegration = false;
	});

	attachTitlebarToWindow(win);

	win.setMinimumSize(1282, 752);
	win.once('close', () => {
		win = null;
	});

	if (dev) {
		loadVite(win, port, '/log');
	} else {
		win.loadURL('app://-/log');
	}
	win.show();
	return win.id;
});
ipcMain.handle('request-mic', () => {
	return systemPreferences.askForMediaAccess('microphone');
});
ipcMain.handle('open-message-dialog', 
/**
 * @param {import('electron').MessageBoxOptions} options 
 * @returns 
 */
(event, options) => {
	return dialog.showMessageBox(mainWindow, options);
});

ipcMain.handle(SHELL_OPCODE.TRASH_ITEM, async (event, ...args) => {
	try {
		await shell.trashItem(args[0]);
		return {
			result: true
		};
	} catch (error) {
		return {
			result: false,
			error: error
		}
	}
});
// Microsoft Auth Login
let msftAuthWindow;
let msftAuthSuccess;
let msftAuthViewSuccess;
let msftAuthViewOnClose;
ipcMain.on(MSFT_OPCODE.OPEN_LOGIN, (ipcEvent, ...arguments_) => {
	if (msftAuthWindow) {
		ipcEvent.reply(MSFT_OPCODE.REPLY_LOGIN, MSFT_REPLY_TYPE.ERROR, MSFT_ERROR.ALREADY_OPEN, msftAuthViewOnClose);
		return;
	}
	msftAuthSuccess = false;
	msftAuthViewSuccess = arguments_[0];
	msftAuthViewOnClose = arguments_[1];
	msftAuthWindow = new BrowserWindow({
		title: arguments_[2],
		backgroundColor: '#222222',
		width: 520,
		height: 600,
		frame: true,
		icon: path.join(staticPath, 'icon_256x256.png')
	});

	msftAuthWindow.on('closed', () => {
		msftAuthWindow = undefined;
	});

	msftAuthWindow.on('close', () => {
		if (!msftAuthSuccess) {
			ipcEvent.reply(MSFT_OPCODE.REPLY_LOGIN, MSFT_REPLY_TYPE.ERROR, MSFT_ERROR.NOT_FINISHED, msftAuthViewOnClose);
		}
	});

	msftAuthWindow.webContents.on('did-navigate', (_, uri) => {
		if (uri.startsWith(REDIRECT_URI_PREFIX)) {
			let queries = uri.substring(REDIRECT_URI_PREFIX.length).split('#', 1).toString().split('&');
			let queryMap = {};

			for (let query of queries) {
				const [name, value] = query.split('=');
				queryMap[name] = decodeURI(value);
			}

			ipcEvent.reply(MSFT_OPCODE.REPLY_LOGIN, MSFT_REPLY_TYPE.SUCCESS, queryMap, msftAuthViewSuccess);

			msftAuthSuccess = true;
			msftAuthWindow.close();
			msftAuthWindow = undefined;
		}
	});

	msftAuthWindow.removeMenu();
    msftAuthWindow.loadURL(`https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize?prompt=select_account&client_id=${AZURE_CLIENT_ID}&response_type=code&scope=XboxLive.signin%20offline_access&redirect_uri=https://login.microsoftonline.com/common/oauth2/nativeclient`)
});

// Microsoft Auth Logout
let msftLogoutWindow;
let msftLogoutSuccess;
let msftLogoutSuccessSent;
ipcMain.on(MSFT_OPCODE.OPEN_LOGOUT, (ipcEvent, uuid, isLastAccount, title) => {
	if (msftLogoutWindow) {
		ipcEvent.reply(MSFT_OPCODE.REPLY_LOGOUT, MSFT_REPLY_TYPE.ERROR, MSFT_ERROR.ALREADY_OPEN);
		return;
	}

	msftLogoutSuccess = false;
	msftLogoutSuccessSent = false;
	msftLogoutWindow = new BrowserWindow({
		title: title,
		backgroundColor: '#222222',
		width: 520,
		height: 600,
		frame: true,
		icon: path.join(staticPath, 'icon_256x256.png')
	});

	msftLogoutWindow.on('closed', () => {
		msftLogoutWindow = undefined;
	});

	msftLogoutWindow.on('close', () => {
		if (!msftLogoutSuccess) {
			ipcEvent.reply(MSFT_OPCODE.REPLY_LOGOUT, MSFT_REPLY_TYPE.ERROR, MSFT_ERROR.NOT_FINISHED);
		} else if (!msftLogoutSuccessSent) {
			msftLogoutSuccessSent = true;
			ipcEvent.reply(MSFT_OPCODE.REPLY_LOGOUT, MSFT_REPLY_TYPE.SUCCESS, uuid, isLastAccount);
		}
	});

	msftLogoutWindow.webContents.on('did-navigate', (_, uri) => {
		if (uri.startsWith('https://login.microsoftonline.com/common/oauth2/v2.0/logoutsession')) {
			msftLogoutSuccess = true;
			setTimeout(() => {
				if (!msftLogoutSuccessSent) {
					msftLogoutSuccessSent = true;
					ipcEvent.reply(MSFT_OPCODE.REPLY_LOGOUT, MSFT_REPLY_TYPE.SUCCESS, uuid, isLastAccount);
				}

				if (msftLogoutWindow) {
					msftLogoutWindow.close();
					msftLogoutWindow = undefined;
				}
			}, 5000);
		}
	});

	msftLogoutWindow.removeMenu();
	msftLogoutWindow.loadURL('https://login.microsoftonline.com/common/oauth2/v2.0/logout');
});