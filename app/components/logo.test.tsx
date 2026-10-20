import { lookup } from "./logo"
import { LogoId } from "../models/station"

test("lookup does not accept inherited property names", () => {
  const logos: Record<LogoId, string> = {
    svitle: "svitle",
    svetloe: "fallback",
    kids: "kids",
  }

  expect(lookup(logos, "toString")).toBeUndefined()
  expect(lookup(logos, "kids")).toBe("kids")
})
