import { View } from "$lib/types/+page";
import { getStore } from "$lib/utils/hmr-stores";
const key = (name: string) => `+page.${name}`;

export const _currentView = getStore(key('currentView'), View.empty);