const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min)

const pause = (duration: number) => new Promise<void>((res) => setTimeout(res, duration))

export const indefinitely = <T>(fn: () => Promise<T>, delay = 1000, maxDelay = 10000): Promise<T> =>
  fn().catch((err) => {
    console.log(err)
    return pause(random(delay / 2, delay)).then(() =>
      indefinitely(fn, Math.min(delay * 2, maxDelay), maxDelay),
    )
  })
