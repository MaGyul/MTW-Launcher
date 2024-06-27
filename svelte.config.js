import adapter from '@sveltejs/adapter-static';
import preprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: preprocess(),

	kit: {
		adapter: adapter({
			fallback: 'index.html',
		}),
		prerender: { entries: [] },
	},

	onwarn: (warning, handler) => {
		const { code, frame } = warning;
		if (code === 'css-unused-selector') {
			if (frame.includes('::before') ||
				frame.includes(':hover') ||
				frame.includes(':focus') ||
				frame.includes(':active') ||
				frame.includes(':disabled') ||
				frame.includes('[data-') ||
				frame.includes('[type='))
				return;
		}

		handler(warning);
	}
};

export default config;
