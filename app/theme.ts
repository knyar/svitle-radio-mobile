const { FLAVOR } = require("./config/flavor")

const svetloe = {
  primary: "#2183CC",
  active: "#0C69A3",
  text: "#4E5966",
  menuBackground: "#ffffff",
  menuBackgroundActive: "#E9F3FA",
}

const svitle = {
  primary: "#7c4f96",
  active: "#855b90",
  text: "#4E5966",
  menuBackground: "#ffffff",
  menuBackgroundActive: "#f5f0f3",
}

export const colors = {
  "svitle": svitle,
  "svetloe": svetloe,
}[FLAVOR]