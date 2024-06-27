/// <reference types="node" />
/// <reference types="@sveltejs/kit" />
/// <reference types="svelte" />
/// <reference types="vite/client" />
/// <reference path="../node_modules/@types/jquery/index.d.ts" />
/// <reference path="../node_modules/moment/ts3.1-typings/moment.d.ts" />
/// <reference types="./config" />
/// <reference types="./authmanager" />
/// <reference types="./core" />
/// <reference types="./distromanager" />
/// <reference types="./element" />

declare const config: Config;
declare const electron: Electron;
declare const MTWNative: Native;
declare const jq: JQueryStatic;
// declare function initLang(key: string): void;
// declare function lang(key: string, ...format: string[]): string;
declare function getLang(key: string): {};
declare function langs(): string[];
declare function i18n(id: string | MessageObject, options?: Omit<MessageObject, 'id'>): string;
declare function changeView(view: View, cb?: () => void): void;
declare function currentView(): View;
declare function setSelectedAccount(uuid: string): void;
declare function refrashServerStatus(fade: boolean = false): Promise<void>;
declare function onDistroRefresh(data: HeliosDistribution): void;
declare function validateSelectedAccount(): Promise<boolean>;

declare interface Window {
    [key: string]: any;
    changeView: (view: View, cb?: () => void) => void;
    setLocale: (langId: string) => void;
    i18n: MessageFormatter,
    config: Config;
    views: any
}

declare interface Native {
    isPackaged: boolean;
    isAppx: boolean;
    userData: string;
    appVersion: string;
	ipcconstants: IpcConstants;
	authManager: AuthManager;
    DistroAPI: DistributionAPI;
    os: OS;
    common: Common;
    dl: Dl;
    java: Java;
    path: MTWPath;
    moment(inp?: moment.MomentInput, strict?: boolean): moment.Moment;
    moment(inp?: moment.MomentInput, format?: moment.MomentFormatSpecification, strict?: boolean): moment.Moment;
    moment(inp?: moment.MomentInput, format?: moment.MomentFormatSpecification, language?: string, strict?: boolean): moment.Moment;
    parseMcLog(data: string): LogData[];
    getServerStatus(protocol: number, hostname: string, port?: number): Promise<ServerStatus>;
    getLogger(logger: string): Logger;
    isdev(): boolean;
    platform(): NodeJS.Platform;
    arch(): NodeJS.Architecture;
    requestMic(): Promise<boolean>;
    changeTitle(text: string, color?: string): void;
    updateIcon(path: string): void;
    openURL(url: string): Promise<void>;
    clearTempNativeFolder(logger: Logger): Promise<void>;
    nodeFetch(url: string, options?: RequestInit): Promise<Response>;
    hideWindow(): void;
    showWindow(): void;
    closeWindow(): void;
    checkMods(mods: { path: string, id: string }[]): string[];
    removeMods(mods: string[]): void;
    checkInternet(): Promise<boolean>;
    newProcessBuilder(serv: HeliosServer, vanillaManifest: VersionJsonBase, modManifest: VersionJsonBase, authUser: Account): ProcessBuilder;
    openLog(): Promise<LogBrowser>;
}

declare interface Electron {
	send(channel: string, ...data: any[]): void;
	sendSync(channel: string, ...data: any[]): void;
	invoke(channel: string, ...data: any[]): Promise<any>;
	receive(channel: string, func: (...args: any[]) => void): void;
	receiveOne(channel: string, func: (...args: any[]) => void): void;
    removeAllListeners(channel: string): void;
    openDialog(options: OpenDialogOptions): Promise<OpenDialogReturnValue>;
    openMessage(options: MessageBoxOptions): Promise<MessageBoxReturnValue>;
    setTitleBarOverlay(options: TitleBarOverlayOptions): void;
}

declare interface Logger {
    error: (...args) => void;
    warn: (...args) => void;
    help: (...args) => void;
    data: (...args) => void;
    info: (...args) => void;
    debug: (...args) => void;
    prompt: (...args) => void;
    http: (...args) => void;
    verbose: (...args) => void;
    input: (...args) => void;
    silly: (...args) => void;
}

declare type IpcConstants = {
    MSFT_OPCODE: {
        OPEN_LOGIN: string;
        OPEN_LOGOUT: string;
        REPLY_LOGIN: string;
        REPLY_LOGOUT: string;
    },
    MSFT_REPLY_TYPE: {
        SUCCESS: string;
        ERROR: string;
    }
    MSFT_ERROR: {
        ALREADY_OPEN: string;
        NOT_FINISHED: string;
    },
    SHELL_OPCODE: {
        TRASH_ITEM: string;
    }
}

declare type MessageFormatter = (id: string | MessageObject, options?: Omit<MessageObject, 'id'>) => string;

declare type InterpolationValues = Record<string, string | number | boolean | Date | FormatXMLElementFn<unknown> | null | undefined> | undefined;
declare interface MessageObject {
    id: string;
    locale?: string;
    format?: string;
    default?: string;
    values?: InterpolationValues;
}

declare interface OS {
    totalmem: () => number;
    freemem: () => number;
}

declare type LoginOptionsCancelHandler = () => void;

declare type DefaultCursor = 'auto' | 'default' | 'none' | 'context-menu' | 'help' | 'pointer' | 'progress' | 'wait' | 'cell' | 'crosshair' | 'text' | 'vertical-text' | 'alias' | 'copy' | 'move' | 'no-drop' | 'not-allowed' | 'e-resize' | 'n-resize' | 'ne-resize' | 'nw-resize' | 's-resize' | 'se-resize' | 'sw-resize' | 'w-resize' | 'ew-resize' | 'ns-resize' | 'nesw-resize' | 'nwse-resize' | 'col-resize' | 'row-resize' | 'all-scroll' | 'zoom-in' | 'zoom-out' | 'grab' | 'grabbing'

declare type Cursor = DefaultCursor;

declare interface Common {
    isDisplayableError(it: unknown): boolean;
    validateLocalFile(path: string, algo: string, hash?: string): Promise<boolean>
}

declare interface Dl {
    newFullRepair(common: string, instance: string, launcher: string, serverId: string): FullRepair;
    newMojangIndexProcessor(common: string, version: string): MojangIndexProcessor;
    newDistributionIndexProcessor(common: string, distro: HeliosDistribution, serverId: string): DistributionIndexProcessor;
    downloadFile(url: string, path: string, onProgress?: (progress: Progress) => void): Promise<void>
}

declare interface Java {
    discoverBestJvmInstallation(dataDir: string, semverRange: string): Promise<JvmDetails | null>;
    validateSelectedJvm(path: string, semverRange: string): Promise<JvmDetails | null>;
    ensureJavaDirIsRoot(dir: string): string;
    javaExecFromRoot(rootDir: string): string;
    latestOpenJDK(major: number, dataDir: string, distribution?: JdkDistribution): Promise<Asset | null>;
    extractJdk(archivePath: string): Promise<string>
}

declare interface MTWPath {
    join(...paths: string[]): string;
    exists(path: string): boolean;
    mkdir(path: string): void;
}

declare interface PlayerList {
    name: string;
    id: string;
}

declare interface ServerStatus {
    version: {
        name: string;
        protocol: number;
    };
    players: {
        max: number;
        online: number;
        sample: PlayerList[];
    };
    description: {
        text: string;
    };
    favicon: string;
    modinfo?: {
        type: string;
        modList: {
            modid: string;
            version: string;
        }[];
    };
    retrievedAt: number;
}

declare interface LogData {
    logger: string;
    timestamp: number | string;
    level: string;
    thread: string;
    message: string;
}

declare interface LogBrowser {
    send(data: LogData): void;
    sendConfig(key: string, value: any): void;
}

declare abstract class BaseTransmitter {
    spawnReceiver(additionalEnvVars?: NodeJS.ProcessEnv): void;
    abstract receiverName(): string;
    destroyReceiver(): void;
    get childProcess(): ContextChildProcess;
}

declare class FullRepair extends BaseTransmitter {
    receiverName(): string;
    verifyFiles(onProgress: (percent: number) => void): Promise<number>;
    download(onProgress: (percent: number) => void): Promise<void>;
}

declare interface ContextChildProcess {
    error(listener: (err: Error) => void): void;
    close(listener: (code: number | null, signal: NodeJS.Signals | null) => void): void;
}

declare interface Account {
    accessToken: string;
    displayName: string;
    expiresAt: number;
    microsoft: MicrosoftAccount;
    type: 'microsoft' | 'mojang';
    username: string;
    uuid: string;
}

declare interface MicrosoftAccount {
    access_token: string;
    expires_at: number;
    refresh_token: string;
}

declare interface Progress {
    percent: number;
    transferred: number;
    total?: number;
}

declare interface Asset {
    id: string;
    hash: string;
    algo: string;
    size: number;
    url: string;
    path: string;
}

declare interface JavaVersion {
    major: number;
    minor: number;
    patch: number;
}

declare interface JvmDetails {
    semver: JavaVersion;
    semverStr: string;
    vendor: string;
    path: string;
}

// Electron //

declare interface FileFilter {

    // Docs: https://electronjs.org/docs/api/structures/file-filter

    extensions: string[];
    name: string;
}
declare type DialogOptionsProperties = 'openFile' | 'openDirectory' | 'multiSelections' | 'showHiddenFiles' | 'createDirectory' | 'promptToCreate' | 'noResolveAliases' | 'treatPackageAsDirectory' | 'dontAddToRecent';
declare interface OpenDialogOptions {
    title?: string;
    defaultPath?: string;
    /**
     * Custom label for the confirmation button, when left empty the default label will
     * be used.
     */
    buttonLabel?: string;
    filters?: FileFilter[];
    /**
     * Contains which features the dialog should use. The following values are
     * supported:
     */
    properties?: DialogOptionsProperties[];
    /**
     * Message to display above input boxes.
     *
     * @platform darwin
     */
    message?: string;
    /**
     * Create security scoped bookmarks when packaged for the Mac App Store.
     *
     * @platform darwin,mas
     */
    securityScopedBookmarks?: boolean;
}
declare interface MessageBoxOptions {
    /**
     * Content of the message box.
     */
    message: string;
    /**
     * Can be `none`, `info`, `error`, `question` or `warning`. On Windows, `question`
     * displays the same icon as `info`, unless you set an icon using the `icon`
     * option. On macOS, both `warning` and `error` display the same warning icon.
     */
    type?: ('none' | 'info' | 'error' | 'question' | 'warning');
    /**
     * Array of texts for buttons. On Windows, an empty array will result in one button
     * labeled "OK".
     */
    buttons?: string[];
    /**
     * Index of the button in the buttons array which will be selected by default when
     * the message box opens.
     */
    defaultId?: number;
    /**
     * Pass an instance of AbortSignal to optionally close the message box, the message
     * box will behave as if it was cancelled by the user. On macOS, `signal` does not
     * work with message boxes that do not have a parent window, since those message
     * boxes run synchronously due to platform limitations.
     */
    signal?: AbortSignal;
    /**
     * Title of the message box, some platforms will not show it.
     */
    title?: string;
    /**
     * Extra information of the message.
     */
    detail?: string;
    /**
     * If provided, the message box will include a checkbox with the given label.
     */
    checkboxLabel?: string;
    /**
     * Initial checked state of the checkbox. `false` by default.
     */
    checkboxChecked?: boolean;
    icon?: (NativeImage) | (string);
    /**
     * Custom width of the text in the message box.
     *
     * @platform darwin
     */
    textWidth?: number;
    /**
     * The index of the button to be used to cancel the dialog, via the `Esc` key. By
     * default this is assigned to the first button with "cancel" or "no" as the label.
     * If no such labeled buttons exist and this option is not set, `0` will be used as
     * the return value.
     */
    cancelId?: number;
    /**
     * On Windows Electron will try to figure out which one of the `buttons` are common
     * buttons (like "Cancel" or "Yes"), and show the others as command links in the
     * dialog. This can make the dialog appear in the style of modern Windows apps. If
     * you don't like this behavior, you can set `noLink` to `true`.
     */
    noLink?: boolean;
    /**
     * Normalize the keyboard access keys across platforms. Default is `false`.
     * Enabling this assumes `&` is used in the button labels for the placement of the
     * keyboard shortcut access key and labels will be converted so they work correctly
     * on each platform, `&` characters are removed on macOS, converted to `_` on
     * Linux, and left untouched on Windows. For example, a button label of `Vie&w`
     * will be converted to `Vie_w` on Linux and `View` on macOS and can be selected
     * via `Alt-W` on Windows and Linux.
     */
    normalizeAccessKeys?: boolean;
}
declare interface MessageBoxReturnValue {
    /**
     * The index of the clicked button.
     */
    response: number;
    /**
     * The checked state of the checkbox if `checkboxLabel` was set. Otherwise `false`.
     */
    checkboxChecked: boolean;
}
declare interface OpenDialogReturnValue {
    /**
     * whether or not the dialog was canceled.
     */
    canceled: boolean;
    /**
     * An array of file paths chosen by the user. If the dialog is cancelled this will
     * be an empty array.
     */
    filePaths: string[];
    /**
     * An array matching the `filePaths` array of base64 encoded strings which contains
     * security scoped bookmark data. `securityScopedBookmarks` must be enabled for
     * this to be populated. (For return values, see table here.)
     *
     * @platform darwin,mas
     */
    bookmarks?: string[];
}

declare interface TitleBarOverlayOptions {
    /**
     * The CSS color of the Window Controls Overlay when enabled.
     *
     * @platform win32
     */
    color?: string;
    /**
     * The CSS color of the symbols on the Window Controls Overlay when enabled.
     *
     * @platform win32
     */
    symbolColor?: string;
    /**
     * The height of the title bar and Window Controls Overlay in pixels.
     *
     * @platform darwin,win32
     */
    height?: number;
}

declare interface ProgressBarOptions {
    /**
     * Mode for the progress bar. Can be `none`, `normal`, `indeterminate`, `error` or
     * `paused`.
     *
     * @platform win32
     */
    mode: ('none' | 'normal' | 'indeterminate' | 'error' | 'paused');
}

declare interface ReleaseNoteInfo {
    /**
     * The version.
     */
    readonly version: string;
    /**
     * The note.
     */
    readonly note: string | null;
}

declare interface UpdateInfo {
    /**
     * The version.
     */
    readonly version: string;
    readonly files: Array<import('electron-updater').UpdateFileInfo>;
    /** @deprecated */
    readonly path: string;
    /** @deprecated */
    readonly sha512: string;
    /**
     * The release name.
     */
    releaseName?: string | null;
    /**
     * The release notes. List if `updater.fullChangelog` is set to `true`, `string` otherwise.
     */
    releaseNotes?: string | Array<ReleaseNoteInfo> | null;
    /**
     * The release date.
     */
    releaseDate: string;
    /**
     * The [staged rollout](/auto-update#staged-rollouts) percentage, 0-100.
     */
    readonly stagingPercentage?: number;
}

declare interface AutoUpdaterInfo extends UpdateInfo {
    downloadedFile: string;
    total: number;
    delta: number;
    transferred: number;
    percent: number;
    bytesPerSecond: number;
    code: string;
}