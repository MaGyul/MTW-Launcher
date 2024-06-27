declare type Mods = { 
	[key: string]: boolean | { mods: Mods; value?: boolean }
};

declare interface ModConfiguration {
	id: string;
	mods: Mods;
}

declare interface Config {
	/**
	 * 런처 디렉터리의 절대 경로를 검색합니다.
	 * 
	 * @returns {string} 런처 디렉터리의 절대 경로
	 */
	getLauncherDirectory: () => string;
	/**
	 * 런처의 데이터 디렉터리를 가져옵니다.
	 * 게임 실행과 관련된 모든 파일(공통, 인스턴스, Java 등)이 설치되는 곳입니다.
	 * 
	 * @returns {string} 런처의 데이터 디렉터리의 절대 경로
	 */
	getDataDirectory: (def?: boolean) => string;
	/**
	 * 새 데이터 디렉터리를 설정합니다.
	 * 
	 * @param {string} dataDirectory 새 데이터 디렉터리
	 */
	setDataDirectory: (dataDirectory: string) => void;
	getAbsoluteMinRAM: (ram: any) => number;
	getAbsoluteMaxRAM: (ram: any) => number;
	/**
	 * 현재 구성을 파일에 저장합니다.
	 */
	save: () => void;
	/**
	 * 구성을 메모리에 로드합니다. 
	 * 구성 파일이 있는 경우 해당 파일을 읽고 저장합니다. 
	 * 그렇지 않으면 기본 구성이 생성됩니다. 
	 * "resolved" 값은 기본값이 null 이므로 외부에서 할당해야 한다는 점에 유의하세요.
	 */
	load: (internet: boolean) => void;
	/**
	 * @returns {boolean} 로드되었는지 여부
	 */
	isLoaded: () => boolean;
	/**
	 * 유효성이 검사된 대상 개체사용자가 애플리케이션을 처음 실행했는지 확인합니다. 
	 * 이는 데이터 경로의 존재 여부에 따라 결정됩니다.
	 * 
	 * @returns {boolean} 첫 번째 실행인 경우 true고, 그렇지 않으면 false
	 */
	isFirstLaunch: () => boolean;
	getLanguage: () => string;
	setLanguage: (lang: string) => void;
	getTitleBarColor: () => string;
	setTitleBarColor: (color: string) => void;
	/**
	 * 게임 실행을 위해 네이티브 종속성을 추출하고 저장하는 데 
	 * 사용할 OS 임시 디렉터리의 폴더 이름을 반환합니다.
	 * 
	 * @returns {string} 폴더의 이름
	 */
	getTempNativeFolder: () => string;
	/**
	 * 공유 게임 파일(assets, libraries 등)의 
	 * 공통 디렉터리를 검색합니다.
	 * 
	 * @returns {string} 런처의 공통 디렉토리
	 */
	getCommonDirectory: () => string;
	/**
	 * 서버별 게임 디렉터리에 대한 인스턴스 디렉터리를 검색합니다.
	 * 
	 * @returns {string} 런처의 인스턴스 디렉터리
	 */
	getInstanceDirectory: () => string;
	/**
	 * 런처의 클라이언트 토큰을 가져옵니다. 
	 * 기본 클라이언트 토큰은 없습니다.
	 * 
	 * @returns {string} 런처의 클라이언트 토큰
	 */
	getClientToken: () => string;
	/**
	 * 런처의 클라이언트 토큰을 설정합니다.
	 * 
	 * @param {string} clientToken 런처의 새로운 클라이언트 토큰
	 */
	setClientToken: (clientToken: string) => void;
	/**
	 * 선택한 서버팩의 ID를 검색합니다.
	 * 
	 * @param {boolean} def (선택 사항) true면 기본값이 반환
	 * @returns {string} 선택한 서버팩의 ID
	 */
	getSelectedServer: (def?: boolean) => string;
	/**
	 * 선택한 ServerPack의 ID를 설정합니다.
	 * 
	 * @param {string} serverID 새로운 선택된 ServerPack의 ID.
	 */
	setSelectedServer: (serverID: string) => void;
	/**
	 * 현재 런처에서 인증 한 각 계정의 배열을 가져옵니다.
	 * 
	 * @returns 저장된 인증 계정의 배열
	 */
	getAuthAccounts: () => {[key: string]: Account};
	/**
	 * 주어진 UUID로 인증 된 계정을 반환합니다.
	 * 값은 무일하게 될 수 있습니다.
	 * 
	 * @param {string} uuid 인증 계정의 UUID.
	 * @returns {Object} 주어진 UUID와의 인증 계정.
	 */
	getAuthAccount: (uuid: string) => Account;
	/**
	 * 인증된 모장 계정의 액세스 토큰을 업데이트합니다.
	 * 
	 * @param {string} uuid 인증 계정의 UUID.
	 * @param {string} accessToken 새로운 액세스 토큰.
	 * 
	 * @returns {Object} 이 조치에 의해 생성 된 인증 된 계정 개체.
	 */
	updateMojangAuthAccount: (uuid: string, accessToken: string) => Account;
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
	addMojangAuthAccount: (uuid: string, accessToken: string, username: string, displayName: string) => Account;
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
	updateMicrosoftAuthAccount: (uuid: string, accessToken: string, msAccessToken: string, msRefreshToken: string, msExpires: date, mcExpires: date) => Account;
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
	addMicrosoftAuthAccount: (uuid: string, accessToken: string, name: string, mcExpires: date, msAccessToken: string, msRefreshToken: string, msExpires: date) => Account;
	/**
	 * 데이터베이스에서 인증 된 계정을 제거합니다.
	 * 계정이 선택된 계정 인 경우 새 계정이 선택됩니다.
	 * 계정이 없으면 선택한 계정은 NULL입니다.
	 * 
	 * @param {string} uuid 인증 계정의 UUID.
	 * 
	 * @returns {boolean} 계정이 제거 된 경우 TRUE, 존재하지 않으면 False입니다.
	 */
	removeAuthAccount: (uuid: string) => boolean;
	/**
	 * 현재 선택된 인증 계정을 받으십시오.
	 * 
	 * @returns {Object} 선택한 인증 계정.
	 */
	getSelectedAccount: () => Account;
	/**
	 * 선택한 인증 계정을 설정합니다.
	 * 
	 * @param {string} uuid 선택한 계정으로 설정 될 계정의 UUID.
	 * 
	 * @returns {Object} 선택한 인증 계정.
	 */
	setSelectedAccount: (uuid: string) => Account;

	/**
	 * 현재 저장된 각 모드 구성의 배열을 가져옵니다.
	 * 
	 * @returns {Array.<Object>} 저장된 모드 구성의 배열.
	 */
	getModConfigurations: () => ModConfiguration[];
	
	/**
	 * 저장된 모드 구성의 배열을 설정합니다.
	 * 
	 * @param {Array.<Object>} configurations 모드 구성 배열.
	 */
	setModConfigurations: (configurations: ModConfiguration[]) => void;
	
	/**
	 * 특정 서버의 모드 구성을 가져옵니다.
	 * 
	 * @param {string} serverid 서버의 ID.
	 * @returns {Object} 주어진 서버의 모드 구성.
	 */
	getModConfiguration: (serverid) => ModConfiguration;
	
	/**
	 * 특정 서버의 모드 구성을 설정합니다.
	 * 이것은 기존 값을 능가합니다.
	 * 
	 * @param {string} serverid 주어진 모드 구성에 대한 서버의 ID.
	 * @param {Object} configuration 주어진 서버의 모드 구성.
	 */
	setModConfiguration: (serverid: string, configuration: ModConfiguration) => void;
	/**
	 * 주어진 서버에 대해 Java 구성 속성이 설정되어 있는지 확인합니다.
	 * 
	 * @param {string} serverid 서버 ID.
	 * @param {*} mcVersion 서버의 마인크래프트 버전.
	 */
	ensureJavaConfig: (serverid: string, effectiveJavaOptions: any, ram: any) => void;
	/**
	 * JVM 초기화를 위한 최소 메모리 양을 검색합니다. 
	 * 이 값에는 메모리 단위가 포함됩니다. 
	 * 예를 들어 '5G' = 5기가바이트, '1024M' = 1024메가바이트 등입니다.
	 * 
	 * @param {string} serverid 서버 ID.
	 * @returns {string} JVM 초기화를위한 최소 메모리 양.
	 */
	getMinRAM: (serverid: string) => string;
	/**
	 * JVM 초기화를 위한 최소 메모리 양을 설정합니다. 
	 * 이 값에는 메모리 단위가 포함되어야 합니다. 
	 * 예를 들어 '5G' = 5기가바이트, '1024M' = 1024메가바이트 등입니다.
	 * 
	 * @param {string} serverid 서버 ID.
	 * @param {string} minRAM JVM 초기화를위한 새로운 최소 메모리 양.
	 */
	setMinRAM: (serverid: string, minRAM: string) => void;
	/**
	 * JVM 초기화를 위한 최대 메모리 양을 검색합니다. 
	 * 이 값에는 메모리 단위가 포함됩니다. 
	 * 예를 들어 '5G' = 5기가바이트, '1024M' = 1024메가바이트 등입니다.
	 * 
	 * @param {string} serverid 서버 ID.
	 * @returns {string} JVM 초기화를위한 최대 메모리 양.
	 */
	getMaxRAM: (serverid: string) => string;
	/**
	 * JVM 초기화를 위한 최대 메모리 양을 설정합니다. 
	 * 이 값에는 메모리 단위가 포함되어야 합니다. 
	 * 예를 들어 '5G' = 5기가바이트, '1024M' = 1024메가바이트 등입니다.
	 * 
	 * @param {string} serverid 서버 ID.
	 * @param {string} maxRAM JVM 초기화를위한 새로운 최대 메모리 양.
	 */
	setMaxRAM: (serverid: string, maxRAM: string) => void;
	/**
	 * Java 실행 파일의 경로를 검색합니다.
	 * 
	 * 이것은 해결 된 구성 값이며 외부로 할당 될 때까지 기본값으로 널로 표시됩니다.
	 * 
	 * @param {string} serverid 서버 ID.
	 * @returns {string} Java 실행 파일의 경로.
	 */
	getJavaExecutable: (serverid: string) => string;
	/**
	 * Java 실행 파일의 경로를 설정합니다.
	 * 
	 * @param {string} serverid 서버 ID.
	 * @param {string} executable Java 실행 파일의 새로운 경로.
	 */
	setJavaExecutable: (serverid: string, executable: string) => void;
	/**
	 * JVM 초기화에 대한 추가 인수를 검색합니다.
	 * 메모리 할당과 같은 필수 인수는 동적으로 해결 되며이 값에는 포함되지 않습니다.
	 * 
	 * @param {string} serverid 서버 ID.
	 * @returns {Array.<string>} JVM 초기화에 대한 추가 인수 배열.
	 */
	getJVMOptions: (serverid: string) => Array<string>;
	/**
	 * JVM 초기화에 대한 추가 인수를 설정합니다.
	 * 메모리 할당과 같은 필수 인수는 동적으로 해결 되며이 값에 포함되어서는 안됩니다.
	 * 
	 * @param {string} serverid 서버 ID.
	 * @param {Array.<string>} jvmOptions JVM 초기화에 대한 새로운 추가 인수 배열.
	 */
	setJVMOptions: (serverid: string, jvmOptions: Array<string>) => void;
	/**
	 * 게임 창의 너비를 검색합니다.
	 * 
	 * @param {boolean} def (선택 항목) true면 기본값이 반환.
	 * @returns {number} 게임 창의 너비.
	 */
	getGameWidth: (def?: boolean) => number;
	/**
	 * 게임 창의 너비를 설정합니다.
	 * 
	 * @param {number} resWidth 게임 창의 새로운 너비.
	 */
	setGameWidth: (resWidth: number) => void;
	/**
	 * 잠재적 인 새로운 폭 값을 검증합니다.
	 * 
	 * @param {number} resWidth 검증 할 폭 값.
	 * @returns {boolean} 값이 유효한지 여부.
	 */
	validateGameWidth: (resWidth: number) => boolean;
	/**
	 * 게임 창의 높이를 검색합니다.
	 * 
	 * @param {boolean} def (선택 항목) true면 기본값이 반환.
	 * @returns {number} 게임 창의 높이.
	 */
	getGameHeight: (def?: boolean) => number;
	/**
	 * 게임 창의 높이를 설정합니다.
	 * 
	 * @param {number} resHeight 게임 창의 새로운 높이.
	 */
	setGameHeight: (resHeight: number) => void;
	/**
	 * 잠재적 인 새로운 높이 값을 확인합니다.
	 * 
	 * @param {number} resHeight 검증 할 높이 값.
	 * @returns {boolean} 값이 유효한지 여부.
	 */
	validateGameHeight: (resHeight: number) => boolean;
	/**
	 * 게임이 전체 화면 모드로 시작되어야하는지 확인합니다.
	 * 
	 * @param {boolean} def (선택 항목) true면 기본값이 반환.
	 * @returns {boolean} 게임이 전체 화면 모드로 시작 될지 여부.
	 */
	getFullscreen: (def?: boolean) => boolean;
	/**
	 * 게임을 전체 화면 모드로 시작 해야하는지의 상태를 변경합니다.
	 * 
	 * @param {boolean} fullscreen 게임이 전체 화면 모드로 시작되어야하는지 여부.
	 */
	setFullscreen: (fullscreen: boolean) => void;
	/**
	 * 게임이 서버에 자동으로 연결되어야하는지 확인합니다.
	 * 
	 * @param {boolean} def (선택 항목) true면 기본값이 반환.
	 * @returns {boolean} 게임이 서버에 자동으로 연결되어야하는지 여부.
	 */
	getAutoConnect: (def?: boolean) => boolean;
	/**
	 * 게임이 서버에 자동으로 연결되어야하는지 여부의 상태를 변경합니다.
	 * 
	 * @param {boolean} autoConnect 게임이 서버에 자동으로 연결되어야하는지 여부.
	 */
	setAutoConnect: (autoConnect: boolean) => void;
	/**
	 * 게임이 분리 된 프로세스로 시작되어야하는지 확인합니다.
	 * 
	 * @param {boolean} def (선택 항목) true면 기본값이 반환.
	 * @returns {boolean} 게임이 분리 된 프로세스로 출시 될지 여부.
	 */
	getLaunchDetached: (def?: boolean) => boolean;
	/**
	 * 게임이 분리 된 프로세스로 시작되어야하는지 여부의 상태를 변경합니다.
	 * 
	 * @param {boolean} launchDetached 게임이 분리 된 프로세스로 출시되어야하는지 여부.
	 */
	setLaunchDetached: (launchDetached: boolean) => void;
	/**
	 * 런처가 Prerelease 버전을 다운로드 해야하는지 확인합니다.
	 * 
	 * @param {boolean} def (선택 항목) true면 기본값이 반환.
	 * @returns {boolean} 런처가 Prerelease 버전을 다운로드 해야하는지 여부.
	 */
	getAllowPrerelease: (def?: boolean) => boolean;
	/**
	 * 런처가 Prerelease 버전을 다운로드 해야하는지 여부의 상태를 변경합니다.
	 * 
	 * @param {boolean} launchDetached 런처가 Prerelease 버전을 다운로드 해야하는지 여부.
	 */
	setAllowPrerelease: (allowPrerelease: any) => void;

	getLauncherOpen(def?: boolean): boolean;
	setLauncherOpen(launcherOpen: boolean): void;
	getGameLogOpen(def?: boolean): boolean;
	setGameLogOpen(gameLogOpen: boolean): void;
	getTrayMove(def?: boolean): boolean;
	setTrayMove(trayMove: boolean): void;
	isNotiMic(): boolean;
	setNotiMic(value: boolean): void;
}