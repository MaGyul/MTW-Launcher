import { getStore } from "$lib/utils/hmr-stores";
import type { Writable } from "svelte/store";
const key = (name: string) => `settings.java.${name}`;

export const minRAMValue = getStore(key('minRAMValue'), 3);
export const maxRAMValue = getStore(key('maxRAMValue'), 3);
export const minMemory = getStore(key('minMemory'), 3);
export const maxMemory = getStore(key('maxMemory'), 8);
export const rangeStep = getStore(key('rangeStep'), 0.5);
// JavaExecutable Value
export const jeValue = getStore(key('javaExecutableValue'), '');
export const jvmOptions = getStore(key('jvmOptions'), '');
export const details = getStore(key('javaExecDetails'), '');
export const detailsOptions: Writable<Omit<MessageObject, "id"> | undefined> = getStore(key('javaExecDetailsOptions'), undefined);

function getRam(serverId: string, type: 'min' | 'max') {
    let ram;
    if (type === 'min') {
        ram = config.getMinRAM(serverId);
    } else {
        ram = config.getMaxRAM(serverId);
    }
    let res;
    if (ram.endsWith('M')) {
        res = Number(ram.substring(0, ram.length - 1)) / 1024;
    } else {
        res = Number.parseFloat(ram);
    }
    if (Number.isNaN(res)) return 3;
    return res;
}

async function checkJavaExecDetails(execPath: string) {
    const server = (await MTWNative.DistroAPI.getDistribution()).getServerById(config.getSelectedServer());
    if (server) {
        const d = await MTWNative.java.validateSelectedJvm(
            MTWNative.java.ensureJavaDirIsRoot(execPath),
            server.effectiveJavaOptions.supported
        );

        if (d != null) {
            details.set('settings.tab.java.selectedJava');
            detailsOptions.set({
                values: {
                    version: d.semverStr,
                    vendor: d.vendor
                }
            })
        } else {
            details.set('settings.tab.java.invalidSelection');
        }
    }
}

export function onInit() {
    const serverId = config.getSelectedServer();
    minRAMValue.set(getRam(serverId, 'min'));
    minRAMValue.subscribe((value) => {
        config.setMinRAM(serverId, value % 1 > 0 ? `${value * 1024}M` : `${value}G`);
        config.save();
    });
    maxRAMValue.set(getRam(serverId, 'max'));
    maxRAMValue.subscribe((value) => {
        config.setMaxRAM(serverId, value % 1 > 0 ? `${value * 1024}M` : `${value}G`);
        config.save();
    });
    jvmOptions.set(config.getJVMOptions(serverId).join(' '));
    jvmOptions.subscribe((value) => {
        if (!value.trim()) {
            config.setJVMOptions(serverId, []);
        } else {
            config.setJVMOptions(serverId, value.trim().split(/\s+/));
        }
        config.save();
    })
    jeValue.set(config.getJavaExecutable(serverId) || '');
    jeValue.subscribe((value) => {
        config.setJavaExecutable(serverId, value);
        config.save();
        checkJavaExecDetails(value);
    })
}