const fs = require('fs-extra');
const { LoggerUtil } = require('helios-core');
const os = require('os');
const path = require('path');

const logger = LoggerUtil.getLogger('Settings');
const sysRoot = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Application Support' : process.env.HOME);
const dataPath = path.join(sysRoot, '.mtwlauncher');
const launcherDir = process.env.userData;

/**
 * 런처 디렉터리의 절대 경로를 검색합니다.
 * 
 * @returns {string} 런처 디렉터리의 절대 경로
 */
exports.getLauncherDirectory = function() {
    return launcherDir
}

/**
 * 런처의 데이터 디렉터리를 가져옵니다.
 * 게임 실행과 관련된 모든 파일(공통, 인스턴스, Java 등)이 설치되는 곳입니다.
 * 
 * @returns {string} 런처의 데이터 디렉터리의 절대 경로
 */
exports.getDataDirectory = function(def = false){
    return !def ? config.settings.launcher.dataDirectory : DEFAULT_SETTINGS.settings.launcher.dataDirectory;
}

/**
 * 새 데이터 디렉터리를 설정합니다.
 * 
 * @param {string} dataDirectory 새 데이터 디렉터리
 */
exports.setDataDirectory = function(dataDirectory){
    config.settings.launcher.dataDirectory = dataDirectory;
}

const configPath = path.join(exports.getLauncherDirectory(), 'config.json')
const configPathLEGACY = path.join(dataPath, 'config.json')
const firstLaunch = !fs.existsSync(configPath) && !fs.existsSync(configPathLEGACY)

exports.getAbsoluteMinRAM = function(ram) {
    if  (ram?.minimum != null) {
        return ram.minimum / 1024;
    } else {
        // Legacy behavior
        const mem = os.totalmem();
        return mem >= (6 * 1073741824) ? 3 : 2;
    }
}

exports.getAbsoluteMaxRAM = function(ram) {
    const mem = os.totalmem();
    const gT16 = mem - (16 * 1073741824);
    return Math.floor((mem - (gT16 > 0 ? (Number.parseInt(gT16 / 8) + (16 * 1073741824) / 4) : mem / 4)) / 1073741824);
}

function resolveSelectedRAM(ram) {
    if (ram?.recommanded != null) {
        return `${ram.recommanded}M`;
    } else {
        // Legacy behavior
        const mem = os.totalmem()
        return mem >= (8 * 1073741824) ? '4G' : (mem >= (6 * 1073741824) ? '3G' : '2G');
    }
}

/**
 * 세 가지 유형의 값입니다:
 * Static = 명시적으로 선언됨.
 * Dynamic = 비공개 함수에 의해 계산됩니다.
 * Resolved = 외부에서 확인되며 기본값은 null입니다.
 */
const DEFAULT_CONFIG = {
    settings: {
        game: {
            resWidth: 1280,
            resHeight: 720,
            fullscreen: false,
            autoConnect: true,
            launchDetached: true
        },
        launcher: {
            allowPrerelease: false,
            launcherOpen: false,
            gameLogOpen: false,
            trayMove: false,
            dataDirectory: dataPath,
            language: 'en',
            titleBarColor: '#ffffff'
        }
    },
    clientToken: null,
    selectedServer: null, // Resolved
    selectedAccount: null,
    authenticationDatabase: {},
    modConfigurations: [],
    javaConfig: {},
    notiMic: true,
}

let config = null;

// 지속성 유틸리티 기능

/**
 * 현재 구성을 파일에 저장합니다.
 */
exports.save = function(){
    fs.writeFileSync(configPath, JSON.stringify(config, null, 4), 'UTF-8')
}

/**
 * 구성을 메모리에 로드합니다. 
 * 구성 파일이 있는 경우 해당 파일을 읽고 저장합니다. 
 * 그렇지 않으면 기본 구성이 생성됩니다. 
 * "resolved" 값은 기본값이 null 이므로 외부에서 할당해야 한다는 점에 유의하세요.
 */
exports.load = function(internet){
    let doLoad = true

    if(!fs.existsSync(configPath)){
        // Create all parent directories.
        fs.ensureDirSync(path.join(configPath, '..'))
        if(fs.existsSync(configPathLEGACY)){
            fs.moveSync(configPathLEGACY, configPath)
        } else {
            doLoad = false
            config = DEFAULT_CONFIG
            if (internet) exports.save()
        }
    }
    if(doLoad){
        let doValidate = false
        try {
            config = JSON.parse(fs.readFileSync(configPath, 'UTF-8'))
            doValidate = true
        } catch (err){
            logger.error(err)
            logger.info('Configuration file contains malformed JSON or is corrupt.')
            logger.info('Generating a new configuration file.')
            fs.ensureDirSync(path.join(configPath, '..'))
            config = DEFAULT_CONFIG
            if (internet) exports.save()
        }
        if(doValidate){
            config = validateKeySet(DEFAULT_CONFIG, config)
            if (internet) exports.save()
        }
    }
    logger.info('Successfully Loaded')
}

/**
 * @returns {boolean} 로드되었는지 여부
 */
exports.isLoaded = function(){
    return config != null
}

/**
 * 대상 객체에 소스 객체에 있는 모든 필드가 있는지 확인합니다. 
 * 그렇지 않으면 기본값을 지정합니다.
 * 
 * @param {Object} srcObj 참조할 소스 객체
 * @param {Object} destObj 대상 객체
 * @returns {Object} 유효성이 검사된 대상 개체
 */
function validateKeySet(srcObj, destObj){
    if(srcObj == null){
        srcObj = {}
    }
    const validationBlacklist = ['authenticationDatabase', 'javaConfig']
    const keys = Object.keys(srcObj)
    for(let i=0; i<keys.length; i++){
        if(typeof destObj[keys[i]] === 'undefined'){
            destObj[keys[i]] = srcObj[keys[i]]
        } else if(typeof srcObj[keys[i]] === 'object' && srcObj[keys[i]] != null && !(srcObj[keys[i]] instanceof Array) && validationBlacklist.indexOf(keys[i]) === -1){
            destObj[keys[i]] = validateKeySet(srcObj[keys[i]], destObj[keys[i]])
        }
    }
    return destObj
}

/**
 * 유효성이 검사된 대상 개체사용자가 애플리케이션을 처음 실행했는지 확인합니다. 
 * 이는 데이터 경로의 존재 여부에 따라 결정됩니다.
 * 
 * @returns {boolean} 첫 번째 실행인 경우 true고, 그렇지 않으면 false
 */
exports.isFirstLaunch = function(){
    return firstLaunch
}

/**
 * 게임 실행을 위해 네이티브 종속성을 추출하고 저장하는 데 
 * 사용할 OS 임시 디렉터리의 폴더 이름을 반환합니다.
 * 
 * @returns {string} 폴더의 이름
 */
exports.getTempNativeFolder = function(){
    return 'WCNatives'
}

// 시스템 설정 (UI에서 구성할 수 없음)

exports.getLanguage = function()  {
    return config.settings.launcher.language ?? 'en';
}

exports.setLanguage = function(lang) {
    config.settings.launcher.language = lang;
}

exports.getTitleBarColor = function() {
    return config.settings.launcher.titleBarColor ?? '#ffffff';
}

exports.setTitleBarColor = function(color) {
    config.settings.launcher.titleBarColor = color;
}

/**
 * 공유 게임 파일(assets, libraries 등)의 
 * 공통 디렉터리를 검색합니다.
 * 
 * @returns {string} 런처의 공통 디렉토리
 */
exports.getCommonDirectory = function(){
    return path.join(exports.getDataDirectory(), 'common')
}

/**
 * 서버별 게임 디렉터리에 대한 인스턴스 디렉터리를 검색합니다.
 * 
 * @returns {string} 런처의 인스턴스 디렉터리
 */
exports.getInstanceDirectory = function(){
    return path.join(exports.getDataDirectory(), 'instances')
}

/**
 * 런처의 클라이언트 토큰을 가져옵니다. 
 * 기본 클라이언트 토큰은 없습니다.
 * 
 * @returns {string} 런처의 클라이언트 토큰
 */
exports.getClientToken = function(){
    return config.clientToken
}

/**
 * 런처의 클라이언트 토큰을 설정합니다.
 * 
 * @param {string} clientToken 런처의 새로운 클라이언트 토큰
 */
exports.setClientToken = function(clientToken){
    config.clientToken = clientToken
}

/**
 * 선택한 서버팩의 ID를 검색합니다.
 * 
 * @param {boolean} def (선택 사항) true면 기본값이 반환
 * @returns {string} 선택한 서버팩의 ID
 */
exports.getSelectedServer = function(def = false){
    return !def ? config.selectedServer : DEFAULT_CONFIG.clientToken
}

/**
 * 선택한 ServerPack의 ID를 설정합니다.
 * 
 * @param {string} serverID 새로운 선택된 ServerPack의 ID.
 */
exports.setSelectedServer = function(serverID){
    config.selectedServer = serverID
}

/**
 * 현재 런처에서 인증 한 각 계정의 배열을 가져옵니다.
 * 
 * @returns {Array.<Object>} 저장된 인증 계정의 배열
 */
exports.getAuthAccounts = function(){
    return config.authenticationDatabase
}

/**
 * 주어진 UUID로 인증 된 계정을 반환합니다.
 * 값은 무일하게 될 수 있습니다.
 * 
 * @param {string} uuid 인증 계정의 UUID.
 * @returns {Object} 주어진 UUID와의 인증 계정.
 */
exports.getAuthAccount = function(uuid){
    return config.authenticationDatabase[uuid]
}

/**
 * 인증된 모장 계정의 액세스 토큰을 업데이트합니다.
 * 
 * @param {string} uuid 인증 계정의 UUID.
 * @param {string} accessToken 새로운 액세스 토큰.
 * 
 * @returns {Object} 이 조치에 의해 생성 된 인증 된 계정 개체.
 */
exports.updateMojangAuthAccount = function(uuid, accessToken){
    config.authenticationDatabase[uuid].accessToken = accessToken
    config.authenticationDatabase[uuid].type = 'mojang' // For gradual conversion.
    return config.authenticationDatabase[uuid]
}

/**
 * 저장할 데이터베이스에 인증 된 Mojang 계정을 추가합니다.
 * 
 * @param {string} uuid 인증 계정의 UUID.
 * @param {string} accessToken 인증 된 계정의 액세스.
 * @param {string} username 인증 된 계정의 사용자 이름 (일반적으로 이메일).
 * @param {string} displayName 인증 계정의 게임 이름.
 * 
 * @returns {Object} 이 조치에 의해 생성 된 인증 된 계정 개체.
 */
exports.addMojangAuthAccount = function(uuid, accessToken, username, displayName){
    config.selectedAccount = uuid
    config.authenticationDatabase[uuid] = {
        type: 'mojang',
        accessToken,
        username: username.trim(),
        uuid: uuid.trim(),
        displayName: displayName.trim()
    }
    return config.authenticationDatabase[uuid]
}

/**
 * 인증 된 Microsoft 계정의 토큰을 업데이트합니다.
 * 
 * @param {string} uuid 인증 계정의 UUID.
 * @param {string} accessToken 새로운 Access Token.
 * @param {string} msAccessToken 새로운 Microsoft Access Token
 * @param {string} msRefreshToken 새로운 Microsoft Refresh Token
 * @param {date} msExpires Microsoft Access Token이 만료되는 날짜
 * @param {date} mcExpires Mojang Access Token이 만료되는 날짜
 * 
 * @returns {Object} 이 조치에 의해 생성 된 인증 된 계정 개체.
 */
exports.updateMicrosoftAuthAccount = function(uuid, accessToken, msAccessToken, msRefreshToken, msExpires, mcExpires) {
    config.authenticationDatabase[uuid].accessToken = accessToken
    config.authenticationDatabase[uuid].expiresAt = mcExpires
    config.authenticationDatabase[uuid].microsoft.access_token = msAccessToken
    config.authenticationDatabase[uuid].microsoft.refresh_token = msRefreshToken
    config.authenticationDatabase[uuid].microsoft.expires_at = msExpires
    return config.authenticationDatabase[uuid]
}

/**
 * 저장할 데이터베이스에 인증 된 Microsoft 계정을 추가합니다.
 * 
 * @param {string} uuid 인증 계정의 UUID.
 * @param {string} accessToken 인증 된 계정의 액세스.
 * @param {string} name 인증 계정의 게임 이름.
 * @param {date} mcExpires Mojang Access Token이 만료되는 날짜
 * @param {string} msAccessToken Microsoft Access Token
 * @param {string} msRefreshToken Microsoft Refresh Token
 * @param {date} msExpires Microsoft 액세스 토큰이 만료되는 날짜
 * 
 * @returns {Object} 이 조치에 의해 생성 된 인증 된 계정 개체.
 */
exports.addMicrosoftAuthAccount = function(uuid, accessToken, name, mcExpires, msAccessToken, msRefreshToken, msExpires) {
    config.selectedAccount = uuid
    config.authenticationDatabase[uuid] = {
        type: 'microsoft',
        accessToken,
        username: name.trim(),
        uuid: uuid.trim(),
        displayName: name.trim(),
        expiresAt: mcExpires,
        microsoft: {
            access_token: msAccessToken,
            refresh_token: msRefreshToken,
            expires_at: msExpires
        }
    }
    return config.authenticationDatabase[uuid]
}

/**
 * 데이터베이스에서 인증 된 계정을 제거합니다.
 * 계정이 선택된 계정 인 경우 새 계정이 선택됩니다.
 * 계정이 없으면 선택한 계정은 NULL입니다.
 * 
 * @param {string} uuid 인증 계정의 UUID.
 * 
 * @returns {boolean} 계정이 제거 된 경우 TRUE, 존재하지 않으면 False입니다.
 */
exports.removeAuthAccount = function(uuid){
    if(config.authenticationDatabase[uuid] != null){
        delete config.authenticationDatabase[uuid]
        if(config.selectedAccount === uuid){
            const keys = Object.keys(config.authenticationDatabase)
            if(keys.length > 0){
                config.selectedAccount = keys[0]
            } else {
                config.selectedAccount = null
                config.clientToken = null
            }
        }
        return true
    }
    return false
}

/**
 * 현재 선택된 인증 계정을 받으십시오.
 * 
 * @returns {Object} 선택한 인증 계정.
 */
exports.getSelectedAccount = function(){
    return config.authenticationDatabase[config.selectedAccount]
}

/**
 * 선택한 인증 계정을 설정합니다.
 * 
 * @param {string} uuid 선택한 계정으로 설정 될 계정의 UUID.
 * 
 * @returns {Object} 선택한 인증 계정.
 */
exports.setSelectedAccount = function(uuid){
    const authAcc = config.authenticationDatabase[uuid]
    if(authAcc != null) {
        config.selectedAccount = uuid
    }
    return authAcc
}

/**
 * 현재 저장된 각 모드 구성의 배열을 가져옵니다.
 * 
 * @returns {Array.<Object>} 저장된 모드 구성의 배열.
 */
exports.getModConfigurations = function(){
    return config.modConfigurations
}

/**
 * 저장된 모드 구성의 배열을 설정합니다.
 * 
 * @param {Array.<Object>} configurations 모드 구성 배열.
 */
exports.setModConfigurations = function(configurations){
    config.modConfigurations = configurations
}

/**
 * 특정 서버의 모드 구성을 가져옵니다.
 * 
 * @param {string} serverid 서버의 ID.
 * @returns {Object} 주어진 서버의 모드 구성.
 */
exports.getModConfiguration = function(serverid){
    const cfgs = config.modConfigurations
    for(let i=0; i<cfgs.length; i++){
        if(cfgs[i].id === serverid){
            return cfgs[i]
        }
    }
    return null
}

/**
 * 특정 서버의 모드 구성을 설정합니다.
 * 이것은 기존 값을 능가합니다.
 * 
 * @param {string} serverid 주어진 모드 구성에 대한 서버의 ID.
 * @param {Object} configuration 주어진 서버의 모드 구성.
 */
exports.setModConfiguration = function(serverid, configuration){
    const cfgs = config.modConfigurations
    for(let i=0; i<cfgs.length; i++){
        if(cfgs[i].id === serverid){
            cfgs[i] = configuration
            return
        }
    }
    cfgs.push(configuration)
}

// 사용자 구성 가능한 설정

// 자바 설정

function defaultJavaConfig(effectiveJavaOptions, ram) {
    if(effectiveJavaOptions.suggestedMajor > 8) {
        return defaultJavaConfig17(ram)
    } else {
        return defaultJavaConfig8(ram)
    }
}

function defaultJavaConfig8(ram) {
    return {
        minRAM: resolveSelectedRAM(ram),
        maxRAM: resolveSelectedRAM(ram),
        executable: null,
        jvmOptions: [
            '-XX:+UseConcMarkSweepGC',
            '-XX:+CMSIncrementalMode',
            '-XX:-UseAdaptiveSizePolicy',
            '-Xmn128M'
        ],
    }
}

function defaultJavaConfig17(ram) {
    return {
        minRAM: resolveSelectedRAM(ram),
        maxRAM: resolveSelectedRAM(ram),
        executable: null,
        jvmOptions: [
            '-XX:+UnlockExperimentalVMOptions',
            '-XX:+UseG1GC',
            '-XX:G1NewSizePercent=20',
            '-XX:G1ReservePercent=20',
            '-XX:MaxGCPauseMillis=50',
            '-XX:G1HeapRegionSize=32M'
        ],
    }
}

/**
 * 주어진 서버에 대해 Java 구성 속성이 설정되어 있는지 확인합니다.
 * 
 * @param {string} serverid 서버 ID.
 * @param {*} mcVersion 서버의 마인크래프트 버전.
 */
exports.ensureJavaConfig = function(serverid, effectiveJavaOptions, ram) {
    if(!Object.prototype.hasOwnProperty.call(config.javaConfig, serverid)) {
        config.javaConfig[serverid] = defaultJavaConfig(effectiveJavaOptions, ram)
    }
}

/**
 * JVM 초기화를 위한 최소 메모리 양을 검색합니다. 
 * 이 값에는 메모리 단위가 포함됩니다. 
 * 예를 들어 '5G' = 5기가바이트, '1024M' = 1024메가바이트 등입니다.
 * 
 * @param {string} serverid 서버 ID.
 * @returns {string} JVM 초기화를위한 최소 메모리 양.
 */
exports.getMinRAM = function(serverid){
    return config.javaConfig[serverid].minRAM
}

/**
 * JVM 초기화를 위한 최소 메모리 양을 설정합니다. 
 * 이 값에는 메모리 단위가 포함되어야 합니다. 
 * 예를 들어 '5G' = 5기가바이트, '1024M' = 1024메가바이트 등입니다.
 * 
 * @param {string} serverid 서버 ID.
 * @param {string} minRAM JVM 초기화를위한 새로운 최소 메모리 양.
 */
exports.setMinRAM = function(serverid, minRAM){
    config.javaConfig[serverid].minRAM = minRAM
}

/**
 * JVM 초기화를 위한 최대 메모리 양을 검색합니다. 
 * 이 값에는 메모리 단위가 포함됩니다. 
 * 예를 들어 '5G' = 5기가바이트, '1024M' = 1024메가바이트 등입니다.
 * 
 * @param {string} serverid 서버 ID.
 * @returns {string} JVM 초기화를위한 최대 메모리 양.
 */
exports.getMaxRAM = function(serverid){
    return config.javaConfig[serverid].maxRAM
}

/**
 * JVM 초기화를 위한 최대 메모리 양을 설정합니다. 
 * 이 값에는 메모리 단위가 포함되어야 합니다. 
 * 예를 들어 '5G' = 5기가바이트, '1024M' = 1024메가바이트 등입니다.
 * 
 * @param {string} serverid 서버 ID.
 * @param {string} maxRAM JVM 초기화를위한 새로운 최대 메모리 양.
 */
exports.setMaxRAM = function(serverid, maxRAM){
    config.javaConfig[serverid].maxRAM = maxRAM
}

/**
 * Java 실행 파일의 경로를 검색합니다.
 * 
 * 이것은 해결 된 구성 값이며 외부로 할당 될 때까지 기본값으로 널로 표시됩니다.
 * 
 * @param {string} serverid 서버 ID.
 * @returns {string} Java 실행 파일의 경로.
 */
exports.getJavaExecutable = function(serverid){
    return config.javaConfig[serverid].executable
}

/**
 * Java 실행 파일의 경로를 설정합니다.
 * 
 * @param {string} serverid 서버 ID.
 * @param {string} executable Java 실행 파일의 새로운 경로.
 */
exports.setJavaExecutable = function(serverid, executable){
    config.javaConfig[serverid].executable = executable
}

/**
 * JVM 초기화에 대한 추가 인수를 검색합니다.
 * 메모리 할당과 같은 필수 인수는 동적으로 해결 되며이 값에는 포함되지 않습니다.
 * 
 * @param {string} serverid 서버 ID.
 * @returns {Array.<string>} JVM 초기화에 대한 추가 인수 배열.
 */
exports.getJVMOptions = function(serverid){
    return config.javaConfig[serverid].jvmOptions
}

/**
 * JVM 초기화에 대한 추가 인수를 설정합니다.
 * 메모리 할당과 같은 필수 인수는 동적으로 해결 되며이 값에 포함되어서는 안됩니다.
 * 
 * @param {string} serverid 서버 ID.
 * @param {Array.<string>} jvmOptions JVM 초기화에 대한 새로운 추가 인수 배열.
 */
exports.setJVMOptions = function(serverid, jvmOptions){
    config.javaConfig[serverid].jvmOptions = jvmOptions
}

// 게임 설정

/**
 * 게임 창의 너비를 검색합니다.
 * 
 * @param {boolean} def (선택 항목) true면 기본값이 반환.
 * @returns {number} 게임 창의 너비.
 */
exports.getGameWidth = function(def = false){
    return !def ? config.settings.game.resWidth : DEFAULT_CONFIG.settings.game.resWidth
}

/**
 * 게임 창의 너비를 설정합니다.
 * 
 * @param {number} resWidth 게임 창의 새로운 너비.
 */
exports.setGameWidth = function(resWidth){
    config.settings.game.resWidth = Number.parseInt(resWidth)
}

/**
 * 잠재적 인 새로운 폭 값을 검증합니다.
 * 
 * @param {number} resWidth 검증 할 폭 값.
 * @returns {boolean} 값이 유효한지 여부.
 */
exports.validateGameWidth = function(resWidth){
    const nVal = Number.parseInt(resWidth)
    return Number.isInteger(nVal) && nVal >= 854
}

/**
 * 게임 창의 높이를 검색합니다.
 * 
 * @param {boolean} def (선택 항목) true면 기본값이 반환.
 * @returns {number} 게임 창의 높이.
 */
exports.getGameHeight = function(def = false){
    return !def ? config.settings.game.resHeight : DEFAULT_CONFIG.settings.game.resHeight
}

/**
 * 게임 창의 높이를 설정합니다.
 * 
 * @param {number} resHeight 게임 창의 새로운 높이.
 */
exports.setGameHeight = function(resHeight){
    config.settings.game.resHeight = Number.parseInt(resHeight)
}

/**
 * 잠재적 인 새로운 높이 값을 확인합니다.
 * 
 * @param {number} resHeight 검증 할 높이 값.
 * @returns {boolean} 값이 유효한지 여부.
 */
exports.validateGameHeight = function(resHeight){
    const nVal = Number.parseInt(resHeight)
    return Number.isInteger(nVal) && nVal >= 480
}

/**
 * 게임이 전체 화면 모드로 시작되어야하는지 확인합니다.
 * 
 * @param {boolean} def (선택 항목) true면 기본값이 반환.
 * @returns {boolean} 게임이 전체 화면 모드로 시작 될지 여부.
 */
exports.getFullscreen = function(def = false){
    return !def ? config.settings.game.fullscreen : DEFAULT_CONFIG.settings.game.fullscreen
}

/**
 * 게임을 전체 화면 모드로 시작 해야하는지의 상태를 변경합니다.
 * 
 * @param {boolean} fullscreen 게임이 전체 화면 모드로 시작되어야하는지 여부.
 */
exports.setFullscreen = function(fullscreen){
    config.settings.game.fullscreen = fullscreen
}


/**
 * 게임이 서버에 자동으로 연결되어야하는지 확인합니다.
 * 
 * @param {boolean} def (선택 항목) true면 기본값이 반환.
 * @returns {boolean} 게임이 서버에 자동으로 연결되어야하는지 여부.
 */
exports.getAutoConnect = function(def = false){
    return !def ? config.settings.game.autoConnect : DEFAULT_CONFIG.settings.game.autoConnect
}

/**
 * 게임이 서버에 자동으로 연결되어야하는지 여부의 상태를 변경합니다.
 * 
 * @param {boolean} autoConnect 게임이 서버에 자동으로 연결되어야하는지 여부.
 */
exports.setAutoConnect = function(autoConnect){
    config.settings.game.autoConnect = autoConnect
}

/**
 * 게임이 분리 된 프로세스로 시작되어야하는지 확인합니다.
 * 
 * @param {boolean} def (선택 항목) true면 기본값이 반환.
 * @returns {boolean} 게임이 분리 된 프로세스로 출시 될지 여부.
 */
exports.getLaunchDetached = function(def = false){
    return !def ? config.settings.game.launchDetached : DEFAULT_CONFIG.settings.game.launchDetached
}

/**
 * 게임이 분리 된 프로세스로 시작되어야하는지 여부의 상태를 변경합니다.
 * 
 * @param {boolean} launchDetached 게임이 분리 된 프로세스로 출시되어야하는지 여부.
 */
exports.setLaunchDetached = function(launchDetached){
    config.settings.game.launchDetached = launchDetached
}

// 런처 설정

/**
 * 런처가 Prerelease 버전을 다운로드 해야하는지 확인합니다.
 * 
 * @param {boolean} def (선택 항목) true면 기본값이 반환.
 * @returns {boolean} 런처가 Prerelease 버전을 다운로드 해야하는지 여부.
 */
exports.getAllowPrerelease = function(def = false){
    return !def ? config.settings.launcher.allowPrerelease : DEFAULT_CONFIG.settings.launcher.allowPrerelease
}

/**
 * 런처가 Prerelease 버전을 다운로드 해야하는지 여부의 상태를 변경합니다.
 * 
 * @param {boolean} launchDetached 런처가 Prerelease 버전을 다운로드 해야하는지 여부.
 */
exports.setAllowPrerelease = function(allowPrerelease){
    config.settings.launcher.allowPrerelease = allowPrerelease
}

exports.getLauncherOpen = function(def = false) {
    return !def ? config.settings.launcher.launcherOpen : DEFAULT_CONFIG.settings.launcher.launcherOpen;
}

exports.setLauncherOpen = function(launcherOpen) {
    config.settings.launcher.launcherOpen = launcherOpen;
}

exports.getGameLogOpen = function(def = false) {
    return !def ? config.settings.launcher.gameLogOpen : DEFAULT_CONFIG.settings.launcher.gameLogOpen;
}

exports.setGameLogOpen = function(gameLogOpen) {
    config.settings.launcher.gameLogOpen = gameLogOpen;
}

exports.getTrayMove = function(def = false) {
    return !def ? config.settings.launcher.trayMove : DEFAULT_CONFIG.settings.launcher.trayMove;
}

exports.setTrayMove = function(trayMove) {
    config.settings.launcher.trayMove = trayMove;
}

exports.isNotiMic = function() {
    return config.notiMic;
}

exports.setNotiMic = function(value) {
    config.notiMic = value;
}