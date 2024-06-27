import { getStore } from "$lib/utils/hmr-stores";
import { c_tab, Tab } from '$lib/stores/settings';
import { View } from "$lib/types/+page";
const key = (name: string) => `settings.update.${name}`;

var logger: Logger;

export const updateVersion = getStore(key('updateVersion'), '0.0.1-alpha.18');
export const updateTitle = getStore(key('updateTitle'), 'settings.tab.update.latestVersionTitle');
export const progressEnabled = getStore(key('progressEnabled'), false);
export const progressPercent = getStore(key('progressPercent'), 0);
export const buttonText = getStore(key('buttonText'), 'settings.tab.checkForUpdates');
export const buttonDisabled = getStore(key('buttonEnabled'), false);
export const buttonHandler = getStore(key('buttonHandler'), () => {
    electron.send('autoUpdateAction', 'checkForUpdate');
});

export const changeLogEnabled = getStore(key('changeLogEnabled'), false);
export const changeLogTitle = getStore(key('changeLogTitle'), 'settings.tab.updateReleaseNotes');
export const changeLogText = getStore(key('changeLogText'), 'settings.tab.noReleaseNotes');

// +layout line

function notiUpdate() {
    const noti = new Notification('런쳐 업데이트', {
        body: '새로운 업데이트가 있습니다.',
        icon: './icon_256x256.png'
    });
    noti.onclick = () => {
        electron.receiveOne('focus.window.cb', () => {
            c_tab.set(Tab.update);
            changeView(View.settings);
        })
        electron.send('focus.window');
    };
}

export function onInit() {
    logger = MTWNative.getLogger('AutoUpdater');
    electron.removeAllListeners('autoUpdateNotification');
    electron.receive('autoUpdateNotification', (arg: string, info: AutoUpdaterInfo) => {
        switch (arg) {
            case 'checking-for-update':
                logger.info('Checking for update...');
                buttonText.set('settings.tab.update.checkingForUpdatesButton');
                buttonDisabled.set(true);
                break;
            case 'update-available':
                logger.info('New update available', info.version);

                if (info.releaseName && info.releaseNotes) {
                    changeLogTitle.set(info.releaseName);
                    let notes = info.releaseNotes;
                    if (Array.isArray(notes)) {
                        changeLogText.set(notes.map(note => `Version: ${note.version}<br>Note: ${note.note}`).join('<br>'));
                    } else {
                        changeLogText.set(notes);
                    }
                    changeLogEnabled.set(true);
                }
                updateVersion.set(info.version);
                updateTitle.set('settings.tab.update.newReleaseTitle');

                notiUpdate();

                if (!MTWNative.isAppx) {
                    if (MTWNative.platform() !== 'darwin') {
                        progressPercent.set(0);
                        electron.send('autoUpdateAction', 'downloadNow');
                        progressEnabled.set(true);
                        buttonText.set('settings.tab.update.downloadingButton');
                        buttonDisabled.set(true);
                    } else {
                        const downloadURL = `https://github.com/MaGyul/MTW-Launcher/releases/download/v${
                            info.version
                        }/MTW_Launcher-Setup-${info.version}${
                            MTWNative.arch() === 'arm64' ? '-arm64' : '-x64'
                        }.dmg`;
                        buttonText.set('settings.tab.update.downloadButton');
                        buttonDisabled.set(false);
                        buttonHandler.set(() => {
                            MTWNative.openURL(downloadURL);
                        });
                    }
                } else {
                    buttonText.set('settings.tab.update.moveMsStore');
                    buttonDisabled.set(false);
                    buttonHandler.set(() => {
                        if (MTWNative.isAppx) {
                            MTWNative.nodeFetch('https://github.com/MaGyul/MTW-Launcher/raw/main/.appid')
                                .then((r) => r.text())
                                .then((t) => t.trim())
                                .then((id) => {
                                    MTWNative.openURL(`ms-windows-store://pdp/?productId=${id}`).then(() => {
                                        MTWNative.closeWindow();
                                    });
                                });
                        }
                    });
                }

                break;
            case 'update-downloaded':
                logger.info(`Update ${info.version} ready to be installed.`);
                updateTitle.set('settings.tab.update.downloadComplete');
                buttonText.set('settings.tab.update.installNowButton');
                buttonDisabled.set(false);
                buttonHandler.set(() => {
                    if (MTWNative.isPackaged) {
                        electron.send('autoUpdateAction', 'installUpdateNow');
                    }
                });
                progressEnabled.set(false);
                break;
            case 'update-not-available':
                logger.info('No new update found.');
                updateTitle.set('settings.tab.update.latestVersionTitle');
                buttonText.set('settings.tab.update.checkForUpdatesButton');
                buttonDisabled.set(false);
                updateVersion.set(info.version);
                break;
            case 'download-progress':
                progressPercent.set(info.percent | 0);
                break;
            case 'ready':
                setInterval(() => {
                    electron.send('autoUpdateAction', 'checkForUpdate');
                }, 1800000);
                electron.send('autoUpdateAction', 'checkForUpdate');
                break;
            case 'realerror':
                if (info != null && info.code != null) {
                    if (info.code === 'ERR_UPDATER_INVALID_RELEASE_FEED') {
                        logger.info('No suitable releases found.');
                    } else if (info.code === 'ERR_XML_MISSED_ELEMENT') {
                        logger.info('No releases found.');
                    } else {
                        logger.error('Error during update check..', info);
                        logger.debug('Error Code: ' + info.code);
                    }
                }
                if (info != null) {
                    if (String(info).includes('SyntaxError: Unexpected end of JSON input')) {
                        updateTitle.set('settings.tab.update.latestVersionTitle');
                        buttonText.set('settings.tab.update.checkForUpdatesButton');
                        buttonDisabled.set(false);
                        return;
                    }
                }
                updateTitle.set('settings.tab.update.unableUpdates');
                buttonDisabled.set(true);
                break;
            default:
                logger.warn('Unknown argument', arg);
                break;
        }
    });

    logger.info('Initializing...');
    electron.send('autoUpdateAction', 'initAutoUpdater');
}