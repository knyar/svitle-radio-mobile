import { Instance, SnapshotOut, types } from "mobx-state-tree"
import { ContactBlockModel } from "./contact-block"
import { StationModel } from "./station"
import i18n from "i18n-js"

/**
 * Model description here for TypeScript hints.
 */
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
  .views(self => ({
    localizedUrl(id: string): string {
      const lang = i18n.t("lang")
      const pref_key = "url_" + id + "_i18n"
      const fallback = self["url_" + id]
      if (self[pref_key]) {
        return self[pref_key].get(lang) || fallback
      }
      return fallback
    },
  })) // eslint-disable-line @typescript-eslint/no-unused-vars
  .actions(self => ({})) // eslint-disable-line @typescript-eslint/no-unused-vars

  /**
  * Un-comment the following to omit model attributes from your snapshots (and from async storage).
  * Useful for sensitive data like passwords, or transitive state like whether a modal is open.

  * Note that you'll need to import `omit` from ramda, which is already included in the project!
  *  .postProcessSnapshot(omit(["password", "socialSecurityNumber", "creditCardNumber"]))
  */

type PreferencesType = Instance<typeof PreferencesModel>
export interface Preferences extends PreferencesType {}
type PreferencesSnapshotType = SnapshotOut<typeof PreferencesModel>
export interface PreferencesSnapshot extends PreferencesSnapshotType {}
