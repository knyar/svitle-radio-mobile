import { FLAVOR, Flavor } from "./config/flavor"

const svetloe = {
  primary: "#2183CC",
  active: "#0C69A3",
  text: "#4E5966",
  textSecondary: "#6B7480",
  divider: "#E3E3E3",
  menuBackground: "#ffffff",
  menuBackgroundActive: "#E9F3FA",
}

const svitle = {
  primary: "#7c4f96",
  active: "#855b90",
  text: "#4E5966",
  textSecondary: "#6B7480",
  divider: "#E3E3E3",
  menuBackground: "#ffffff",
  menuBackgroundActive: "#f5f0f3",
}

const colorsByFlavor: Record<Flavor, typeof svitle> = {
  svitle: svitle,
  svetloe: svetloe,
}

export const colors = colorsByFlavor[FLAVOR]
