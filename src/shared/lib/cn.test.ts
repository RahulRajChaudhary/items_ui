import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("skips falsy parts", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });
});
