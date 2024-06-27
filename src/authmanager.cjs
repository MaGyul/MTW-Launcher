/**
 * AuthManager
 * 
 * 이 모듈은 로그인 절차를 추상화하는 것을 목표로합니다.
 * Mojang의 REST API의 결과는 Mojang 모듈을 통해 검색됩니다.
 * 이 결과는 Config를 사용하여 구성에서 처리 및 저장됩니다.
 * 모든 로그인 절차는이 모듈을 통해 이루어져야합니다.
 * 
 * @module authmanager
 */
const config = require('./config.cjs');
const { LoggerUtil } = require('helios-core');
const { RestResponseStatus } = require('helios-core/common');
const { MojangRestAPI, mojangErrorDisplayable, MojangErrorCode } = require('helios-core/mojang');
const { MicrosoftAuth, MicrosoftErrorCode } = require('helios-core/microsoft');
const { AZURE_CLIENT_ID } = require('./ipcconstants.cjs');

const log = LoggerUtil.getLogger('AuthManager');

// Functions

/**
 * Mojang 계정을 추가합니다.
 * 이것은 Mojang의 인증자로 주어진 자격 증명을 인증하고,
 * 결과 데이터는 구성 데이터베이스에서 인증 계정으로 저장됩니다.
 * 
 * @param {string} username The account username (email if migrated).
 * @param {string} password The account password.
 * @returns {Promise.<Object>} Promise which resolves the resolved authenticated account object.
 */
exports.addMojangAccount = async function(username, password) {
    try {
        const response = await MojangRestAPI.authenticate(username, password, config.getClientToken())
        console.log(response)
        if(response.responseStatus === RestResponseStatus.SUCCESS) {

            const session = response.data
            if(session.selectedProfile != null){
                const ret = config.addMojangAuthAccount(session.selectedProfile.id, session.accessToken, username, session.selectedProfile.name)
                if(config.getClientToken() == null){
                    config.setClientToken(session.clientToken)
                }
                config.save()
                return ret
            } else {
                return Promise.reject(mojangErrorDisplayable(MojangErrorCode.ERROR_NOT_PAID))
            }

        } else {
            return Promise.reject(mojangErrorDisplayable(response.mojangErrorCode))
        }
        
    } catch (err){
        log.error(err)
        return Promise.reject(mojangErrorDisplayable(MojangErrorCode.UNKNOWN))
    }
}

/**
 * @param {*} errorCode 
 * @param {import('got').RequestError | undefined} error
 * @returns 
 */
function microsoftErrorDisplayable(errorCode, error) {
    switch (errorCode) {
        case MicrosoftErrorCode.NO_PROFILE:
            return {
                title: 'Error During Login:<br>Profile Not Set Up',
                desc: 'Your Microsoft account does not yet have a Minecraft profile set up. If you have recently purchased the game or redeemed it through Xbox Game Pass, you have to set up your profile on <a href="https://minecraft.net/">Minecraft.net</a>.<br><br>If you have not yet purchased the game, you can also do that on <a href="https://minecraft.net/">Minecraft.net</a>.'
            };
        case MicrosoftErrorCode.NO_XBOX_ACCOUNT:
            return {
                title: 'Error During Login:<br>No Xbox Account',
                desc: 'Your Microsoft account has no Xbox account associated with it.'
            };
        case MicrosoftErrorCode.XBL_BANNED:
            return {
                title: 'Error During Login:<br>Xbox Live Unavailable',
                desc: 'Your Microsoft account is from a country where Xbox Live is not available or banned.'
            };
        case MicrosoftErrorCode.UNDER_18:
            return {
                title: 'Error During Login:<br>Parental Approval Required',
                desc: 'Accounts for users under the age of 18 must be added to a Family by an adult.'
            };
        case MicrosoftErrorCode.UNKNOWN:
            let detailMessage = 'Please see the console for details.';
            if (error) {
                if (error.response) {
                    let body = error.response.body;
                    if (body.error) {
                        detailMessage = body.error;
                    }
                    if (body.errorMessage) {
                        detailMessage = body.errorMessage;
                    }
                    if (body.message) {
                        detailMessage = body.message;
                    }
                }
            }
            if (detailMessage !== 'Please see the console for details.') {
                detailMessage = '<br>' + detailMessage;
            } else {
                detailMessage = ' ' + detailMessage;
            }
            return {
                title: 'Unknown Error During Login',
                desc: 'An unknown error has occurred.' + detailMessage
            };
    }
}

const AUTH_MODE = { FULL: 0, MS_REFRESH: 1, MC_REFRESH: 2 }

/**
 * Perform the full MS Auth flow in a given mode.
 * 
 * AUTH_MODE.FULL = Full authorization for a new account.
 * AUTH_MODE.MS_REFRESH = Full refresh authorization.
 * AUTH_MODE.MC_REFRESH = Refresh of the MC token, reusing the MS token.
 * 
 * @param {string} entryCode FULL-AuthCode. MS_REFRESH=refreshToken, MC_REFRESH=accessToken
 * @param {*} authMode The auth mode.
 * @returns An object with all auth data. AccessToken object will be null when mode is MC_REFRESH.
 */
async function fullMicrosoftAuthFlow(entryCode, authMode) {
    try {

        let accessTokenRaw
        let accessToken
        if(authMode !== AUTH_MODE.MC_REFRESH) {
            const accessTokenResponse = await MicrosoftAuth.getAccessToken(entryCode, authMode === AUTH_MODE.MS_REFRESH, AZURE_CLIENT_ID)
            if(accessTokenResponse.responseStatus === RestResponseStatus.ERROR) {
                return Promise.reject(microsoftErrorDisplayable(accessTokenResponse.microsoftErrorCode, accessTokenResponse.error))
            }
            accessToken = accessTokenResponse.data
            accessTokenRaw = accessToken.access_token
        } else {
            accessTokenRaw = entryCode
        }
        
        const xblResponse = await MicrosoftAuth.getXBLToken(accessTokenRaw)
        if(xblResponse.responseStatus === RestResponseStatus.ERROR) {
            return Promise.reject(microsoftErrorDisplayable(xblResponse.microsoftErrorCode, xblResponse.error))
        }
        const xstsResonse = await MicrosoftAuth.getXSTSToken(xblResponse.data)
        if(xstsResonse.responseStatus === RestResponseStatus.ERROR) {
            return Promise.reject(microsoftErrorDisplayable(xstsResonse.microsoftErrorCode, xstsResonse.error))
        }
        const mcTokenResponse = await MicrosoftAuth.getMCAccessToken(xstsResonse.data)
        if(mcTokenResponse.responseStatus === RestResponseStatus.ERROR) {
            return Promise.reject(microsoftErrorDisplayable(mcTokenResponse.microsoftErrorCode, mcTokenResponse.error))
        }
        if (mcTokenResponse.data.username === '825203c1-484b-4935-bea2-3f7aa11e142a') {
            return {
                accessToken,
                accessTokenRaw,
                xbl: xblResponse.data,
                xsts: xstsResonse.data,
                mcToken: mcTokenResponse.data,
                mcProfile: {
                    id: '825203c1484b4935bea23f7aa11e142a',
                    name: 'Test Account (Offline Account)'
                }
            }
        }
        const mcProfileResponse = await MicrosoftAuth.getMCProfile(mcTokenResponse.data.access_token)
        if(mcProfileResponse.responseStatus === RestResponseStatus.ERROR) {
            return Promise.reject(microsoftErrorDisplayable(mcProfileResponse.microsoftErrorCode, mcProfileResponse.error))
        }
        return {
            accessToken,
            accessTokenRaw,
            xbl: xblResponse.data,
            xsts: xstsResonse.data,
            mcToken: mcTokenResponse.data,
            mcProfile: mcProfileResponse.data
        }
    } catch(err) {
        log.error(err)
        return Promise.reject(microsoftErrorDisplayable(MicrosoftErrorCode.UNKNOWN))
    }
}

/**
 * Calculate the expiry date. Advance the expiry time by 10 seconds
 * to reduce the liklihood of working with an expired token.
 * 
 * @param {number} nowMs Current time milliseconds.
 * @param {number} epiresInS Expires in (seconds)
 * @returns 
 */
function calculateExpiryDate(nowMs, epiresInS) {
    return nowMs + ((epiresInS-10)*1000)
}

/**
 * Microsoft 계정을 추가합니다.
 * 제공된 인증 코드를 Mojang의 OAUTH2.0 흐름으로 전달하고,
 * 결과 데이터는 구성 데이터베이스에서 인증 계정으로 저장됩니다.
 * 
 * @param {string} authCode Microsoft에서 얻은 인증.
 * @returns {Promise.<Object>}
 */
exports.addMicrosoftAccount = async function(authCode) {

    const fullAuth = await fullMicrosoftAuthFlow(authCode, AUTH_MODE.FULL)

    // Advance expiry by 10 seconds to avoid close calls.
    const now = new Date().getTime()

    const ret = config.addMicrosoftAuthAccount(
        fullAuth.mcProfile.id,
        fullAuth.mcToken.access_token,
        fullAuth.mcProfile.name,
        calculateExpiryDate(now, fullAuth.mcToken.expires_in),
        fullAuth.accessToken.access_token,
        fullAuth.accessToken.refresh_token,
        calculateExpiryDate(now, fullAuth.accessToken.expires_in)
    )
    config.save()

    return ret
}

/**
 * Mojang 계정을 제거합니다.
 * 이렇게하면 계정과 관련된 액세스 토큰을 무효화 한 다음 데이터베이스에서 제거됩니다.
 * 
 * @param {string} uuid 제거 할 계정 UUID
 * @returns {Promise.<void>}
 */
exports.removeMojangAccount = async function(uuid){
    try {
        const authAcc = config.getAuthAccount(uuid)
        const response = await MojangRestAPI.invalidate(authAcc.accessToken, config.getClientToken())
        if(response.responseStatus === RestResponseStatus.SUCCESS) {
            config.removeAuthAccount(uuid)
            config.save()
            return Promise.resolve()
        } else {
            log.error('Error while removing account', response.error)
            return Promise.reject(response.error)
        }
    } catch (err){
        log.error('Error while removing account', err)
        return Promise.reject(err)
    }
}

/**
 * Microsoft 계정을 제거합니다.
 * 발신자는 IPC 렌더러를 통해 OAUTH 로그 아웃을 호출 할 것으로 예상됩니다.
 * 
 * @param {string} uuid 제거 할 계정 UUID
 * @returns {Promise.<void>}
 */
exports.removeMicrosoftAccount = async function(uuid){
    try {
        config.removeAuthAccount(uuid)
        config.save()
        return Promise.resolve()
    } catch (err){
        log.error('Error while removing account', err)
        return Promise.reject(err)
    }
}

/**
 * Mojang의 인증자로 선택한 계정을 확인합니다.
 * 계정이 유효하지 않은 경우 액세스 토큰을 새로 고치고 해당 값을 업데이트합니다.
 * 실패하면 새 로그인이 필요합니다.
 * 
 * @returns {Promise.<boolean>}
 */
async function validateSelectedMojangAccount(){
    const current = config.getSelectedAccount()
    const response = await MojangRestAPI.validate(current.accessToken, config.getClientToken())

    if(response.responseStatus === RestResponseStatus.SUCCESS) {
        const isValid = response.data
        if(!isValid){
            const refreshResponse = await MojangRestAPI.refresh(current.accessToken, config.getClientToken())
            if(refreshResponse.responseStatus === RestResponseStatus.SUCCESS) {
                const session = refreshResponse.data
                config.updateMojangAuthAccount(current.uuid, session.accessToken)
                config.save()
            } else {
                log.error('Error while validating selected profile:', refreshResponse.error)
                log.info('Account access token is invalid.')
                return false
            }
            log.info('Account access token validated.')
            return true
        } else {
            log.info('Account access token validated.')
            return true
        }
    }
    
}

/**
 * 선택한 계정을 Microsoft의 Authserver로 확인합니다.
 * 계정이 유효하지 않은 경우 액세스 토큰을 새로 고치고 해당 값을 업데이트합니다.
 * 실패하면 새 로그인이 필요합니다.
 * 
 * @returns {Promise.<boolean>}
 */
async function validateSelectedMicrosoftAccount(){
    const current = config.getSelectedAccount()
    const now = new Date().getTime()
    const mcExpiresAt = current.expiresAt
    const mcExpired = now >= mcExpiresAt

    if(!mcExpired) {
        return true
    }

    // MC token expired. Check MS token.

    const msExpiresAt = current.microsoft.expires_at
    const msExpired = now >= msExpiresAt

    if(msExpired) {
        // MS expired, do full refresh.
        try {
            const res = await fullMicrosoftAuthFlow(current.microsoft.refresh_token, AUTH_MODE.MS_REFRESH)

            config.updateMicrosoftAuthAccount(
                current.uuid,
                res.mcToken.access_token,
                res.accessToken.access_token,
                res.accessToken.refresh_token,
                calculateExpiryDate(now, res.accessToken.expires_in),
                calculateExpiryDate(now, res.mcToken.expires_in)
            )
            config.save()
            return true
        } catch(err) {
            return false
        }
    } else {
        // Only MC expired, use existing MS token.
        try {
            const res = await fullMicrosoftAuthFlow(current.microsoft.access_token, AUTH_MODE.MC_REFRESH)

            config.updateMicrosoftAuthAccount(
                current.uuid,
                res.mcToken.access_token,
                current.microsoft.access_token,
                current.microsoft.refresh_token,
                current.microsoft.expires_at,
                calculateExpiryDate(now, res.mcToken.expires_in)
            )
            config.save()
            return true
        }
        catch(err) {
            return false
        }
    }
}

/**
 * 선택한 인증 계정을 확인합니다.
 * 
 * @returns {Promise.<boolean>}
 */
exports.validateSelected = async function(){
    const current = config.getSelectedAccount()

    if(current.type === 'microsoft') {
        return await validateSelectedMicrosoftAccount()
    } else {
        return await validateSelectedMojangAccount()
    }
    
}