import { describe, it, expect } from "vitest";
import { UsageLedger } from "./accounting.js";

describe(UsageLedger, () => {

    const packet = {
        statusType: 'Start' as const,
        sessionId: 'session1',
        nasIdentifier: 'kit1',
        userName: 'Paul',
        inputOctets: 100,
        inputGigawords: 0,
        outputOctets: 200,
        outputGigawords: 0,
        eventTimestamp: new Date(),
    };

    it('counts user usage', () => {
        const ledger = new UsageLedger();
        
        expect(ledger.ingest(packet)).toBe(300n);

        const result = ledger.ingest({
            ...packet,
            inputOctets: 150,
            outputOctets: 250,
            statusType: 'Interim-Update',
            eventTimestamp: new Date(packet.eventTimestamp.getTime() + 1000),
        });

        expect(result).toBe(100n);
        expect(ledger.bytesServedByKit('kit1')).toBe(400n);
        expect(ledger.bytesUsedByUser('Paul')).toBe(400n);
    });


    it('ignores duoliciate packets', () => {
        const ledger = new UsageLedger();

        ledger.ingest(packet);
        const interim = {
            ...packet,
            inputOctets: 150,
            outputOctets: 250,
            statusType: 'Interim-Update' as const,
            eventTimestamp: new Date(packet.eventTimestamp.getTime() + 1000),
        }

        expect(ledger.ingest(interim)).toBe(100n);
        expect(ledger.ingest(interim)).toBe(0n);
    });

    it('ignores packets with older timestamps', () => {
        const ledger = new UsageLedger();

        ledger.ingest({
            ...packet,
            inputOctets: 150,
            outputOctets: 250,
            statusType: 'Interim-Update' as const,
            eventTimestamp: new Date(packet.eventTimestamp.getTime() + 1000),
        });

        const result = ledger.ingest({
            ...packet,
            statusType: 'Interim-Update' as const,
            inputOctets: 200,
            eventTimestamp: new Date(packet.eventTimestamp.getTime() - 1000),
        });

        expect(result).toBe(0n);
    });
    
    it('handles usage crossing 4GB boundary', () => {
        const ledger = new UsageLedger();
        
        ledger.ingest({
            ...packet,
            inputOctets: 424000,
            eventTimestamp: new Date(packet.eventTimestamp.getTime() + 1000),
        });

            
        const result = ledger.ingest({
            ...packet,
            statusType: 'Interim-Update' as const,
            inputOctets: 10,
            inputGigawords: 1,
            eventTimestamp: new Date(packet.eventTimestamp.getTime() + 2000),
        });

        expect(result).toBe(4294967296n + 10n - 424000n);
    });

    it('counts a stop without a start', () => {
        const ledger = new UsageLedger();

        const result = ledger.ingest({
            ...packet,
            statusType: 'Stop' as const,
            eventTimestamp: new Date(packet.eventTimestamp.getTime() + 1000),
        });
        expect(result).toBe(300n);
    });

});