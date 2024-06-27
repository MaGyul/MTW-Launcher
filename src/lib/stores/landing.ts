import { getStore, getValue } from "$lib/utils/hmr-stores";
import * as overlay from '$lib/stores/overlay';
import * as loginOptions from '$lib/stores/loginOptions';
import { View } from '$lib/types/+page';
import { _currentView } from '$lib/stores/+page';
import { jeValue } from "./settings.java";
import type { Writable } from "svelte/store";
const key = (name: string) => `landing.${name}`;

export const username = getStore(key('username'), 'landing.text.noAccountSelected');
export const avatar = getStore(key('avatarUrl'), '');
export const launchArea = getStore(key('launchArea'), false);
export const serverStatus: Writable<MessageObject> = getStore(key('serverStatus'), { id: 'landing.text.offline' });
export const playerList: Writable<PlayerList[]> = getStore(key('playerList'), []);
export const showPercent = getStore(key('showPercent'), false);
export const percent = getStore(key('percent'), 0);
export const detailsText = getStore(key('detailsText'), 'landing.text.pleasewait');

export function updateSelectedAccount(authUser: Account) {
    username.set('landing.text.noAccountSelected');
    if (authUser != null) {
        if (authUser.displayName != null) {
            username.set(authUser.displayName);
        }
        if (authUser.uuid != null) {
            avatar.set(`https://mc-heads.net/body/${authUser.uuid}/right`);
        }
    }
}

let logger: Logger;
let mcStartCount = 0;

function setPercentage(inPercent: number, show: boolean) {
    showPercent.set(show);
    if (getValue(percent) == -1 && inPercent != -1) {
        percent.set(0);
    }
    percent.set(inPercent);
    // progress.max = 100;
    // progress.value = percent;
    // progress_label.textContent = `${percent}%`;
}

function setProgressBar(percent: number, options?: ProgressBarOptions) {
    electron.send('set-progress-bar', { percent, options });
}

function setDownloadPercentage(percent: number) {
    setProgressBar(percent / 100);
    setPercentage(percent, true);
}

function setDetails(id: string) {
    detailsText.set(id);
}

function showLaunchFailure(title: overlay.I18n, desc: overlay.I18n) {
    overlay.setContent(title, desc, 'landing.launch.okay');
    overlay.setHandler(() => {
        launchArea.set(false);
        overlay.toggleOverlay(false);
    });
    overlay.toggleOverlay(true);
}

export async function launchGame() {
    logger.info('Launching game...');
    try {
        const server = (await MTWNative.DistroAPI.getDistribution()).getServerById(
            config.getSelectedServer(),
        );
        const jExe = config.getJavaExecutable(config.getSelectedServer());
        if (server) {
            if (jExe == null) {
                await asyncSystemScan(server.effectiveJavaOptions)
            } else {
                setDetails('landing.text.pleasewait');
                launchArea.set(true);
                setPercentage(0, false);

                const details = await MTWNative.java.validateSelectedJvm(
                    MTWNative.java.ensureJavaDirIsRoot(jExe),
                    server.effectiveJavaOptions.supported
                );
                if (details != null) {
                    logger.info('Jvm Details', details);
                    await dlAsync();
                } else {
                    await asyncSystemScan(server.effectiveJavaOptions);
                }
            }
        }
    } catch (err: any) {
        logger.error('Unhandled error in during launch process.', err);
        showLaunchFailure('landing.launch.failure.title', {
            id: 'landing.launch.failure.text', 
            values: { 
                error: err.message
            } 
        });
    }
}

async function asyncSystemScan(effectiveJavaOptions: Required<JavaVersionProps>, launchAfter = true) {
    setDetails('landing.systemScan.checking');
    launchArea.set(true);
    setPercentage(0, false);

    const jvmDetails = await MTWNative.java.discoverBestJvmInstallation(
        config.getDataDirectory(),
        effectiveJavaOptions.supported
    );

    if (jvmDetails == null) {
        overlay.setContent('landing.systemScan.noCompatibleJava', {
            id: 'landing.systemScan.install.javaMessage',
            values: { 
                major: effectiveJavaOptions.suggestedMajor 
            }
        }, 'landing.systemScan.install.java', 'landing.systemScan.install.javaManually');
        overlay.setHandler(() => {
            setDetails('landing.systemScan.java.download.prepare');
            overlay.toggleOverlay(false);

            try {
                downloadJava(effectiveJavaOptions, launchAfter);
            } catch (err: any) {
                logger.error('Unbandled error in Java Download', err);
                showLaunchFailure('landing.systemScan.java.download.failureTitle', { 
                    id: 'landing.systemScan.java.download.failureText',
                    values: { 
                        error: err.message
                    }
                });
            }
        });
        overlay.setDismiss(() => {
            overlay.toggleOverlay(false);
            overlay.setContent({
                id: 'landing.systemScan.java.required.text',
                values: { 
                    major: effectiveJavaOptions.suggestedMajor 
                }
            }, {
                id: 'landing.systemScan.java.required.message',
                values: { 
                    major: effectiveJavaOptions.suggestedMajor 
                }
            }, 'landing.systemScan.java.required.dismiss', 'landing.systemScan.java.required.cancel');
            overlay.setHandler(() => {
                launchArea.set(false);
                overlay.toggleOverlay(false);
            });
            overlay.setDismiss(() => {
                overlay.toggleOverlay(false, true);

                asyncSystemScan(effectiveJavaOptions, launchAfter);
            });
            overlay.toggleOverlay(true, true);
        });
        overlay.toggleOverlay(true, true);
    } else {
        const javaExec = MTWNative.java.javaExecFromRoot(jvmDetails.path);
        jeValue.set(javaExec);

        if (launchAfter) {
            await dlAsync();
        }
    }
}

async function downloadJava(effectiveJavaOptions: Required<JavaVersionProps>, launchAfter = true) {
    const asset = await MTWNative.java.latestOpenJDK(
        effectiveJavaOptions.suggestedMajor,
        config.getDataDirectory(),
        effectiveJavaOptions.distribution
    );

    if (asset == null) {
        throw new Error(i18n('landing.downloadJava.findJdkFailure'));
    }
    
    setDetails('landing.downloadJava.downloadingJava');

    setPercentage(0, true);
    let received = 0;
    await MTWNative.dl.downloadFile(asset.url, asset.path, ({ transferred }) => {
        received = transferred;
        setDownloadPercentage(Math.trunc((transferred / asset.size) * 100));
    });
    setDownloadPercentage(100);
    setPercentage(-1, true);

    if (received != asset.size) {
        logger.warn(`Java Download: Expected ${asset.size} bytes but received ${received}`);
        if (!await MTWNative.common.validateLocalFile(asset.path, asset.algo, asset.hash)) {
            logger.error(`Hashes do not match, ${asset.id} may be corrupted.`);

            throw new Error(i18n('landing.downloadJava.javaDownloadCorruptedError'));
        }
    }

    setProgressBar(2);
    setDetails('landing.downloadJava.extractingJava');

    const newJavaExec = await MTWNative.java.extractJdk(asset.path);
    
    setPercentage(0, false);
    setProgressBar(-1);

    jeValue.set(newJavaExec);
    setDetails('landing.downloadJava.javaInstalled');

    asyncSystemScan(effectiveJavaOptions, launchAfter);
}

// Keep reference to Minecraft Process
let proc: ProcessBuilderChildProcess | undefined;
// Joined server regex
// Change this if your server uses something different.
const GAME_JOINED_REGEX = /\[.+\]: Sound engine started/;
const GAME_LAUNCH_REGEX = /^\[.+\]: (?:MinecraftForge .+ Initialized|ModLauncher .+ starting: .+|Loading Minecraft .+ with Fabric Loader .+)$/;
const MIN_LINGER = 5000;

async function dlAsync(login = true) {
    const loggerLaunchSuite = MTWNative.getLogger('LaunchSuite');

    setDetails('landing.dlAsync.loadingServerInfo');

    let distro: HeliosDistribution;

    try {
        distro = await MTWNative.DistroAPI.refreshDistributionOrFallback();
        onDistroRefresh(distro);
    } catch (err: any) {
        loggerLaunchSuite.error('Unable to refresh dirtribution index.', err);
        showLaunchFailure('landing.dlAsync.fatalError', {
            id: 'landing.dlAsync.unableToLoadDistributionIndex',
            values: { 
                error: err.message 
            }
        });
        return;
    }

    const serv = distro.getServerById(config.getSelectedServer());

    if (serv) {
        const mods: { path: string, id: string }[] = [];
        for (let mdl of serv.modules) {
            if (mdl.getPath().includes('mods')) {
                mods.push({
                    path: mdl.getPath(),
                    id: mdl.rawModule.id
                });
            }
        }
        loggerLaunchSuite.info(`Found mods for MTW: ${mods.map(f => {
            let split = f.path.split('\\');
            return split[split.length - 1];
        }).join(', ')}`);
        loggerLaunchSuite.info('Checking for unavailable mods...');
        const notAccessMods = MTWNative.checkMods(mods);
        const removeMods: string[] = [];
        for (let aMod of [...notAccessMods]) {
            for (let mod of mods) {
                var name = mod.id.split(':')[1];
                if (aMod.toLowerCase().includes(name)) {
                    let index = notAccessMods.indexOf(aMod);
                    if (index !== -1) notAccessMods.splice(index, 1);
                    removeMods.push(aMod);
                }
            }
        }
        MTWNative.removeMods(removeMods);
        if (notAccessMods.length > 0) {
            loggerLaunchSuite.warn(`Found unavailable mods: ${notAccessMods.join(', ')}`);
            overlay.setContent(
                'landing.dlAsync.notAccessMods.title',
                { 
                    id: 'landing.dlAsync.notAccessMods.desc',
                    values: {
                        mods: ` - ${notAccessMods.join('<br> - ')}`,
                        discord: i18n('landing.media.discord')
                    }
                },
                'landing.dlAsync.notAccessMods.removeAll',
                'landing.dlAsync.notAccessMods.close'
            );
            overlay.setHandler(() => {
                overlay.toggleOverlay(false);
                MTWNative.removeMods(notAccessMods);
                _dlAsync(distro, serv, loggerLaunchSuite, login);
            });
            overlay.setDismiss(() => {
                launchArea.set(false);
                overlay.toggleOverlay(false);
            });
            overlay.toggleOverlay(true, true);
            return;
        }

        _dlAsync(distro, serv, loggerLaunchSuite, login);
    }
}

async function _dlAsync(distro: HeliosDistribution, serv: HeliosServer, loggerLaunchSuite: Logger, login: boolean) {
    if (login) {
        if (config.getSelectedAccount() == null) {
            logger.error('You must be logged into an account.');
            loginOptions.cancelEnabled.set(false);
            loginOptions.loginSuccess.set(View.landing);
            loginOptions.loginCancel.set(View.loginOptions);
            _currentView.set(View.loginOptions);
            launchArea.set(false);
            return;
        }
        if (!await validateSelectedAccount()) {
            launchArea.set(false);
            return;
        }
    }

    setDetails('landing.dlAsync.pleaseWait');
    launchArea.set(true);
    setPercentage(0, false);

    const fullRepairModule = MTWNative.dl.newFullRepair(
        config.getCommonDirectory(),
        config.getInstanceDirectory(),
        config.getLauncherDirectory(),
        config.getSelectedServer()
    );

    fullRepairModule.spawnReceiver();

    fullRepairModule.childProcess.error((err) => {
        loggerLaunchSuite.error('Error during launch', err);
        showLaunchFailure('landing.dlAsync.errorDuringLaunchTitle', err.message);
    });
    fullRepairModule.childProcess.close((code, _signal) => {
        if (code !== 0) {
            loggerLaunchSuite.error(`Full Repair Module exited with code ${code}, assuming error.`);
            showLaunchFailure(
                'landing.dlAsync.errorDuringLaunchTitle', 
                `Full Repair Module exited with code ${code}, assuming error.`
            );
        }
    });

    loggerLaunchSuite.info('Validating files.');
    setDetails('landing.dlAsync.validatingFileIntegrity');
    setPercentage(0, true);
    let invalidFileCount = 0;
    try {
        invalidFileCount = await fullRepairModule.verifyFiles(percent => {
            setPercentage(percent, true);
        });
        setPercentage(100, true);
    } catch (err: any)  {
        loggerLaunchSuite.error('Error during file validation.');
        showLaunchFailure(
            'landing.dlAsync.errorDuringFileVerificationTitle', 
            err.displayable || 'Error during file validation.'
        );
        return;
    }

    if (invalidFileCount > 0) {
        loggerLaunchSuite.info('Downloading files.');
        setDetails('landing.dlAsync.downloadingFiles');
        setPercentage(0, true);
        try {
            await fullRepairModule.download(percent => {
                setDownloadPercentage(percent);
            });
            setDownloadPercentage(100);
        } catch (err: any) {
            loggerLaunchSuite.error('Error during file download.');
            showLaunchFailure(
                'landing.dlAsync.errorDuringFileDownloadTitle', 
                err.displayable || 'Error during file download.'
            );
            return;
        }
    } else {
        loggerLaunchSuite.info('No invalid files, skipping download.');
    }

    setPercentage(0, false);
    setProgressBar(-1);

    fullRepairModule.destroyReceiver();

    setDetails('landing.dlAsync.preparingToLaunch');

    const mojangIndexProcessor = MTWNative.dl.newMojangIndexProcessor(
        config.getCommonDirectory(),
        serv.rawServer.minecraftVersion
    );
    const dirtributionIndexProcessor = MTWNative.dl.newDistributionIndexProcessor(
        config.getCommonDirectory(),
        distro,
        serv.rawServer.id
    );

    const modLoaderData = await dirtributionIndexProcessor.loadModLoaderVersionJson();
    const versionData = await mojangIndexProcessor.getVersionJson();

    if (login) {
        const authUser = config.getSelectedAccount();
        loggerLaunchSuite.info(`Sending selected account (${authUser.displayName}) to ProcessBuilder.`);
        let pb = MTWNative.newProcessBuilder(serv, versionData, modLoaderData, authUser);
        setDetails('landing.dlAsync.launchingGame');

        let count = mcStartCount = mcStartCount + 1;
        try {
            let logBrowser: LogBrowser | undefined;
            if (config.getGameLogOpen()) {
                logBrowser = await MTWNative.openLog();
            }

            proc = pb.build(count);
            window['mcProcess_' + count] = proc;

            proc.stdout.on('data', (data) => {
                window['lastMessage_' + count] = data;
                if (data.includes('Setting user:')) {
                    launchArea.set(false);
                    setTimeout(() => {
                        if (!config.getLauncherOpen()) {
                            MTWNative.hideWindow();
                        }
                    }, 260);
                }
                if (logBrowser !== undefined) {
                    let json = MTWNative.parseMcLog(data);
                    json.forEach(event => {
                        event.timestamp = MTWNative.moment(event.timestamp).format('hh:mm:ss.SSS');
                        logBrowser?.send(event);
                    });
                }
            });

            proc.close((code) => {
                if (code == null) code = -1;
                if (code !== 0) {
                    showLaunchFailure('landing.dlAsync.gameDuringErrorTitle', 'Exited with code ' + code);
                }
                if (logBrowser !== undefined) {
                    let event: LogData = {
                        logger: 'System',
                        timestamp: MTWNative.moment().format('hh:mm:ss.SSS'),
                        level: 'INFO',
                        thread: 'main',
                        message: ''
                    };
                    logBrowser?.send(event);
                    event.timestamp = MTWNative.moment().format('hh:mm:ss.SSS');
                    event.message = 'Process ended with exit code ' + code;
                    logBrowser?.send(event);
                }
                delete window['lastMessage_' + count];
                delete window['mcProcess_' + count];
                proc = undefined;
                logBrowser = undefined;
                launchArea.set(false);
                if (!config.getLauncherOpen()) {
                    MTWNative.showWindow();
                }
            });

            setDetails('landing.dlAsync.doneEnjoyServer');
        } catch (err: any) {
            loggerLaunchSuite.error('Error during launch', err);
            showLaunchFailure(
                'landing.dlAsync.errorDuringLaunchTitle', 
                `Error during launch<br>${err.message}`
            );
            if (window['mcProcess_' + count] != null) {
                window['mcProcess_' + count].kill();
            }
        }
    }
}

export function onMounted() {
    if (!logger) logger = MTWNative.getLogger('Landing');
}