import type { RedlineBridgeApi } from '../../../shared/contracts'

declare global {
  interface Window {
    redlineBridge: RedlineBridgeApi
  }
}

export {}
