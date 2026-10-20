import { indefinitely } from "./retry"

beforeEach(() => {
  jest.useFakeTimers()
  jest.spyOn(Math, "random").mockReturnValue(0)
  jest.spyOn(console, "log").mockImplementation()
})

afterEach(() => {
  jest.clearAllTimers()
  jest.useRealTimers()
})

test("resolves immediately when the operation succeeds", async () => {
  const fn = jest.fn().mockResolvedValue("ok")
  await expect(indefinitely(fn)).resolves.toBe("ok")
  expect(fn).toHaveBeenCalledTimes(1)
})

test("retries after a rejection", async () => {
  const fn = jest.fn().mockRejectedValueOnce(new Error("no")).mockResolvedValueOnce("ok")
  indefinitely(fn)
  await Promise.resolve()
  await jest.advanceTimersByTimeAsync(499)
  expect(fn).toHaveBeenCalledTimes(1)
  await jest.advanceTimersByTimeAsync(1)
  expect(fn).toHaveBeenCalledTimes(2)
})

test("resolves with the value of the eventually successful attempt", async () => {
  const fn = jest.fn().mockRejectedValueOnce(new Error("no")).mockResolvedValueOnce("ok")
  const result = indefinitely(fn)
  await Promise.resolve()
  await jest.advanceTimersByTimeAsync(500)
  await expect(result).resolves.toBe("ok")
})

test("doubles delays and caps them", async () => {
  const fn = jest.fn().mockRejectedValue(new Error("no"))
  indefinitely(fn, 4000, 5000)
  await Promise.resolve()
  await jest.advanceTimersByTimeAsync(1999)
  expect(fn).toHaveBeenCalledTimes(1)
  await jest.advanceTimersByTimeAsync(1)
  expect(fn).toHaveBeenCalledTimes(2)
  await jest.advanceTimersByTimeAsync(2499)
  expect(fn).toHaveBeenCalledTimes(2)
  await jest.advanceTimersByTimeAsync(1)
  expect(fn).toHaveBeenCalledTimes(3)
})
