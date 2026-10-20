import { Linking } from "react-native"
import { renderHook, waitFor } from "@testing-library/react-native"
import { useLinkSupported } from "./use-link-supported"

test("reports web URLs as supported", async () => {
  const { result } = await renderHook(() => useLinkSupported("https://example.com"))

  await waitFor(() => expect(result.current).toBe(true))
})

test("reports an unsupported custom scheme as unsupported", async () => {
  ;(Linking.canOpenURL as jest.Mock).mockResolvedValue(false)

  const { result } = await renderHook(() => useLinkSupported("unknown:value"))

  await waitFor(() => expect(Linking.canOpenURL).toHaveBeenCalledWith("unknown:value"))
  expect(result.current).toBe(false)
})

test("re-evaluates support when the URL changes", async () => {
  ;(Linking.canOpenURL as jest.Mock).mockResolvedValue(false)
  const { result, rerender } = await renderHook(
    ({ url }: { url?: string }) => useLinkSupported(url),
    { initialProps: { url: "unknown:value" } },
  )
  await waitFor(() => expect(Linking.canOpenURL).toHaveBeenCalledWith("unknown:value"))

  await rerender({ url: "https://example.com" })

  await waitFor(() => expect(result.current).toBe(true))
})
