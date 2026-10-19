import { nextRefreshDelay } from "./refresh-schedule"

test.each([
  [0, { delay: 5500, refresh: false }],
  [4999, { delay: 5500, refresh: false }],
  [5000, { delay: 7000, refresh: true }],
  [180000, { delay: 7000, refresh: true }],
  [180001, { delay: 5500, refresh: false }],
])("schedules age %s", (age, expected) => {
  expect(nextRefreshDelay(age, 7000, () => 0.5)).toEqual(expected)
})
