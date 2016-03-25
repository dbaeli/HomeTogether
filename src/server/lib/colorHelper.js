import {convertRGBtoXY,convertXYtoRGB} from 'node-hue-api/hue-api/rgb.js';

let colorConverter = {
  hexToRGB: convertHexToRGB,
  hexToXY: convertHexToXY,
  XYtoHex: convertXYtoHex,
  RGBtoHex: convertRGBtoHex
};

function convertHexToRGB(hex) {
  var intColor = parseInt(hex.split('#')[1], 16);
  return {r: (intColor >> 16) & 254, g: (intColor >> 8) & 254,b: intColor & 254};
}

function convertHexToXY(hex) {
  let rgb = convertHexToRGB(hex);
  return convertRGBtoXY([rgb.r,rgb.g,rgb.b]);
}

function convertRGBtoHex(rgbObj) {
  var rgb = rgbObj.b | (rgbObj.g << 8) | (rgbObj.r << 16);
  return '#' + (0x1000000 + rgb).toString(16).slice(1)
}

function convertXYtoHex(x,y,b) {
  let rgbObj = convertXYtoRGB(x,y,b);
  return convertRGBtoHex(rgbObj);
}

module.exports = colorConverter;