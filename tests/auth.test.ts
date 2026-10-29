import { describe, expect, it } from "vitest";
import { buildAuthorizeReply } from "../src/auth.js";

describe("buildAuthorizeReply", () => {
  it("should return an empty object when no attributes are provided", () => {
    const result = buildAuthorizeReply(
        undefined,
        undefined,
        undefined,
        new Date()
    );
    expect(result.result).toBe('reject');
  });

});