import { View } from '$lib/types/+page';
import { getStore } from '$lib/utils/hmr-stores';
import type { Writable } from 'svelte/store';
const key = (name: string) => `loginOptions.${name}`;

export const cancelEnabled = getStore(key('cancelEnabled'), false);
export const loginSuccess = getStore(key('loginSuccess'), View.empty);
export const loginCancel = getStore(key('loginCancel'), View.empty);
export const viewOnCancel = getStore(key('viewOnCancel'), View.empty);
export const cancelHandler: Writable<LoginOptionsCancelHandler> = getStore(key('cancelHandler'), () => {});