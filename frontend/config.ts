const serverPort = 8080;
const socketPort = 8080;
export const config = {
  hadScanServer: false,
  serverPort,
  socketPort,
  api: "http://localhost:" + serverPort,
  ws: "ws://localhost:" + socketPort,
  isBrowser: typeof window !== "undefined",
};
