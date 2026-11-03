const configuredUrl = process.env.REACT_APP_API_URL;
if (!configuredUrl) {
  throw new Error("Missing REACT_APP_API_URL. Configure your own backend in .env.local.");
}
const parsed = new URL(configuredUrl);
const local = ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname);
if ((parsed.protocol !== "https:" && !(local && parsed.protocol === "http:")) ||
    parsed.username || parsed.password || parsed.search || parsed.hash) {
  throw new Error("REACT_APP_API_URL must use HTTPS (HTTP is allowed on localhost), without credentials, query or fragment.");
}
export const apiUrl = configuredUrl.replace(/\/+$/, "");
