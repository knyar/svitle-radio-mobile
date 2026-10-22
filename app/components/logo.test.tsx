import * as React from "react"
import { render } from "@testing-library/react-native"
import { Logo, lookup } from "./logo"
import { LogoId, StationModel } from "../models/station"

test("lookup does not accept inherited property names", () => {
  const logos: Record<LogoId, string> = {
    svitle: "svitle",
    svetloe: "fallback",
    kids: "kids",
  }

  expect(lookup(logos, "toString")).toBeUndefined()
  expect(lookup(logos, "kids")).toBe("kids")
})

const station = (id: string, logo: string) =>
  StationModel.create({ id, logo, name: id, lang: "ua" })

test("uses the station logo key rather than its id", async () => {
  const screen = await render(<Logo station={station("svid", "svitle")} />)
  expect(screen.getByTestId("logo.svitle")).toBeTruthy()
})

test("uses the fallback for an unknown logo", async () => {
  const screen = await render(<Logo station={station("unknown", "unknown")} />)
  expect(screen.getByTestId("logo.svetloe")).toBeTruthy()
})

test("uses the fallback when no station is selected", async () => {
  const screen = await render(<Logo station={null} />)
  expect(screen.getByTestId("logo.svetloe")).toBeTruthy()
})
