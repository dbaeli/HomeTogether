import { convertRGBtoXY, convertXYtoRGB } from 'node-hue-api/hue-api/rgb.js';

export function convertHexToRGB(hex) {
  var intColor = parseInt(hex.split('#')[1], 16);
  return [(intColor >> 16) & 254, (intColor >> 8) & 254, intColor & 254];
}

export function convertHexToXY(hex) {
  let [red, green, blue] = convertHexToRGB(hex);
  return convertRGBtoXY([red, green, blue]);
}

export function convertRGBtoHex(r, g, b) {
  var intColor = b | (g << 8) | (r << 16);
  return '#' + (0x1000000 + intColor).toString(16).slice(1);
}

export function convertXYtoHex(x, y, b) {
  let [red, green, blue] = convertXYtoRGB(x, y, b);
  return convertRGBtoHex(red, green, blue);
}
