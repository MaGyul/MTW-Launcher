import { getStore, getValue } from "$lib/utils/hmr-stores";
import type { Writable } from "svelte/store";
const key = (name: string) => `overlay.${name}`;

export type I18n = string | MessageObject;

// start overlay
// require @html
export const title: Writable<I18n> = getStore(key('title'), { id: '' });
// require @html
export const desc: Writable<I18n> = getStore(key('desc'), { id: '' });
export const acknowledge: Writable<I18n> = getStore(key('acknowledge'), { id: '' });
export const dismiss: Writable<I18n> = getStore(key('dismiss'), { id: '' });
export const confirmHandler = getStore(key('confirmHandler'), () => {});
export const dismissHandler = getStore(key('dismissHandler'), () => {});
// end

// start +page
type ContentType = 'account' | 'content';

export const dismissable = getStore(key('dismissable'), false);
export const content: Writable<ContentType> = getStore(key('content'), 'content');
export const state = getStore(key('state'), false);

export function setContent(_title: I18n, _desc: I18n, _acknowledge: I18n, _dismiss?: I18n) {
    title.set(_title);
    desc.set(_desc);
    acknowledge.set(_acknowledge);
    if (_dismiss) 
        dismiss.set(_dismiss);
}
export function setHandler(func?: () => void) {
    if (func) confirmHandler.set(func);
    else confirmHandler.set(() => {});
}
export function setDismiss(func?: () => void) {
    if (func) dismissHandler.set(func);
    else dismissHandler.set(() => {});
}
export function toggleOverlay(toggleState?: boolean, d: boolean | ContentType = false, c: ContentType = 'content') {
    if (toggleState == undefined) {
        toggleState = !getValue(state);
    }
    if (typeof d === 'string') {
        c = d;
        d = false;
    }
    dismissable.set(d);
    content.set(c);
    state.set(toggleState);
}

// end