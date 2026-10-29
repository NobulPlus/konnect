import type{
    Kit,
    Plan,
    Subscription,
    RadiusAttrs,
} from './types.js';

export type AuthDecision =
  | { result: 'accept'; reply: RadiusAttrs }
  | { result: 'reject'; reason: string };

export function buildAuthorizeReply(
  kit: Kit | undefined,
  sub: Subscription | undefined,
  plan: Plan | undefined,
  now: Date,
  interimSeconds = 300,
): AuthDecision {
  
    //Step 1: Check if kit is valid
    if(!kit){
        return {
            result: 'reject',
            reason: 'Invalid kit or Invalid WIFI'
        };
    }
    if(!sub){
        return {
            result: 'reject',
            reason: 'No active subscription available for this kit'
        };
    }
    if(!plan){
        return {
            result: 'reject',
            reason: 'No plan associated with this subscription'
        };
    }
    if(sub.revoked){
        return {
            result: 'reject',
            reason: 'Subscription has been revoked'
        };
    }
    if(sub.expiresAt < now){
        return {
            result: 'reject',
            reason: 'Subscription has expired'
        };
    }
    if(sub.startsAt > now){
        return {
            result: 'reject',
            reason: 'Subscription has not started yet'
        };
    }   
    if(sub.bytesUsed >= (plan.dataCapBytes ?? BigInt(0))){
        return {
            result: 'reject',
            reason: 'Data cap exceeded'
        };
    }
    if(sub.expiresAt < now){
        return {
            result: 'reject',
            reason: 'Subscription has expired'
        };
    }
    if(plan.dataCapBytes !== undefined && sub.bytesUsed >= plan.dataCapBytes){
        return {
            result: 'reject',
            reason: 'Data cap exceeded'
        };
    }

    const remainingTimeSeconds = Math.ceil((sub.expiresAt.getTime() - now.getTime()) / 1000);
    

    const reply: RadiusAttrs = {
        'Session-Timeout': Math.floor((sub.expiresAt.getTime() - now.getTime()) / 1000),
        'Idle-Timeout': interimSeconds,
        'WISPr-Bandwidth-Max-Up': plan.upKbps,
        'WISPr-Bandwidth-Max-Down': plan.downKbps,
    };

    switch (kit.nasType) {
        case 'mikrotik':
            reply['Mikrotik-Rate-Limit'] = `${plan.downKbps}k/${plan.upKbps}k`;
            break;
        case 'chilli':
            reply['ChilliSpot-Max-Total-Octets'] = plan.dataCapBytes?.toString() ?? '0';
            break;
        case 'omada':
            break;
        default:
        return {
                result: 'reject',
                reason: `Unsupported NAS type: ${kit.nasType}`
            };
    }

    return {
        result: 'accept',
        reply,
    };
}
