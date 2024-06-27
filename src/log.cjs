const log = console.log;
const info = console.info;
const warn = console.warn;
const error = console.error;
const debug = console.debug;
const trace = console.trace;

const funcs = [
    log, info, warn, error, debug, trace
];

module.exports = {
    funcs,
    disable: () => {
        for (let func of funcs) {
            console[func.name] = function() {
                setTimeout(func.bind(console, ...arguments));
            }
        }
    }
}