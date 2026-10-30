import { isRemoteLogo, isSvgUrl } from "./logo-source"

test.each(["svitle", "", "   ", " https://x", "ftp://x"])("%p is not a remote logo", (logo) => {
  expect(isRemoteLogo(logo)).toBe(false)
})

test.each(["http://x", "https://x", "HTTPS://X/a.PNG"])("%p is a remote logo", (logo) => {
  expect(isRemoteLogo(logo)).toBe(true)
})

test.each(["https://x/a.svg", "https://x/a.SVG", "https://x/a.svg?v=2", "https://x/a.svg#a"])(
  "%p is an SVG URL",
  (url) => expect(isSvgUrl(url)).toBe(true),
)

test.each(["https://x/a.png", "https://x/a.svg.png"])("%p is not an SVG URL", (url) => {
  expect(isSvgUrl(url)).toBe(false)
})
