const AdmZip = require('adm-zip');
const child_process = require('child_process');
const crypto = require('crypto');
const fs = require('fs-extra');
const { LoggerUtil } = require('helios-core');
const { getMojangOS, isLibraryCompatible, mcVersionAtLeast, HeliosServer, HeliosModule } = require('helios-core/common');
const { Type } = require('helios-distribution-types');
const os = require('os');
const path = require('path');
const parseMcLog = require('./xmlutil.cjs');
const moment = require('moment');

const config = require('./config.cjs');

const logger = LoggerUtil.getLogger('ProcessBuilder');

function test() {
    const packages = path.join(process.env.userData, '..', '..', 'Local', 'Packages');
    if (fs.existsSync(packages)) {
        console.log(packages);
        const packageName = fs.readdirSync(packages).filter(s => s != undefined).find(s => s.includes('MTWLauncher'));
        const packagePath = path.join(packages, packageName);
        if (fs.existsSync(packagePath)) {
            console.log(packagePath);
            const roamingPath = path.join(packagePath, 'LocalCache', 'Roaming');
            if (fs.existsSync(roamingPath)) {
                const launcherDir = path.join(roamingPath, 'mtw-launcher');
                console.log(launcherDir);
            }
        }
    }
}

class ProcessBuilder {
    /**
     * @param {HeliosServer} distroServer 
     * @param {import('helios-core/dist/dl/mojang/MojangTypes').VersionJsonBase} vanillaManifest 
     * @param {import('helios-core/dist/dl/mojang/MojangTypes').VersionJsonBase} modManifest 
     * @param {{
     *      accessToken: string;
     *      displayName: string;
     *      expiresAt: number;
     *      microsoft: MicrosoftAccount;
     *      type: 'microsoft' | 'mojang';
     *      username: string;
     *      uuid: string;
     *  }} authUser 
     * @param {string} launcherVersion 
     */
    constructor(distroServer, vanillaManifest, modManifest, authUser, launcherVersion) {
        this.gameDir = path.join(config.getInstanceDirectory(), distroServer.rawServer.id);
        this.commonDir = config.getCommonDirectory();
        this.server = distroServer;
        this.vanillaManifest = vanillaManifest;
        this.modManifest = modManifest;
        this.authUser = authUser;
        this.launcherVersion = launcherVersion;
        this.forgeModListFile = path.join(this.gameDir, 'forgeMods.list');
        this.fmlDir = path.join(this.gameDir, 'forgeModList.json');
        this.llDir = path.join(this.gameDir, 'liteloaderModList.json');
        this.libPath = path.join(this.commonDir, 'libraries');

        this.usingLiteLoader = false;
        this.usingFabricLoader = false;
        this.llPath = null;
        if (this.authUser.displayName === 'Test Account (Offline Account)') {
            this.authUser.displayName = 'Test';
        }
    }

    build(count) {
        fs.ensureDirSync(this.gameDir);
        const tempNativePath = path.join(os.tmpdir(), config.getTempNativeFolder(), crypto.pseudoRandomBytes(16).toString('hex'));
        process.throwDeprecation = true;
        this.setupLiteLoader();
        logger.info('Using liteloader:', this.usingLiteLoader);
        this.usingFabricLoader  = this.server.modules.some(mdl =>  mdl.rawModule.type === Type.Fabric);
        logger.info('Using fabric loader:', this.usingFabricLoader);
        const modObj = this.resolveModConfiguration(config.getModConfiguration(this.server.rawServer.id).mods, this.server.modules);

        // 1.13 이하 모드 목록
        // 패브릭은 1.14 이상만 지원
        if (!mcVersionAtLeast('1.13', this.server.rawServer.minecraftVersion)) {
            this.constructJSONModList('forge', modObj.fMods, true);
            if (this.usingLiteLoader) {
                this.constructJSONModList('liteloader', modObj.lMods, true);
            }
        }

        const uberModArr = modObj.fMods.concat(modObj.lMods);
        let args = this.constructJVMArguments(uberModArr, tempNativePath);

        if (mcVersionAtLeast('1.13', this.server.rawServer.minecraftVersion)) {
            args = args.concat(this.constructModList(modObj.fMods));
        }

        // apply mtw-launcher
        args.push('--mtw-launcher');
        args.push(process.env.appVersion);

        logger.info('Launch Arguments:', args);

        const child = child_process.spawn(config.getJavaExecutable(this.server.rawServer.id), args, {
            cwd: this.gameDir,
            detached: config.getLaunchDetached()
        });

        if (config.getLaunchDetached()) {
            child.unref();
        }

        child.stdout.setEncoding('utf-8');
        child.stderr.setEncoding('utf-8');

        child.stdout.on('data', (data) => {
            let json = parseMcLog(data);
            json.forEach(event => {
                let time = moment(event.timestamp).format('hh:mm:ss.SSS');
                let level = event.level;
                // let message = event.message.replaceAll('&nbsp;&nbsp;&nbsp;&nbsp;', '    ').replaceAll('<br>', '\n');
                let loggerSplit = event.logger.split('\.');
                let logger = loggerSplit[loggerSplit.length - 1];
                let msg = `[${time}] [${event.thread}/${level}] (${logger}) ${event.message.replaceAll(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, "")}`;
                if (console[level.toLowerCase()] != null) {
                    console[level.toLowerCase()](`\x1b[32m[Minecraft]\x1b[0m ${msg}`);
                } else {
                    console.log(`\x1b[32m[Minecraft]\x1b[0m ${msg}`);
                }
            });
        });
        child.stderr.on('data', (data) => {
            data.trim().split('\n').forEach(x => console.log(`\x1b[31m[Minecraft]\x1b[0m ${x}`));
        });
        child.on('close', (code, signal) => {
            logger.info('Exited with code', code);
            fs.remove(tempNativePath, (err) => {
                if (err) {
                    logger.warn('Error while deleting temp dir', err);
                } else {
                    logger.info('Temp dir deleted successfully.');
                }
            });
        });

        return child;
    }

    /**
     * @returns {string}
     */
    static getClasspathSeparator() {
        return process.platform === 'win32' ? ';' : ':';
    }

    /**
     * @param {object | boolean} modCfg 
     * @param {object} required 
     * @returns {boolean}
     */
    static isModEnabled(modCfg, required = null) {
        return modCfg != null ? ((typeof modCfg === 'boolean' && modCfg) || (typeof modCfg === 'object' && (typeof modCfg.value !== 'undefined' ? modCfg.value : true))) : required != null ? required.def : true;
    }

    setupLiteLoader() {
        for (let ll of this.server.modules) {
            if (ll.rawModule.type === Type.LiteLoader) {
                if (!ll.getRequired().value) {
                    const modCfg  = config.getModConfiguration(this.server.rawServer.id).mods;
                    if (ProcessBuilder.isModEnabled(modCfg[ll.getVersionlessMavenIdentifier()], ll.getRequired())) {
                        if (fs.existsSync(ll.getPath())) {
                            this.usingLiteLoader = true;
                            this.llPath = ll.getPath();
                        }
                    }
                } else {
                    if (fs.existsSync(ll.getPath())) {
                        this.usingLiteLoader = true;
                        this.llPath = ll.getPath();
                    }
                }
            }
        }
    }

    /**
     * @param {object} modCfg 
     * @param {object[]} mdls 
     * @returns {{fMods: object[], lMods: object[]}}
     */
    resolveModConfiguration(modCfg, mdls) {
        let fMods = [];
        let lMods = [];
        
        for (let mdl of mdls) {
            const type = mdl.rawModule.type;
            if (type === Type.ForgeMod || type === Type.LiteMod || type === Type.LiteLoader || type === Type.FabricMod) {
                const o = !mdl.getRequired().value;
                const e = ProcessBuilder.isModEnabled(modCfg[mdl.getVersionlessMavenIdentifier()], mdl.getRequired());
                if (!o || (o && e)) {
                    if (mdl.subModules.length > 0) {
                        const v = this.resolveModConfiguration(modCfg[mdl.getVersionlessMavenIdentifier()].mods, mdl.subModules);
                        fMods = fMods.concat(v.fMods);
                        lMods = lMods.concat(v.lMods);
                        if (type === Type.LiteLoader) {
                            continue;
                        }
                    }
                    if (type === Type.ForgeMod || type === Type.FabricMod) {
                        fMods.push(mdl);
                    } else {
                        lMods.push(mdl);
                    }
                }
            }
        }

        return {
            fMods,
            lMods
        }
    }

    _requiresAbsolute() {
        try {
            if (this._lteMinorVersion(9)) {
                return false;
            }
            const ver = this.modManifest.id.split('-')[2];
            const pts = ver.split('.');
            const min = [14, 23, 3, 2655];
            for (let i=0; i<pts.length; i++) {
                const parsed = Number.parseInt(pts[i]);
                if (parsed < min[i]) {
                    return false;
                } else if (parsed > min[i]) {
                    return true;
                }
            }
        } catch (err) { }
        
        return true;
    }

    /**
     * @param {'forge' | 'liteloader'} type 
     * @param {object[]} mods 
     * @param {boolean} save 
     */
    constructJSONModList(type, mods, save = false) {
        const modList = {
            repositoryRoot: ((type === 'forge' && this._requiresAbsolute()) ? 'absolute:' : '') + path.join(this.commonDir, 'modstore')
        };

        const ids = [];
        if (type === 'forge') {
            for (let mod of mods) {
                ids.push(mod.getExtensionlessMavenIdentifier());
            }
        } else {
            for (let mod of mods) {
                ids.push(mod.getMavenIdentifier());
            }
        }
        modList.modRef = ids;

        if (save) {
            const json = JSON.stringify(modList, null, 4);
            fs.writeFileSync(type === 'forge' ? this.fmlDir : this.llDir, json, 'utf-8');
        }

        return modList;
    }

    constructModList(mods) {
        const writeBuffer = mods.map(mod => {
            return this.usingFabricLoader ? mod.getPath() : mod.getExtensionlessMavenIdentifier();
        }).join('\n');

        if (writeBuffer) {
            fs.writeFileSync(this.forgeModListFile, writeBuffer, 'utf-8');
            return this.usingFabricLoader ? [
                '--fabric.addMods',
                `@${this.forgeModListFile}`
            ] : [
                '--fml.mavenRoots',
                path.join('..', '..', 'common', 'modstore'),
                '--fml.modLists',
                this.forgeModListFile
            ];
        } else {
            return [];
        }
    }

    /**
     * @param {object[]} mods 
     * @param {string} tempNativePath 
     * @returns {string[]}
     */
    constructJVMArguments(mods, tempNativePath) {
        if (mcVersionAtLeast('1.13', this.server.rawServer.minecraftVersion)) {
            return this._constructJVMArguments113(mods, tempNativePath);
        } else {
            return this._constructJVMArguments112(mods, tempNativePath);
        }
    }

    /**
     * @param {object[]} mods 
     * @param {string} tempNativePath 
     * @returns {string[]}
     */
    _constructJVMArguments112(mods, tempNativePath) {
        let args = [];

        args.push('-cp');
        args.push(this.classpathArg(mods, tempNativePath).join(ProcessBuilder.getClasspathSeparator()));

        if (process.platform === 'darwin') {
            args.push('-Xdock:name=MTWLauncher');
        }
        args.push('-Xmx' + config.getMaxRAM(this.server.rawServer.id));
        args.push('-Xms' + config.getMinRAM(this.server.rawServer.id));
        args = args.concat(config.getJVMOptions(this.server.rawServer.id));
        args.push('-Djava.library.path=' + tempNativePath);
        
        args.push(this.modManifest.mainClass);
        
        args = args.concat(this._resolveForgeArgs());

        return args;
    }

    /**
     * @param {object[]} mods 
     * @param {string} tempNativePath 
     * @returns {string[]}
     */
    _constructJVMArguments113(mods, tempNativePath) {
        const argDiscovery = /\${*(.*)}/;
        
        let args = this.vanillaManifest.arguments.jvm;
        
        if (this.modManifest.arguments.jvm != null) {
            for (const argStr of this.modManifest.arguments.jvm) {
                args.push(argStr
                    .replaceAll('${library_directory}', this.libPath)
                    .replaceAll('${classpath_separator}', ProcessBuilder.getClasspathSeparator())
                    .replaceAll('${version_name}', this.modManifest.id)
                );
            }
        }
        
        if (fs.existsSync(path.join(this.gameDir, '.agent', 'mod-loading-screen.jar'))) {
            if (!args.includes('-javaagent:.agent/mod-loading-screen.jar')) {
                args.push("-javaagent:.agent/mod-loading-screen.jar");
            }
        }

        if (this.vanillaManifest.logging) {
            let logging = this.vanillaManifest.logging.client;
            let assets = path.join(this.commonDir, 'assets');
            let log_configs = path.join(assets, 'log_configs');
            let loggingPath = path.join(log_configs, logging.file.id);
            if (fs.existsSync(loggingPath)) {
                args.push(logging.argument.replace('${path}', loggingPath));
            }
        }
        
        if (process.platform === 'darwin') {
            args.push('-Xdock:name=MTWLauncher');
        }
        args.push('-Xmx' + config.getMaxRAM(this.server.rawServer.id));
        args.push('-Xms' + config.getMinRAM(this.server.rawServer.id));
        args = args.concat(config.getJVMOptions(this.server.rawServer.id));

        args.push(this.modManifest.mainClass);

        args = args.concat(this.vanillaManifest.arguments.game);

        for (let i = 0; i < args.length; i++) {
            if (typeof args[i] === 'object' && args[i].rules != null) {
                let checksum = 0;
                for (let rule of args[i].rules) {
                    if (rule.os != null) {
                        if (rule.os.name === getMojangOS() && (rule.os.version == null || new RegExp(rule.os.version).test(os.release))) {
                            if (rule.action === 'allow') {
                                checksum++;
                            }
                        } else {
                            if (rule.action === 'disallow') {
                                checksum++;
                            }
                        }
                    } else if (rule.features != null) {
                        if (rule.features.has_custom_resolution != null && rule.features.has_custom_resolution === true) {
                            if (config.getFullscreen()) {
                                args[i].value = [
                                    '--fullscreen',
                                    'true'
                                ];
                            }
                            checksum++;
                        }
                    }
                }

                if (checksum === args[i].rules.length) {
                    if (typeof args[i].value === 'string') {
                        args[i] = args[i].value;
                    } else if (typeof args[i].value === 'object') {
                        args.splice(i, 1, ...args[i].value);
                    }

                    i--;
                } else {
                    args[i] = null;
                }

            } else if (typeof args[i] === 'string') {
                if (argDiscovery.test(args[i])) {
                    const identifier = args[i].match(argDiscovery)[1];
                    let val = null;
                    switch(identifier) {
                        case 'auth_player_name':
                            val = this.authUser.displayName.trim();
                            break
                        case 'version_name':
                            val = this.server.rawServer.id;
                            break
                        case 'game_directory':
                            val = this.gameDir;
                            break
                        case 'assets_root':
                            val = path.join(this.commonDir, 'assets');
                            break
                        case 'assets_index_name':
                            val = this.vanillaManifest.assets;
                            break
                        case 'auth_uuid':
                            val = this.authUser.uuid.trim();
                            break
                        case 'auth_access_token':
                            val = this.authUser.accessToken;
                            break
                        case 'user_type':
                            val = this.authUser.type === 'microsoft' ? 'msa' : 'mojang';
                            break
                        case 'version_type':
                            val = this.vanillaManifest.type;
                            break
                        case 'resolution_width':
                            val = config.getGameWidth();
                            break
                        case 'resolution_height':
                            val = config.getGameHeight();
                            break
                        case 'natives_directory':
                            val = args[i].replace(argDiscovery, tempNativePath);
                            break
                        case 'launcher_name':
                            val = args[i].replace(argDiscovery, 'MTW-Launcher');
                            break
                        case 'launcher_version':
                            val = args[i].replace(argDiscovery, this.launcherVersion);
                            break
                        case 'classpath':
                            val = this.classpathArg(mods, tempNativePath).join(ProcessBuilder.getClasspathSeparator());
                            break
                    }
                    if (val != null) {
                        args[i] = val;
                    }
                }
            }
        }

        this._processAutoConnectArg(args);

        args = args.concat(this.modManifest.arguments.game);

        args = args.filter(arg => {
            return arg != null;
        });

        return args;
    }

    /**
     * @returns {string[]}
     */
    _resolveForgeArgs() {
        const mcArgs = this.modManifest.minecraftArguments.split(' ');
        const argDiscovery = /\${*(.*)}/;

        for (let i = 0; i < mcArgs.length; ++i) {
            if (argDiscovery.test(mcArgs[i])) {
                const identifier =  mcArgs[i].match(argDiscovery)[1];
                let val = null;
                switch(identifier) {
                    case 'auth_player_name':
                        val = this.authUser.displayName.trim();
                        break;
                    case 'version_name':
                        val = this.server.rawServer.id
                        break
                    case 'game_directory':
                        val = this.gameDir
                        break
                    case 'assets_root':
                        val = path.join(this.commonDir, 'assets')
                        break
                    case 'assets_index_name':
                        val = this.vanillaManifest.assets
                        break
                    case 'auth_uuid':
                        val = this.authUser.uuid.trim()
                        break
                    case 'auth_access_token':
                        val = this.authUser.accessToken
                        break
                    case 'user_type':
                        val = this.authUser.type === 'microsoft' ? 'msa' : 'mojang'
                        break
                    case 'user_properties': // 1.8.9 and below.
                        val = '{}'
                        break
                    case 'version_type':
                        val = this.vanillaManifest.type
                        break
                }
                if (val != null) {
                    mcArgs[i] = val;
                }
            }
        }

        this._processAutoConnectArg(mcArgs);

        if (config.getFullscreen()) {
            mcArgs.push('--fullscreen');
            mcArgs.push(true);
        } else {
            mcArgs.push('--width');
            mcArgs.push(config.getGameWidth());
            mcArgs.push('--height');
            mcArgs.push(config.getGameHeight());
        }

        mcArgs.push('--modListFile');
        if (this._lteMinorVersion(9)) {
            mcArgs.push(path.basename(this.fmlDir));
        } else {
            mcArgs.push('absolute:' + this.fmlDir);
        }

        if (this.usingLiteLoader) {
            mcArgs.push('--modRepo');
            mcArgs.push(this.llDir);

            mcArgs.unshift('com.mumfrey.liteloader.launch.LiteLoaderTweaker');
            mcArgs.unshift('--tweakClass');
        }

        return mcArgs;
    }

    _lteMinorVersion(version) {
        return Number(this.modManifest.id.split('-')[0].split('.')[1]) <= Number(version);
    }

    _processAutoConnectArg(args) {
        if (config.getAutoConnect() && this.server.rawServer.autoconnect) {
            if (mcVersionAtLeast('1.20', this.server.rawServer.minecraftVersion))  {
                args.push('--quickPlayMultiplayer');
                args.push(`${this.server.hostname}:${this.server.port}`);
            } else {
                args.push('--server');
                args.push(this.server.hostname);
                args.path('--port');
                args.push(this.server.port);
            }
        }
    }

    /**
     * @param {object[]} mods 
     * @param {string} tempNativePath 
     * @returns {string[]}
     */
    classpathArg(mods, tempNativePath) {
        let cpArgs = [];

        if (!mcVersionAtLeast('1.17', this.server.rawServer.minecraftVersion) || this.usingFabricLoader) {
            const version = this.vanillaManifest.id;
            cpArgs.push(path.join(this.commonDir, 'versions', version, version + '.jar'));
        }

        if (this.usingLiteLoader) {
            cpArgs.push(this.llPath);
        }

        const mojangLibs = this._resolveMojangLibraries(tempNativePath);

        const servLibs = this._resolveServerLibraries(mods);

        const finalLibs = {...mojangLibs, ...servLibs};
        cpArgs = cpArgs.concat([...new Set(Object.values(finalLibs))]);

        this._processClassPathList(cpArgs);

        return cpArgs;
    }

    /**
     * @param {string[]} list 
     */
    _processClassPathList(list) {
        const ext = '.jar';
        const extLen = ext.length;
        for (let i = 0; i < list.length; i++) {
            const extIndex = list[i].indexOf(ext);
            if (extIndex > -1 && extIndex !== list[i].length - extLen) {
                list[i] = list[i].substring(0, extIndex + extLen);
            }
        }
    }

    /**
     * 
     * @param {string} tempNativePath 
     * @returns {{[id: string]: string}}
     */
    _resolveMojangLibraries(tempNativePath) {
        const nativesRegex = /.+:natives-([^-]+)(?:-(.+))?/;
        const libs = {};

        const libArr = this.vanillaManifest.libraries;
        fs.ensureDirSync(tempNativePath);
        for (let i = 0; i < libArr.length; i++) {
            const lib = libArr[i];
            if (isLibraryCompatible(lib.rules, lib.natives)) {
                if (lib.natives != null) {
                    const exclusionArr = lib.extract != null ? lib.extract.exclude : ['META-INF/'];
                    const artifact = lib.downloads.classifiers[lib.natives[getMojangOS()].replace('${arch}', process.arch.replace('x', ''))];

                    const to = path.join(this.libPath, artifact.path);

                    let zip = new AdmZip(to);
                    let zipEntries = zip.getEntries();

                    for (let i = 0; i < zipEntries.length; i++) {
                        const fileName = zipEntries[i].entryName;

                        let shouldExclude = false;

                        exclusionArr.forEach((exclusion) => {
                            if (fileName.indexOf(exclusion) > -1)  {
                                shouldExclude = true;
                            }
                        });

                        if (!shouldExclude) {
                            fs.writeFile(path.join(tempNativePath, fileName), zipEntries[i].getData(), (err) => {
                                if (err) {
                                    logger.error('Error while extracting native library:', err.stack);
                                }
                            });
                        }
                    }
                }
                else if (lib.name.includes('natives-')) {
                    const regexTest = nativesRegex.exec(lib.name);
                    const arch = regexTest[2] ?? 'x64';

                    if (arch != process.arch) {
                        continue;
                    }

                    const exclusionArr = lib.extract != null ? lib.extract.exclude : ['META-INF/', '.git', '.sha1'];
                    const artifact = lib.downloads.artifact;

                    const to = path.join(this.libPath, artifact.path);

                    let zip = new AdmZip(to);
                    let zipEntries = zip.getEntries();

                    for (let i = 0; i < zipEntries.length; i++) {
                        if (zipEntries[i].isDirectory) {
                            continue;
                        }

                        const fileName = zipEntries[i].entryName;

                        let shouldExclude = false;

                        exclusionArr.forEach((exclusion) => {
                            if (fileName.indexOf(exclusion) > -1) {
                                shouldExclude = true;
                            }
                        });

                        const extractName = fileName.includes('/') ? fileName.substring(fileName.lastIndexOf('/')) : fileName;

                        if (!shouldExclude) {
                            fs.writeFile(path.join(tempNativePath, extractName), zipEntries[i].getData(), (err) => {
                                if (err) {
                                    logger.error('Error while extracting native library:', err);
                                }
                            })
                        }
                    }
                }
                else {
                    const dlInfo = lib.downloads;
                    const artifact = dlInfo.artifact;
                    const to = path.join(this.libPath, artifact.path);
                    const versionIndependentId = lib.name.substring(0, lib.name.lastIndexOf(':'));
                    libs[versionIndependentId] = to;
                }
            }
        }

        return libs;
    }

    /**
     * @param {object[]} mods 
     * @returns {{[id: string]: string}}
     */
    _resolveServerLibraries(mods) {
        const mdls = this.server.modules;
        let libs = {};

        for (let mdl of mdls) {
            const type = mdl.rawModule.type;
            if (type === Type.ForgeHosted || type === Type.Fabric || type === Type.Library) {
                libs[mdl.getVersionlessMavenIdentifier()] = mdl.getPath();
                if (mdl.subModules.length > 0) {
                    const res = this._resolveModuleLibraries(mdl);
                    if (res.length > 0) {
                        libs = {...libs, ...res};
                    }
                }
            }
        }

        for (let i = 0; i < mods.length; i++) {
            if (mods.sub_modules != null) {
                const res = this._resolveModuleLibraries(mods[i]);
                if (res.length > 0) {
                    libs = {...libs, ...res};
                }
            }
        }

        return libs;
    }

    /**
     * @param {HeliosModule} mdl 
     * @returns {string[]}
     */
    _resolveModuleLibraries(mdl) {
        if (!mdl.subModules.length > 0) return [];
        let libs = [];
        for (let sm of mdl.subModules) {
            if (sm.rawModule.type === Type.Library) {
                if (sm.rawModule.classpath ?? true) {
                    libs.push(sm.getPath());
                }
            }

            if (mdl.subModules.length > 0) {
                const res = this._resolveModuleLibraries(sm);
                if (res.length > 0) {
                    libs = libs.concat(res);
                }
            }
        }
        return libs;
    }
}

module.exports = ProcessBuilder;