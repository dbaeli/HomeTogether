export function createLight(color, brightness) {
  return {
    type: 'light',
    color: color || '#ffffff',
    brightness: brightness || 0
  };
}

export function createTv(state) {
  return {
    type: 'tv',
    state: state || false
  };
}

export function createPresenceDetector(detected) {
  return {
    type: 'presenceDetector',
    detected: detected || []
  };
}

export function createLightSensor(intensity) {
  return {
    type: 'lightSensor',
    intensity: intensity || 0
  };
}
