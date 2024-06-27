declare interface AuthManager {
    addMojangAccount: (username: string, password: string) => Promise<Account>;
    addMicrosoftAccount: (authCode: string) => Promise<Account>;
    removeMojangAccount: (uuid: string) => Promise<void>;
    removeMicrosoftAccount: (uuid: string) => Promise<void>;
    validateSelected: () => Promise<boolean>;
}