const { DistributionAPI } = require('helios-core/common');

const config = require('./config.cjs');

const isPackaged = process.env.isPackaged == 'true';
let devLoc = 'http://localhost:5173/distribution.json';

devLoc = 'https://raw.githubusercontent.com/MaGyul/MTW-Launcher/main/distribution.json';
// devLoc = 'https://raw.githubusercontent.com/MaGyul/MTW-Launcher/main/distribution_1.20.6.json';

exports.REMOTE_DISTRO_URL = isPackaged ? 'https://raw.githubusercontent.com/MaGyul/MTW-Launcher/main/distribution.json' : devLoc;

const api = new DistributionAPI(
    config.getLauncherDirectory(),
    null, null,
    exports.REMOTE_DISTRO_URL,
    false
);

exports.DistroAPI = api;