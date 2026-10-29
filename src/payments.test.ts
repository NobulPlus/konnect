import { describe, it, expect } from "vitest";
import { createMac, timingSafeEqual } from "node:crypto";
import { verifyWebhook, splitAmount } from "./payments.js";

describe('Payment webhook verification', () => {
    const secret = 'mysecret';
    const body = 