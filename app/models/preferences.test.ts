import i18n from "i18n-js"
import { PreferencesModel } from "./preferences"

test("localizedUrl maps every link id to its localized URL", () => {
  const lang = i18n.t("lang")
  const preferences = PreferencesModel.create({
    url_support: "fallback",
    url_support_i18n: { [lang]: "localized" },
    url_archive: "archive fallback",
    url_archive_i18n: { [lang]: "archive localized" },
    url_youtube: "youtube fallback",
    url_youtube_i18n: { [lang]: "youtube localized" },
  })
  expect(preferences.localizedUrl("support")).toBe("localized")
  expect(preferences.localizedUrl("archive")).toBe("archive localized")
  expect(preferences.localizedUrl("youtube")).toBe("youtube localized")
})

test("localizedUrl maps every link id to its plain URL without a localized match", () => {
  const preferences = PreferencesModel.create({
    url_support: "fallback",
    url_archive: "archive fallback",
    url_youtube: "youtube fallback",
  })
  expect(preferences.localizedUrl("support")).toBe("fallback")
  expect(preferences.localizedUrl("archive")).toBe("archive fallback")
  expect(preferences.localizedUrl("youtube")).toBe("youtube fallback")
})

test("localizedUrl returns undefined for every missing link id", () => {
  const preferences = PreferencesModel.create({})
  expect(preferences.localizedUrl("support")).toBeUndefined()
  expect(preferences.localizedUrl("archive")).toBeUndefined()
  expect(preferences.localizedUrl("youtube")).toBeUndefined()
})
