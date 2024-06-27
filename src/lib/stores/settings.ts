import { getStore } from "$lib/utils/hmr-stores";
const key = (name: string) => `settings.${name}`;

export enum Tab {
    account,
    minecraft,
    java,
    launcher,
    about,
    update,
}

export const c_tab = getStore(key('currentTab'), Tab.account);