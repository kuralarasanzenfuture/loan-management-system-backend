import os from "os";

// export function getLocalIP() {
//   const interfaces = os.networkInterfaces();

//   for (const name in interfaces) {
//     for (const net of interfaces[name]) {
//       if (net.family === "IPv4" && !net.internal) {
//         return net.address;
//       }
//     }
//   }

//   return "localhost";
// }

export function getLocalIP() {
  const interfaces = os.networkInterfaces();

  for (let name in interfaces) {
    if (
      !name.toLowerCase().includes("wi-fi") &&
      !name.toLowerCase().includes("ethernet")
    )
      continue;

    for (let net of interfaces[name]) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "localhost";
}