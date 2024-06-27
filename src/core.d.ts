declare interface Rule {
    action: string;
    os?: {
        name: string;
        version?: string;
    };
    features?: {
        [key: string]: boolean;
    };
}
declare interface Natives {
    linux?: string;
    osx?: string;
    windows?: string;
}
declare interface BaseArtifact {
    sha1: string;
    size: number;
    url: string;
}
declare interface LibraryArtifact extends BaseArtifact {
    path: string;
}
declare interface Library {
    downloads: {
        artifact: LibraryArtifact;
        classifiers?: {
            javadoc?: LibraryArtifact;
            'natives-linux'?: LibraryArtifact;
            'natives-macos'?: LibraryArtifact;
            'natives-windows'?: LibraryArtifact;
            sources?: LibraryArtifact;
        };
    };
    extract?: {
        exclude: string[];
    };
    name: string;
    natives?: Natives;
    rules?: Rule[];
}
declare interface VersionJsonBase {
    assetIndex: {
        id: string;
        sha1: string;
        size: number;
        totalSize: number;
        url: string;
    };
    assets: string;
    downloads: {
        client: BaseArtifact;
        server: BaseArtifact;
    };
    id: string;
    /**
     * Only on modloader version properties (extend and override base version)
     */
    inheritsFrom?: string;
    libraries: Library[];
    logging: {
        client: {
            argument: string;
            file: {
                id: string;
                sha1: string;
                size: number;
                url: string;
            };
            type: string;
        };
    };
    mainClass: string;
    releaseTime: string;
    time: string;
    type: string;
}
declare interface VersionJsonLegacy extends VersionJsonBase {
    minecraftArguments: string;
}
declare interface VersionJsonNew extends VersionJsonBase {
    arguments: {
        game: (string | RuleBasedArgument)[];
        jvm: (string | RuleBasedArgument)[];
    };
}
declare interface RuleBasedArgument {
    rules: Rule[];
    value: string | string[];
}
declare interface AssetIndex {
    objects: {
        [file: string]: {
            hash: string;
            size: number;
        };
    };
}
declare interface MojangVersionManifest {
    latest: {
        release: string;
        snapshot: string;
    };
    versions: {
        id: string;
        type: string;
        url: string;
        time: string;
        releaseTime: string;
        sha1: string;
        complianceLevel: number;
    }[];
}
declare interface LauncherJava {
    sha1: string;
    url: string;
    version: string;
}
declare interface LauncherVersions {
    launcher: {
        commit: string;
        name: string;
    };
}
declare interface LauncherJson {
    java: {
        lzma: {
            sha1: string;
            url: string;
        };
        sha1: string;
    };
    linux: {
        applink: string;
        downloadhash: string;
        versions: LauncherVersions;
    };
    osx: {
        '64': {
            jdk: LauncherJava;
            jre: LauncherJava;
        };
        apphash: string;
        applink: string;
        downloadhash: string;
        versions: LauncherVersions;
    };
    windows: {
        '32': {
            jdk: LauncherJava;
            jre: LauncherJava;
        };
        '64': {
            jdk: LauncherJava;
            jre: LauncherJava;
        };
        apphash: string;
        applink: string;
        downloadhash: string;
        rolloutPercent: number;
        versions: LauncherVersions;
    };
}
declare abstract class IndexProcessor {
    protected commonDir: string;
    abstract init(): Promise<void>;
    abstract totalStages(): number;
    abstract validate(onStageComplete: () => Promise<void>): Promise<{
        [category: string]: Asset[];
    }>;
    abstract postDownload(): Promise<void>;
}
declare class MojangIndexProcessor extends IndexProcessor {
    protected version: string;
    private versionJson;
    private assetIndex;
    private client;
    private assetPath;
    init(): Promise<void>;
    getVersionJson(): Promise<VersionJsonBase>;
    private loadAssetIndex;
    private loadVersionJson;
    private loadContentWithRemoteFallback;
    private loadVersionManifest;
    private getAssetIndexPath;
    totalStages(): number;
    validate(onStageComplete: () => Promise<void>): Promise<{
        [category: string]: Asset[];
    }>;
    postDownload(): Promise<void>;
    private validateAssets;
    private validateLibraries;
    private validateClient;
    private validateLogConfig;
}
declare class DistributionIndexProcessor extends IndexProcessor {
    protected distribution: HeliosDistribution;
    protected serverId: string;
    private validateModules;
    loadModLoaderVersionJson(): Promise<VersionJsonBase>;
}
declare class ProcessBuilder {
    build(count: number): ProcessBuilderChildProcess;
}
declare class ProcessBuilderChildProcess {
    killed: boolean;
    exitCode: number;
    stdout: import('node:stream').Readable;
    stderr: import('node:stream').Readable;
    close(listener: (code: number | null, signal: NodeJS.Signals | null) => void): void;
    kill(signal?: number | NodeJS.Signals | undefined): void;
}