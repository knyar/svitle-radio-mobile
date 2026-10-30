export const isRemoteLogo = (logo: string): boolean => /^https?:\/\//i.test(logo)

export const isSvgUrl = (url: string): boolean => /\.svg$/i.test(url.split(/[?#]/, 1)[0])
