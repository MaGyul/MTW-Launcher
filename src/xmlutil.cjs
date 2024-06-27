const logTab = '&nbsp;&nbsp;&nbsp;&nbsp;';

/**
 * @param {string} data 
 * @returns {{ logger: string; timestamp: number; level: string; thread: string; message: string; }[]}
 */
module.exports = function parseMcLog(data) {
    let out = [];
    data = data
        .replace(/log4j\:/g, '');
        // .replace(/\\u001b/g, '');
    let xml = parseXml(data);
    // <Event logger="net.minecraft.client.gui.font.providers.UnihexProvider" timestamp="1707742040098" level="INFO" thread="Worker-Main-7">
    //     <Message><![CDATA[Found unifont_all_no_pua-15.1.04.hex, loading]]></Message>
    // </Event>
    let events = xml.getElementsByTagName('Event');
    Array.from(events, (ele) => {
        let logger = ele.getAttribute('logger') ?? 'none';
        let timestamp = ele.getAttribute('timestamp') ?? '0';
        let level = ele.getAttribute('level') ?? 'none';
        let thread = ele.getAttribute('thread') ?? 'none';
        let message = ele.querySelector('Message')?.textContent ?? '';
        let thrEle = ele.querySelector('Throwable');
        if (thrEle && thrEle.textContent) {
            let throwable = thrEle.textContent;//.replace(/\n/g, '<br>').replace(/\t/g, logTab).replace(/Caused by/g, '<br>Caused by');
            message += '\n' + throwable;
        }
        out.push({
            logger: logger,
            timestamp: parseInt(timestamp),
            level: level,
            thread: thread,
            message: message
        });
    });
    return out;
}

function parseXml(xml) {
    return new DOMParser().parseFromString(xml, 'text/xml');
}