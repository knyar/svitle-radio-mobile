import i18n from "i18n-js"
import { PreferencesModel } from "./preferences"

test("localizedUrl prefers the current language and falls back", () => {
  const lang = i18n.t("lang")
  const preferences = PreferencesModel.create({
    url_support: "fallback",
    url_support_i18n: { [lang]: "localized" },
  })
  expect(preferences.localizedUrl("support")).toBe("localized")
  expect(preferences.localizedUrl("archive")).toBeUndefined()
})

test("localizedUrl uses the plain URL without a localized match", () => {
  const preferences = PreferencesModel.create({ url_support: "fallback" })
  expect(preferences.localizedUrl("support")).toBe("fallback")
})
