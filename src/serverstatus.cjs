const { resolveSrv } = require('dns/promises');
const { connect } = require('net');
const { LoggerUtil } = require('helios-core')

const logger = LoggerUtil.getLogger('ServerStatusUtil');
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

/**
 * Get the handshake packet.
 *
 * @param protocol The client's protocol version.
 * @param hostname The server hostname.
 * @param port The server port.
 *
 * @see https://wiki.vg/Server_List_Ping#Handshake
 */
function getHandshakePacket(protocol, hostname, port) {
    return ServerBoundPacket.build()
        .writeVarInt(0x00)
        .writeVarInt(protocol)
        .writeString(hostname)
        .writeUnsignedShort(port)
        .writeVarInt(1) // State, 1 = state
        .toBuffer();
}

/**
 * Get the request packet.
 *
 * @see https://wiki.vg/Server_List_Ping#Request
 */
function getRequestPacket() {
    return ServerBoundPacket.build()
        .writeVarInt(0x00)
        .toBuffer();
}

/**
 * Some servers do not return the same status object. Unify
 * the response so that the caller need only worry about
 * handling a single format.
 *
 * @param resp The servevr status response.
 */
function unifyStatusResponse(resp) {
    // Some servers don't wrap their description in a text object.
    if (typeof resp.description === 'string') {
        resp.description = {
            text: resp.description
        };
    }
    resp.retrievedAt = (new Date()).getTime();
    return resp;
}

async function checkSrv(hostname) {
    try {
        const records = await resolveSrv(`_minecraft._tcp.${hostname}`);
        return records.length > 0 ? records[0] : null;
    } catch (err) {
        return null;
    }
}

/**
 * @param {number} protocol 
 * @param {string} hostname 
 * @param {number} port 
 * @returns {Promise<import('helios-core/mojang').ServerStatus>}
 */
async function getServerStatus(protocol, hostname, port = 25565) {
    const srvRecord = await checkSrv(hostname);
    if (srvRecord != null) {
        hostname = srvRecord.name;
        port = srvRecord.port;
    }
    return await new Promise((resolve, reject) => {
        const socket = connect(port, hostname, () => {
            socket.write(getHandshakePacket(protocol, hostname, port));
            socket.write(getRequestPacket());
        });
        socket.setTimeout(5000, () => {
            socket.destroy();
            let errorMessage = `서버 상태 소켓 시간이 초과되었습니다 (${hostname}:${port}).`;
            logger.error(errorMessage);
            reject(new Error(errorMessage));
        });
        const maxTries = 5;
        let iterations = 0;
        let bytesLeft = -1;
        socket.once('data', (data) => {
            const inboundPacket = new ClientBoundPacket(data);
            // 패킷 ID + 데이터의 길이
            const packetLength = inboundPacket.readVarInt(); // 첫 번째 VarInt는 패킷 길이
            const packetType = inboundPacket.readVarInt(); // 두 번째 VarInt는 패킷 유형
            if (packetType !== 0x00) {
                // TODO
                socket.destroy();
                reject(new Error(`잘못된 응답입니다. 예상 패킷 유형 ${0x00}, 수신된 패킷 유형 ${packetType}!`));
                return;
            }
            // packetLength 변수의 크기는 packetLength에 포함되지 않습니다.
            bytesLeft = packetLength + ProtocolUtils.getVarIntSize(packetLength);
            // 리스너가 버퍼에 모든 바이트를 읽을 때까지 계속 읽도록 합니다.
            const packetReadListener = (nextData, doAppend) => {
                if (iterations > maxTries) {
                    socket.destroy();
                    reject(new Error(`${hostname}:${port}에서 읽은 데이터가 ${maxTries} 반복 횟수를 초과하여 연결을 닫습니다.`));
                    return;
                }
                ++iterations;
                if (bytesLeft > 0) {
                    bytesLeft -= nextData.length;
                    if (doAppend) {
                        inboundPacket.append(nextData);
                    }
                }
                // 모든 바이트를 읽고 변환을 시도합니다.
                if (bytesLeft === 0) {
                    // 버퍼의 나머지 부분은 서버 상태 json
                    const result = inboundPacket.readString();
                    try {
                        const parsed = JSON.parse(result);
                        socket.end();
                        resolve(unifyStatusResponse(parsed));
                    } catch (err) {
                        socket.destroy();
                        let errorMessage = '서버 상태 JSON 구문 분석에 실패했습니다.';
                        logger.error(errorMessage, err);
                        reject(new Error(errorMessage));
                    }
                }
            };
            // 방금 받은 데이터 읽기
            packetReadListener(data, false);
            // 데이터가 너무 길면 계속 읽을 수 있도록 리스너 추가
            socket.on('data', (data) => packetReadListener(data, true));
        });
        socket.on('error', (err) => {
            socket.destroy();
            if (err.code === 'ENOTFOUND') {
                // ENOTFOUND = 해결할 수 없습니다.
                reject(new Error(`서버 ${hostname}:${port}를 찾을 수 없습니다!`));
                return;
            } else if (err.code === 'ECONNREFUSED') {
                // ECONNREFUSED = 포트에 연결할 수 없습니다.
                reject(new Error(`서버 ${hostname}:${port}가 연결을 거부했습니다. 포트가 맞나요?`));
                return;
            } else {
                logger.error(`서버 상태를 가져오려고 하는 동안 오류가 발생했습니다(${hostname}}:${port}).`);
                reject(err);
                return;
            }
        });
    });
}

/**
 * Utility Class to construct a packet conforming to Minecraft's
 * protocol. All data types are BE except VarInt and VarLong.
 *
 * @see https://wiki.vg/Protocol
 */
class ServerBoundPacket {
    buffer;

    constructor() {
        this.buffer = [];
    }

    static build() {
        return new ServerBoundPacket();
    }

    /**
     * Packet is prefixed with its data length as a VarInt.
     *
     * @see https://wiki.vg/Protocol#Packet_format
     */
    toBuffer() {
        const finalizedPacket = new ServerBoundPacket();
        finalizedPacket.writeVarInt(this.buffer.length);
        finalizedPacket.writeBytes(...this.buffer);
        return Buffer.from(finalizedPacket.buffer);
    }

    writeBytes(...bytes) {
        this.buffer.push(...bytes);
        return this;
    }

    /**
     * @see https://wiki.vg/Protocol#VarInt_and_VarLong
     */
    writeVarInt(value) {
        do {
            let temp = value & 0b01111111;
            value >>>= 7;
            if (value != 0) {
                temp |= 0b10000000;
            }
            this.writeBytes(temp);
        } while (value != 0);
        return this;
    }

    /**
     * Strings are prefixed with their length as a VarInt.
     *
     * @see https://wiki.vg/Protocol#Data_types
     * @param {string} string 
     */
    writeString(string) {
        let bytes = textEncoder.encode(string);
        this.writeVarInt(bytes.length);
        this.writeBytes(...bytes);
        return this;
    }

    writeUnsignedShort(short) {
        const buf = Buffer.alloc(2);
        buf.writeUInt16BE(short, 0);
        this.writeBytes(...buf);
        return this;
    }
}

/**
 * Utility Class to read a client-bound packet conforming to
 * Minecraft's protocol. All data types are BE except VarInt
 * and VarLong.
 *
 * @see https://wiki.vg/Protocol
 */
class ClientBoundPacket {
    buffer;

    constructor(buffer) {
        this.buffer = [...buffer];
    }

    append(buffer) {
        this.buffer.push(...buffer);
    }

    readByte() {
        return this.buffer.shift();
    }

    readBytes(length) {
        const value = this.buffer.slice(0, length);
        this.buffer.splice(0, length);
        return value;
    }

    readVarInt() {
        let numRead = 0;
        let result = 0;
        let read;
        do {
            read = this.readByte();
            const value = (read & 0b01111111);
            result |= (value << (7 * numRead));
            numRead++;
            if (numRead > 5) {
                throw new Error('VarInt is too big');
            }
        } while ((read & 0b10000000) != 0);
        return result;
    }

    readString() {
        const length = this.readVarInt();
        const data = this.readBytes(length);
        let str = textDecoder.decode(new Uint8Array(data));
        return str;
    }
}

class ProtocolUtils {
    static getVarIntSize(value) {
        let size = 0;
        do {
            value >>>= 7;
            size++;
        } while (value != 0);
        return size;
    }
}

module.exports = getServerStatus;