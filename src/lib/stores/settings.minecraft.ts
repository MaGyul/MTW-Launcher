import { getStore } from "$lib/utils/hmr-stores";
const key = (name: string) => `settings.minecraft.${name}`;

export const gameWidth = getStore(key('gameWidth'), 1280);
export const gameHeight = getStore(key('gameHeight'), 720);
export const fullscreen = getStore(key('fullscreen'), false);
export const autoConnect = getStore(key('autoConnect'), true);
export const launchDetached = getStore(key('launchDetached'), true);

export function onInit() {
    gameWidth.set(config.getGameWidth());
    gameWidth.subscribe((value) => {
        config.setGameWidth(value);
        config.save();
    });
    gameHeight.set(config.getGameHeight());
    gameHeight.subscribe((value) => {
        config.setGameHeight(value);
        config.save();
    });
    fullscreen.set(config.getFullscreen());
    fullscreen.subscribe((value) => {
        config.setFullscreen(value);
        config.save();
    });
    autoConnect.set(config.getAutoConnect());
    autoConnect.subscribe((value) => {
        config.setAutoConnect(value);
        config.save();
    });
    launchDetached.set(config.getLaunchDetached());
    launchDetached.subscribe((value) => {
        config.setLaunchDetached(value);
        config.save();
    });
}