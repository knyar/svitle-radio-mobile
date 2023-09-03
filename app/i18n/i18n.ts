import * as RNLocalize from "react-native-localize"
import i18n from "i18n-js"

const uk = require("./uk")
const ru = require("./ru")

i18n.fallbacks = true
i18n.translations = { uk, ru }

const fallback = { languageTag: "uk", isRTL: false }

const { languageTag } =
  RNLocalize.findBestLanguageTag(Object.keys(i18n.translations)) || fallback
i18n.locale = languageTag