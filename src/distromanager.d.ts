declare enum Platform {
    /**
     * macOS
     * @since 1.2.0
     */
    DARWIN = "darwin",
    /**
     * Linux
     * @since 1.2.0
     */
    LINUX = "linux",
    /**
     * Windows
     * @since 1.2.0
     */
    WIN32 = "win32"
}

declare enum Architecture {
    /**
     * arm64
     * @since 1.2.0
     */
    ARM64 = "arm64",
    /**
     * x64
     * @since 1.2.0
     */
    X64 = "x64"
}

declare enum JdkDistribution {
    /**
     * Amazon Corretto
     * @see https://aws.amazon.com/corretto/
     * @since 1.2.0
     */
    CORRETTO = "CORRETTO",
    /**
     * Eclipse Temurin
     * @see https://projects.eclipse.org/projects/adoptium.temurin
     * @since 1.2.0
     */
    TEMURIN = "TEMURIN"
}
/**
 * Properties used to specify version information.
 * @since 1.2.0
 */
declare interface JavaVersionProps {
    /**
     * Preferred JDK distribution to download if no applicable installation could
     * be found.
     * If omitted, the client will decide (decision may be platform-specific).
     * @since 1.2.0
     */
    distribution?: JdkDistribution;
    /**
     * A semver range of supported JDK versions.
     *
     * Java version syntax is platform dependent.
     *
     * JDK 8 and prior
     * 1.{major}.{minor}_{patch}-b{build}
     * Ex. 1.8.0_152-b16
     *
     * JDK 9+
     * {major}.{minor}.{patch}+{build}
     * Ex. 11.0.12+7
     *
     * For processing, all versions will be translated into a
     * semver compliant string. JDK 9+ is already semver. For
     * versions 8 and below, 1.{major}.{minor}_{patch}-b{build}
     * will be translated to {major}.{minor}.{patch}+{build}.
     *
     * If specified, you must also specify suggestedMajor.
     *
     * If omitted, the client will decide based on the game version.
     * @see https://github.com/npm/node-semver#ranges
     * @since 1.2.0
     */
    supported?: string;
    /**
     * The suggested major Java version. The suggested major
     * should comply with the version range specified by supported,
     * if defined. This will be used in messages displayed to the
     * end user, and to automatically fetch a Java version.
     *
     * NOTE If supported is specified, suggestedMajor must be set.
     * The launcher's default value may not comply with your custom
     * major supported range.
     *
     * Common use case:
     * supported: >=17.x
     * suggestedMajor: 17
     *
     * More involved:
     * supported: >=16 <20
     * suggestedMajor: 17
     *
     * Given a wider support range, it becomes necessary to specify which
     * major version in the range is the suggested.
     * @since 1.2.0
     */
    suggestedMajor?: number;
}
/**
 * Java validation rules for a specific platform.
 *
 * @since 1.2.0
 */
declare interface JavaPlatformOptions extends JavaVersionProps {
    /**
     * The platform that this validation matrix applies to.
     * @since 1.2.0
     */
    platform: Platform;
    /**
     * The architecture that this validation matrix applies to.
     * If omitted, applies to all architectures.
     * @since 1.2.0
     */
    architecture?: Architecture;
}
/**
 * Java options.
 * @since 1.2.0
 */
declare interface JavaOptions extends JavaVersionProps {
    /**
     * Platform-specific java rules for this server configuration.
     * Validation rules will be delegated to the client for
     * any undefined properties. Java validation can be configured
     * for specific platforms and architectures. The most specific
     * ruleset will be applied.
     *
     * Maxtrix Precedence (Highest - Lowest)
     * - Current platform, current architecture (ex. win32 x64)
     * - Current platform, any architecture (ex. win32)
     * - Java Options base properties (defined on this object)
     * - Client logic (default logic in the client)
     *
     * @since 1.2.0
     */
    platformOptions?: JavaPlatformOptions[];
    /**
     * RAM settings.
     * If omitted, legacy client logic will be used to determine these values.
     * @since 1.2.0
     */
    ram?: {
        /**
         * The recommended amount of RAM in megabytes. Must be an interval of 512.
         * @since 1.2.0
         */
        recommended: number;
        /**
         * The absolute minimum amount of RAM in megabytes. Must be an interval of 512.
         * @since 1.2.0
         */
        minimum: number;
    };
}
declare interface Artifact {
    /**
     * The size of the artifact.
     */
    size: number;
    /**
     * The MD5 hash of the artifact. This will be used to validate local artifacts.
     * Modules that do not provide an MD5 are untracked and not validated.
     */
    MD5?: string;
    /**
     * The artifact's download url.
     */
    url: string;
    /**
     * A relative path to where the file will be saved. This is appended to the base
     * path for the module's declared type.
     * If this is not specified, the path will be resolved based on the module's ID.
     */
    path?: string;
}
declare interface Required_D {
    /**
     * If the module is required. Defaults to true if this property is omited.
     */
    value?: boolean;
    /**
     * If the module is enabled by default. Has no effect unless Required.value
     * is false. Defaults to true if this property is omited.
     */
    def?: boolean;
}
declare enum Type {
    Library = "Library",
    ForgeHosted = "ForgeHosted",
    Forge = "Forge",
    Fabric = "Fabric",
    LiteLoader = "LiteLoader",
    ForgeMod = "ForgeMod",
    FabricMod = "FabricMod",
    LiteMod = "LiteMod",
    File = "File",
    VersionManifest = "VersionManifest"
}
declare interface Module {
    /**
     * The ID of the module. All modules that are not of type File MUST use a maven identifier.
     *  Version information and other metadata is pulled from the identifier. Modules which are
     * stored maven style use the identifier to resolve the destination path. If the extension
     * is not provided, it defaults to jar.
     *
     * Template
     *
     * my.group:arifact:version@extension
     *
     * my/group/artifact/version/artifact-version.extension
     *
     * If the module's artifact does not declare the path property, its path will be resolved from the ID.
     */
    id: string;
    /**
     * The name of the module. Used on the UI.
     */
    name: string;
    /**
     * The type of the module.
     */
    type: Type;
    /**
     * Whether or not this module should be included on the classpath.
     * Only applicable to modules of type Library.
     *
     * Defaults to true when not present.
     *
     * @since 1.1.0
     */
    classpath?: boolean;
    /**
     * Defines whether or not the module is required. If omitted, then the module will be required.
     */
    required?: Required_D;
    /**
     * The download artifact for the module.
     */
    artifact: Artifact;
    /**
     * An array of sub modules declared by this module. Typically, files which require other files
     * are declared as submodules. A quick example would be a mod, and the configuration file for
     * that mod. Submodules can also declare submodules of their own. The file is parsed recursively,
     * so there is no limit.
     */
    subModules?: Module[];
}
declare interface Server {
    /**
     * The ID of the server. The launcher saves mod configurations and selected servers
     * by ID. If the ID changes, all data related to the old ID will be wiped.
     */
    id: string;
    /**
     * The name of the server. This is what users see on the UI.
     */
    name: string;
    /**
     * A brief description of the server. Displayed on the UI to provide users more information.
     */
    description: string;
    /**
     * A URL to the server's icon. Will be displayed on the UI.
     */
    icon: string;
    /**
     * The version of the server configuration.
     */
    version: string;
    /**
     * The server's IP address.
     */
    address: string;
    /**
     * The version of minecraft that the server is running.
     */
    minecraftVersion: string;
    /**
     * Java options.
     * @since 1.2.0
     */
    javaOptions?: JavaOptions;
    /**
     * Server specific settings used for Discord Rich Presence.
     */
    discord?: {
        /**
         * Short ID for the server. Displayed on the second status line as Server: shortId.
         */
        shortId: string;
        /**
         * Tooltip for the largeImageKey.
         */
        largeImageText: string;
        /**
         * Name of the uploaded image for the large profile artwork.
         */
        largeImageKey: string;
    };
    /**
     * Only one server in the array should have the mainServer property enabled. This
     * will tell the launcher that this is the default server to select if either the
     * previously selected server is invalid, or there is no previously selected server.
     * If this field is not defined by any server (avoid this), the first server will
     * be selected as the default. If multiple servers have mainServer enabled, the first
     * one the launcher finds will be the effective value. Servers which are not the default
     * may omit this property rather than explicitly setting it to false.
     */
    mainServer?: boolean;
    /**
     * Whether or not the server can be autoconnected to. If false, the server will
     * not be autoconnected to even when the user has the autoconnect setting enabled.
     */
    autoconnect: boolean;
    /**
     * An array of module objects.
     */
    modules: Module[];
}
declare interface Distribution {
    version: string;
    /**
     * Global settings for Discord Rich Presence.
     */
    discord?: {
        /**
         * Client ID for the Application registered with Discord.
         */
        clientId: string;
        /**
         * Tootltip for the smallImageKey.
         */
        smallImageText: string;
        /**
         * Name of the uploaded image for the small profile artwork.
         */
        smallImageKey: string;
    };
    /**
     * A URL to a RSS feed. Used for loading news.
     */
    rss: string;
    /**
     * Array of server objects.
     */
    servers: Server[];
}
declare enum RestResponseStatus {
    /**
     * Status indicating the request was successful.
     */
    SUCCESS = 0,
    /**
     * Status indicating there was a problem with the response.
     * All status codes outside the 200 range will have an error status.
     */
    ERROR = 1
}
declare interface RestResponse<T> {
    /**
     * The response body.
     */
    data: T;
    /**
     * The response status.
     */
    responseStatus: RestResponseStatus;
    /**
     * If responseStatus is ERROR, the error body.
     */
    error?: RequestError;
}
declare interface MavenComponents {
    group: string;
    artifact: string;
    version: string;
    classifier?: string;
    extension: string;
}
declare class HeliosDistribution {
    readonly rawDistribution: Distribution;
    private mainServerIndex;
    readonly servers: HeliosServer[];
    constructor(rawDistribution: Distribution, commonDir: string, instanceDir: string);
    private resolveMainServerIndex;
    getMainServer(): HeliosServer;
    getServerById(id: string): HeliosServer | null;
}
declare class HeliosServer {
    readonly rawServer: Server;
    readonly modules: HeliosModule[];
    readonly hostname: string;
    readonly port: number;
    readonly effectiveJavaOptions: Required<JavaVersionProps>;
    constructor(rawServer: Server, commonDir: string, instanceDir: string);
    private parseAddress;
    private parseEffectiveJavaOptions;
    private defaultUndefinedJavaOptions;
}
declare class HeliosModule {
    readonly rawModule: Module;
    private readonly serverId;
    readonly subModules: HeliosModule[];
    private readonly mavenComponents;
    private readonly required;
    private readonly localPath;
    constructor(rawModule: Module, serverId: string, commonDir: string, instanceDir: string);
    private resolveMavenComponents;
    private resolveRequired;
    private resolveLocalPath;
    hasMavenComponents(): boolean;
    getMavenComponents(): Readonly<MavenComponents>;
    getRequired(): Readonly<Required<Required_D>>;
    getPath(): string;
    getMavenIdentifier(): string;
    getExtensionlessMavenIdentifier(): string;
    getVersionlessMavenIdentifier(): string;
    hasSubModules(): boolean;
}
declare interface DistributionAPI {
    setCommonDir(dir): void;
    getCommonDir(): string;
    setInstanceDir(dir): void;
    getInstanceDir(): string;
    isDevMode(): boolean;
    getDistribution(): Promise<HeliosDistribution>;
    refreshDistributionOrFallback(): Promise<HeliosDistribution>;
}
