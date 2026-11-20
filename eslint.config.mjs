import next from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [...next, ...nextTs, { ignores: ["handoff/**", ".next/**", "node_modules/**", "api/**", "assistant/**", "boss-bridge/**", "brand/**", "common/**", "components/**", "constants/**", "dashboard/**", "host/**", "layout/**", "public/**", "theme/**", "types/**", "utils/**"] }];
export default config;
