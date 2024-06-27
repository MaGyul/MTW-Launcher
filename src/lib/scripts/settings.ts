import { View } from '$lib/types/+page';
import { loginCancel, loginSuccess, viewOnCancel } from '$lib/stores/loginOptions';
import { ddValue } from '$lib/stores/settings.launcher';
import { jeValue } from '$lib/stores/settings.java';
import * as overlay from '$lib/stores/overlay';
import { updateSelectedAccount } from '$lib/stores/landing';

class Elements {
    public navDone: HTMLButtonElement | undefined;
}

var settingsLogger: Logger;
export var msftLoginLogger: Logger;
export var msftLogoutLogger: Logger;
var MSFT_OPCODE: {
    OPEN_LOGIN: string;
    OPEN_LOGOUT: string;
    REPLY_LOGIN: string;
    REPLY_LOGOUT: string;
};
var MSFT_REPLY_TYPE: {
    SUCCESS: string;
    ERROR: string;
};
var MSFT_ERROR: {
    ALREADY_OPEN: string;
    NOT_FINISHED: string;
};

export function onMount() {
    settingsLogger = MTWNative.getLogger('Settings Script');
    settingsLogger.info('Script mounting...');
    const ipcconstants = MTWNative.ipcconstants;
    MSFT_OPCODE = ipcconstants.MSFT_OPCODE;
    MSFT_REPLY_TYPE = ipcconstants.MSFT_REPLY_TYPE;
    MSFT_ERROR = ipcconstants.MSFT_ERROR;
    msftLoginLogger = MTWNative.getLogger('Microsoft Login');
    msftLogoutLogger = MTWNative.getLogger('Microsoft Logout');
    electron.receive(MSFT_OPCODE.REPLY_LOGIN, (...args) => {
        msftReplyLogin(args);
    });
    settingsLogger.info('Script mounted!');
}

export const settingsState = {
    invalid: new Set<string>()
}

export const elements: Elements = new Elements();

export function fileSelector(isjava: boolean, title: string | undefined, directory: boolean) {
    const platform = MTWNative.platform();
    return (e: Event) => {
        const properties: DialogOptionsProperties[] = directory ? ['openDirectory', 'createDirectory'] : ['openFile'];

        const options: OpenDialogOptions = {
            properties
        }

        if (title != undefined) {
            options.title = title;
        }

        if (isjava && platform === 'win32') {
            options.filters = [
                { name: i18n('settings.fileSelectors.executables'), extensions: ['exe'] },
                { name: i18n('settings.fileSelectors.allFiles'), extensions: ['*'] }
            ];
        }

        electron.openDialog(options).then((res) => {
            if (!res.canceled && (e.target != null && e.target instanceof HTMLButtonElement)) {
                let path = res.filePaths[0];
                if (isjava) {
                    jeValue.set(path);
                } else {
                    ddValue.set(path);
                }
            }
        });
    };
}

export function keyupGameResolution(func: (res: number) => boolean) {
    return (e: KeyboardEvent) => {
        const v = e.target as HTMLInputElement;
        if (v != null) {
            if (!func(Number(v.value))) {
                settingsState.invalid.add(v.id);
                v.setAttribute('data-error', '');
                saveDisabled(true);
            } else {
                if (v.hasAttribute('data-error')) {
                    v.removeAttribute('data-error');
                    settingsState.invalid.delete(v.id);
                    if (settingsState.invalid.size === 0) {
                        saveDisabled(false);
                    }
                }
            }
        }
    };
}

function saveDisabled(v: boolean) {
    if (elements.navDone) {
        elements.navDone.disabled = v;
    }
}

function fullSave() {

}

export function navDone() {
    return () => {
        fullSave();
        //changeView(View.landing);
    }
}

export function addMicrosoftAccount() {
    changeView(View.waiting, () => {
        electron.send(MSFT_OPCODE.OPEN_LOGIN, View.settings, View.settings, i18n('settings.msft.login.windowTitle'));
    });
}

function msftReplyLogin(args: any[]) {
    if (args[0] === MSFT_REPLY_TYPE.ERROR) {
        const viewOnClose = args[2];
        changeView(viewOnClose, () => {
            if (args[1] === MSFT_ERROR.NOT_FINISHED) {
                msftLoginLogger.info('Login cancelled by user.');
                return;
            }

            overlay.setContent(
                'settings.msft.login.errorTitle',
                'settings.msft.login.errorMessage',
                'settings.msft.login.okButton'
            );
            overlay.setHandler(() => {
                overlay.toggleOverlay(false);
            });
            overlay.toggleOverlay(true);
        });
    } else if (args[0] === MSFT_REPLY_TYPE.SUCCESS) {
        loginSuccess.set(0);
        loginCancel.set(0);
        viewOnCancel.set(0);
        const queryMap = args[1];
        const viewOnClose = args[2];

        if (Object.prototype.hasOwnProperty.call(queryMap, 'error')) {
            changeView(viewOnClose, () => {
                let error = queryMap.error; // Error might to 'access_denied' ?
                let errorDesc = queryMap.error_description;
                console.log('Error getting authCode, is Azure application registered correctly?');
                console.log(error);
                console.log(errorDesc);
                console.log('Full query map:', queryMap);
                overlay.setContent(
                    error,
                    errorDesc,
                    'settings.msft.login.okButton'
                );
                overlay.setHandler(() => {
                    overlay.toggleOverlay(false);
                });
                overlay.toggleOverlay(true);
            });
        } else {
            msftLoginLogger.info('Acquired authCode, proceeding with authentication');

            const authCode = queryMap.code;
            MTWNative.authManager.addMicrosoftAccount(authCode).then(value => {
                updateSelectedAccount(value);
                changeView(viewOnClose, () => {
                    if (window.refrashAccounts)
                        window.refrashAccounts();
                })
            }).catch((displayableError) => {
                let actualDisplayableError: any;
                if (MTWNative.common.isDisplayableError(displayableError)) {
                    msftLoginLogger.error('Error while logging in.', displayableError);
                    actualDisplayableError = displayableError;
                } else {
                    // Un of.
                    msftLoginLogger.error('Unhandled error during login.', displayableError);
                    actualDisplayableError = {
                        titie: 'settings.msft.login.unknown.title',
                        desc: {
                            id: 'settings.msft.login.unknown.desc',
                            values: {
                                error: displayableError.message
                            }
                        },
                    };
                }

                if (actualDisplayableError.desc.includes('Please see the console for details.')) {
                    actualDisplayableError.desc = actualDisplayableError.desc.replace('Please see the console for details.', `<br><br>${displayableError.message}`);
                }

                changeView(viewOnClose, () => {
                    overlay.setContent(
                        actualDisplayableError.title,
                        actualDisplayableError.desc,
                        'settings.msft.login.tryAgain'
                    );
                    overlay.setHandler(() => {
                        overlay.toggleOverlay(false);
                    });
                    overlay.toggleOverlay(true);
                });
            });
        }
    }
}