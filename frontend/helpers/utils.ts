import { io, Manager } from "socket.io-client";

function toUpperCaseFirstLetter(text: string) {
  if (!text) {
    return text;
  }

  const letter = text[0].toUpperCase();
  return letter + text.slice(1);
}

function isOpenPort(host: string, port: number) {
  return new Promise((resolve, reject) => {
    const manager = new Manager(`http://${host}:${port}`, { timeout: 100 });
    const socket = manager.socket("/");
    let isResolve = false;

    // Socket connection established, port is open
    socket.on("connect", function () {
      console.log("on connect", host);
      if (!isResolve) {
        isResolve = true;
        resolve(true);
      }

      socket.disconnect();
      socket.close();
    });
    socket.on("connect_error", function () {
      if (!isResolve) {
        isResolve = true;
        resolve(false);
      }

      socket.close();
    });
    socket.on("disconnect", function (exception) {
      if (!isResolve) {
        isResolve = true;
        resolve(false);
      }

      console.log("on disconnect", host);
      socket.close();
    });
  });
}

async function scanServer(port: number):Promise<string | null> {
  const LAN = "192.168.1"; //Local area network to scan (this is rough)

  //scan over a range of IP addresses and execute a function each time the LLRP port is shown to be open.
  for (let i = 255; i >= 1; i--) {
    const ip = `${LAN}.${i}`;
    const isOpen = await isOpenPort(ip, port);
    if (isOpen) {
      return ip;
    }
  }
  return null;
}

export const utils = {
  toUpperCaseFirstLetter,
  scanServer,
};
