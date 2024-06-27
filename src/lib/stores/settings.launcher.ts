import { getStore } from "$lib/utils/hmr-stores";
const key = (name: string) => `settings.launcher.${name}`;

// dataDirectory Value
export const ddValue = getStore(key('dataDirectoryValue'), '');
export const launcherOpen = getStore(key('launcherOpen'), false);
export const gameLogOpen = getStore(key('gameLogOpen'), false);
export const trayMove = getStore(key('trayMove'), false);
// export const tbColor = getStore(key('titleBarColor'), '');

export function onInit() {
    ddValue.set(config.getDataDirectory());
    ddValue.subscribe((value) => {
        config.setDataDirectory(value);
        config.save();
    });
    launcherOpen.set(config.getLauncherOpen());
    launcherOpen.subscribe((value) =>  {
        config.setLauncherOpen(value);
        config.save();
    });
    gameLogOpen.set(config.getGameLogOpen());
    gameLogOpen.subscribe((value) => {
        config.setGameLogOpen(value);
        config.save();
    });
    trayMove.set(config.getTrayMove());
    electron.send('send-config', 'trayMove', config.getTrayMove());
    trayMove.subscribe((value) => {
        electron.send('send-config', 'trayMove', value);
        config.setTrayMove(value);
        config.save();
    });
    // const color = config.getTitleBarColor();
    // tbColor.set(color);
    // tbColor.subscribe((value) => {
    //     config.setTitleBarColor(value);
    //     config.save();
    // });
    // electron.setTitleBarOverlay({
    //     color: color
    // });
}