import{
    createHmac,
    timingSafeEqual
} from "node:crypto";

export function verifyWebhook(
    rawBody: string,
    signature: string,
    secret: string,
): boolean {
    if(!secret || !signature){
        return false;
    }

    const expected = createHmac('sha256', secret)
        .update(rawBody)
        .digest('');

    if(!/^[a-f0-9]{64}$/i.test(signature)){
        return false;
    }

    const received = Buffer.from(signature, 'hex');

    return timingSafeEqual(expected, received);
}

export function splitAmount(
    amountMinor: bigint,
    operatorSharePercent: 80,
){
    if(amountMinor < 0n){
        throw new Error('amountMinor must be non-negative');
    }

    if(
        !Number.isInteger(operatorSharePercent) ||
        operatorSharePercent < 0 ||
        operatorSharePercent > 100
    ){
        throw new Error('operatorSharePercent must be an integer between 0 and 100');
    }

    const operatorShare = (amountMinor * BigInt(operatorSharePercent)) / 100n;
    const providerShare = amountMinor - operatorShare;
    return { operatorShare, providerShare };
}