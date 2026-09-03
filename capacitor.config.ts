import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.tradevault.journal',
  appName: 'TradeVault',
  webDir: 'dist',
  // No server.url is set on purpose: the app must load from local
  // bundled assets only and never reach out to a remote host.
  android: {
    allowMixedContent: false
  }
}

export default config
