export interface AcctPacket {
  statusType: 'Start' | 'Interim-Update' | 'Stop';
  sessionId: string;        // Acct-Session-Id
  nasIdentifier: string;    // kit id
  userName: string;
  inputOctets: number;      // Acct-Input-Octets, cumulative for the session, 32-bit
  inputGigawords: number;   // Acct-Input-Gigawords
  outputOctets: number;
  outputGigawords: number;
  eventTimestamp: number;   // seconds since epoch
}

interface SessionState {
    timestamp: number; // seconds since epoch
    inputBytes: bigint; // cumulative input bytes
    outputBytes: bigint; // cumulative output bytes
    stop: boolean; // true if the session has been stopped
}

export class UsageLedger {

    private sessions: Map<string, SessionState> = new Map();

    private kitUsage: Map<string, bigint> = new Map(); // kitId -> total bytes served
    private userUsage: Map<string, bigint> = new Map(); // userName -> total bytes used

    private toBytes(octets: number, gigawords: number): bigint {
        return BigInt(octets) + (BigInt(gigawords) << 32n);
    }
  ingest(p: AcctPacket): bigint {
    const key = JSON.stringify([
        p.nasIdentifier,
        p.userName,
        p.sessionId,
    ]);

    const inputBytes = this.toBytes(p.inputOctets, p.inputGigawords);
    const outputBytes = this.toBytes(p.outputOctets, p.outputGigawords);

    const previous = this.sessions.get(key);

    if(previous?.stopped){
        return 0n;
    }

    if(previous && previous.timestamp > p.eventTimestamp){
        return 0n;
    }

    const deltaInput = previous ? inputBytes - previous.inputBytes : inputBytes;
    const deltaOutput = previous ? outputBytes - previous.outputBytes : outputBytes;

    if(deltaInput < 0n || deltaOutput < 0n){
        return 0n;
    }

    const newBytes = deltaInput + deltaOutput;

    this.sessions.set(key, {
        timestamp: p.eventTimestamp,
        inputBytes,
        outputBytes,
        stop: p.statusType === 'Stop',
    });

    const currentKitUsage = this.kitUsage.get(p.nasIdentifier) ?? 0n;
    this.kitUsage.set(p.nasIdentifier, currentKitUsage + newBytes);

    const currentUserUsage = this.userUsage.get(p.userName) ?? 0n;
    this.userUsage.set(p.userName, currentUserUsage + newBytes);

    return newBytes;
}
  bytesServedByKit(kitId: string): bigint {
    return this.kitUsage.get(kitId) ?? 0n;
  }
  bytesUsedByUser(userName: string): bigint {
    return this.userUsage.get(userName) ?? 0n;
  }
}
