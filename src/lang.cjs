const fs = require('fs');
const path = require('path');
const merge = require('lodash.merge');

function getLang(key) {
    var langPath = path.join(__dirname, '..', 'assets', 'lang', `${key}.json`);
    if (!fs.existsSync(langPath)) {
        langPath = path.join(__dirname, '..', 'static', 'assets', 'lang', `${key}.json`);
    }
    var commonPath = path.join(__dirname, '..', 'assets', 'lang', `common.json`);
    if (!fs.existsSync(commonPath)) {
        commonPath = path.join(__dirname, '..', 'static', 'assets', 'lang', `common.json`);
    }
    if (fs.existsSync(langPath)) {
        return merge(JSON.parse(fs.readFileSync(langPath)), fs.existsSync(commonPath) ? JSON.parse(fs.readFileSync(commonPath)) : {});
    } else {
        throw new Error(`Error: lang/${key}.json not found`);
    }
}

function langs() {
    var langPath = path.join(__dirname, '..', 'assets', 'lang');
    if (!fs.existsSync(langPath)) {
        langPath = path.join(__dirname, '..', 'static', 'assets', 'lang');
    }
    return fs.readdirSync(langPath).filter(s => s != 'common.json').map(s => s.replace('.json', ''));
}

module.exports = {
    getLang,
    langs
}