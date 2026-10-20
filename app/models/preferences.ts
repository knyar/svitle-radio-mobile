import { Instance, SnapshotOut, types } from "mobx-state-tree"
import { ContactBlockModel } from "./contact-block"
import { StationModel } from "./station"
import i18n from "i18n-js"

type LinkId = "support" | "archive" | "youtube"

export const PreferencesModel = types
  .model("Preferences")
  .props({
    stations: types.array(StationModel),
    contacts: types.array(ContactBlockModel),
    url_support: types.maybe(types.string),
    url_support_i18n: types.maybe(types.map(types.string)),
    url_archive: types.maybe(types.string),
    url_archive_i18n: types.maybe(types.map(types.string)),
    url_youtube: types.maybe(types.string),
    url_youtube_i18n: types.maybe(types.map(types.string)),
  })
  .views((self) => ({
    localizedUrl(id: LinkId) {
      const lang = i18n.t("lang")
      const urls = {
        support: [self.url_support, self.url_support_i18n],
        archive: [self.url_archive, self.url_archive_i18n],
        youtube: [self.url_youtube, self.url_youtube_i18n],
      } as const
      const [fallback, localized] = urls[id]
      if (localized) {
        return localized.get(lang) || fallback
      }
      return fallback
    },
  }))

type PreferencesType = Instance<typeof PreferencesModel>
export interface Preferences extends PreferencesType {}
type PreferencesSnapshotType = SnapshotOut<typeof PreferencesModel>
export interface PreferencesSnapshot extends PreferencesSnapshotType {}
