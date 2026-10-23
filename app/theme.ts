import { FLAVOR, Flavor } from "./config/flavor"

const svetloe = {
  primary: "#2183CC",
  active: "#0C69A3",
  text: "#4E5966",
  textSecondary: "#5F6B78",
  divider: "#D9E3EC",
  menuBackground: "#ffffff",
  menuBackgroundActive: "#E9F3FA",
}

const svitle = {
  primary: "#7c4f96",
  active: "#855b90",
  text: "#4E5966",
  textSecondary: "#665F70",
  divider: "#E2DCE5",
  menuBackground: "#ffffff",
  menuBackgroundActive: "#f5f0f3",
}

const colorsByFlavor: Record<Flavor, typeof svitle> = {
  svitle: svitle,
  svetloe: svetloe,
}

export const colors = colorsByFlavor[FLAVOR]
