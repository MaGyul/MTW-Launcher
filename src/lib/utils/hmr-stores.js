// Customized HMR-safe stores
// Based off https://github.com/svitejs/svite/blob/ddec6b9/packages/playground/hmr/src/stores/hmr-stores.js
import { get, writable } from 'svelte/store';

/**
 * @type { Record<string, import('svelte/store').Writable<any>> }
 */
let stores = {};

/**
 * @template T
 * @param { string } id
 * @param { T } initialValue
 * @returns { import('svelte/store').Writable<T> }
 */
export function getStore(id, initialValue) {
	return stores[id] || (stores[id] = writable(initialValue));
}

/**
 * @template T
 * @param { import('svelte/store').Writable<T> } store
 * @returns { T }
 */
export function getValue(store) {
	return get(store);
}

/**
 * @template T
 * @param { string } id
 * @param { T } value
 */
export function setStore(id, value) {
	stores[id] = writable(value);
}

/**
 * @param { string } id
 * @returns { boolean }
 */
export function hasStore(id) {
	return stores[id] != undefined;
}

// preserve the store across HMR updates
if (import.meta.hot) {
	if (import.meta.hot.data.stores) {
		stores = import.meta.hot.data.stores;
	}
	import.meta.hot.accept();
	import.meta.hot.dispose(() => {
		import.meta.hot.data.stores = stores;
	});
}
