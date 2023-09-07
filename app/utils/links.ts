import { Linking } from "react-native"

const allLinksInDEV = false

export async function link_supported(url: string|undefined): Promise<boolean> {
  if (!url) {
    return false
  }
  return url.startsWith("https://") ||
         url.startsWith("http://") ||
         await Linking.canOpenURL(url) ||
         (__DEV__ && allLinksInDEV)
}