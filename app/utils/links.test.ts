import { Linking } from "react-native"
import { link_supported } from "./links"

beforeEach(() => jest.spyOn(Linking, "canOpenURL").mockResolvedValue(false))

test.each(["https://example.com", "http://example.com"])("accepts web URL %s", async (url) => {
  expect(await link_supported(url)).toBe(true)
  expect(Linking.canOpenURL).not.toHaveBeenCalled()
})

test("delegates custom schemes", async () => {
  ;(Linking.canOpenURL as jest.Mock).mockResolvedValueOnce(true).mockResolvedValueOnce(false)
  await expect(link_supported("skype:user")).resolves.toBe(true)
  await expect(link_supported("unknown:value")).resolves.toBe(false)
})

test("rejects an absent URL", async () => {
  await expect(link_supported(undefined)).resolves.toBe(false)
})
