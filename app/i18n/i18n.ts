import i18n from "i18n-js"
const { I18N_LANGUAGE } = require("../config/flavor")

const ua = require("./ua")
const ru = require("./ru")

i18n.fallbacks = true
i18n.translations = { ua, ru }
i18n.locale = I18N_LANGUAGE