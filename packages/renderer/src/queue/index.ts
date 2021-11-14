import PQueue from 'p-queue'
export const wrapingQueue = new PQueue({ concurrency: 1, autoStart: false })
