const random = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

const pause = (duration: number) => new Promise<void>(res => setTimeout(res, duration));

export const indefinitely = (fn: () => Promise<unknown>, delay = 1000, maxDelay = 10000) =>
  fn().catch(err => {
      console.log(err)
      pause(random(delay/2, delay)).then(
          () => indefinitely(fn, Math.min(delay * 2, maxDelay), maxDelay))
    })
