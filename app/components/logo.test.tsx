import * as React from "react"
import { fireEvent, render } from "@testing-library/react-native"
import { Logo, lookup } from "./logo"
import { LogoId, StationModel } from "../models/station"

jest.mock("react-native-svg", () => ({
  SvgUri: (props: Record<string, unknown>) => {
    const mockReact = require("react")
    const MockView = require("react-native").View
    return mockReact.createElement(MockView, { testID: "svg-uri", ...props })
  },
}))

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

const remoteImage = (root: NonNullable<Awaited<ReturnType<typeof render>>["root"]>) =>
  root.queryAll((node) => node.props.source?.uri)[0]

test("uses the station logo key rather than its id", async () => {
  const screen = await render(<Logo station={station("svid", "svitle")} />)
  expect(screen.getByTestId("logo.svitle")).toBeTruthy()
})

test.each(["unknown", "", "   ", " https://x", "ftp://x"])(
  "uses the fallback for the non-remote logo %p",
  async (logo) => {
    const screen = await render(<Logo station={station("unknown", logo)} />)
    expect(screen.getByTestId("logo.svetloe")).toBeTruthy()
  },
)

test("uses the fallback when no station is selected", async () => {
  const screen = await render(<Logo station={null} />)
  expect(screen.getByTestId("logo.svetloe")).toBeTruthy()
})

test("renders a remote raster logo and signals when it loads", async () => {
  const screen = await render(
    <Logo station={station("remote", "https://x/logo.png")} width={220} height={72} />,
  )
  const wrapper = screen.getByTestId("logo.remote")
  const image = remoteImage(screen.root!)

  expect(wrapper.props.style).toEqual([{ width: 220, height: 72 }, undefined])
  expect(image.props.source).toEqual({ uri: "https://x/logo.png" })
  expect(image.props.resizeMode).toBe("contain")
  expect(screen.queryByTestId("logo.remote.loaded")).toBeNull()

  await fireEvent(image, "load")
  expect(screen.getByTestId("logo.remote")).toBeTruthy()
  expect(screen.getByTestId("logo.remote.loaded")).toBeTruthy()
})

test("uses the wordmark aspect ratio when only width is provided", async () => {
  const screen = await render(<Logo station={station("remote", "HTTPS://X/a.PNG")} width={300} />)
  expect(screen.getByTestId("logo.remote").props.style).toEqual([
    { width: 300, aspectRatio: 274 / 126 },
    undefined,
  ])
})

test("uses the default remote-logo box when no dimensions are provided", async () => {
  const screen = await render(<Logo station={station("remote", "https://x/logo.png")} />)
  expect(screen.getByTestId("logo.remote").props.style).toEqual([
    { width: 274, aspectRatio: 274 / 126 },
    undefined,
  ])
})

test("falls back when a remote raster logo fails, keeping the bundled logo's own height", async () => {
  const screen = await render(
    <Logo station={station("remote", "https://x/logo.png")} width={300} />,
  )
  await fireEvent(remoteImage(screen.root!), "error")
  const fallback = screen.getByTestId("logo.svetloe")
  expect(fallback.props.width).toBe(300)
  expect(fallback.props.height).toBeUndefined()
  expect(screen.queryByTestId("logo.remote")).toBeNull()
})

test.each(["https://x/logo.svg", "https://x/logo.svg?x=1"])(
  "renders the remote SVG URL %s",
  async (uri) => {
    const screen = await render(<Logo station={station("remote", uri)} />)
    expect(screen.getByTestId("svg-uri").props.uri).toBe(uri)
  },
)

test("falls back when a loaded remote SVG later errors", async () => {
  const screen = await render(<Logo station={station("remote", "https://x/logo.svg")} />)
  const svg = screen.getByTestId("svg-uri")
  await fireEvent(svg, "load")
  expect(screen.getByTestId("logo.remote.loaded")).toBeTruthy()
  await fireEvent(svg, "error")
  expect(screen.getByTestId("logo.svetloe")).toBeTruthy()
})
