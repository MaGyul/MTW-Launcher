import { getStore } from "$lib/utils/hmr-stores";
const key = (name: string) => `settings.about.${name}`;

export const title = getStore(key('title'), 'settings.tab.about.changeLog');
export const text = getStore(key('text'), 'settings.tab.noReleaseNotes');
export const link = getStore(key('link'), 'settings.blank');

export function updateReleaceNotes() {
    MTWNative.nodeFetch('https://github.com/MaGyul/MTW-Launcher/releases.atom')
        .then((r) => r.text())
        .then((data) => {
            const version = 'v' + MTWNative.appVersion;
            const entries = jq(data).find('entry');

            for (let i = 0; i < entries.length; i++) {
                const entry = jq(entries[i]);
                let id = entry.find('id').text();
                id = id.substring(id.lastIndexOf('/') + 1);

                if (id === version) {
                    title.set(entry.find('title').text());
                    text.set(entry.find('content').text());
                    link.set(entry.find('link').attr('href') ?? 'settings.blank');
                }
            }
        })
        .catch(() => {
            text.set('settings.tab.about.releaseNotesFailed');
        });
}