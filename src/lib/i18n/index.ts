import { init, register, addMessages } from 'svelte-i18n';

const defaultLocale = 'en';

for (let key of langs()) {
    register(key, async () => getLang(key));
    fetch(`https://mathwor.com/launcher/${key}.json`, { cache: 'no-store' }).then(async res => {
        if (res.ok) {
            try {
                let data = await res.json();
                addMessages(key, data);
            } catch {}
        }
    }).catch(() => undefined);
}

init({
    fallbackLocale: defaultLocale,
});