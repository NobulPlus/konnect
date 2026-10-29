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


export function splitRevenue(
  amountMinor: bigint,
  operatorPercent = 80
) {
  if (amountMinor < 0n) {
    throw new Error('Invalid amount');
  }

  if (
    !Number.isInteger(operatorPercent) ||
    operatorPercent < 0 ||
    operatorPercent > 100
  ) {
    throw new Error('Invalid percentage');
  }

  const operatorAmount =
    (amountMinor * BigInt(operatorPercent)) / 100n;

  const platformAmount =
    amountMinor - operatorAmount;

  return {
    operatorAmount,
    platformAmount
  };
}

