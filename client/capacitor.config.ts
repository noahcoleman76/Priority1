import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.colemandev.priority1",
  appName: "Priority1",
  webDir: "dist",
  server: {
    iosScheme: "https"
  }
};

export default config;
