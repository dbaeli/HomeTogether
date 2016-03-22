export function createLight(name) {
  return {
    name: name,
    type: 'light',
    color: '#ffffff',
    brightness: 0
  };
}

export function createTv(name) {
  return {
    name: name,
    type: 'tv',
    state: false
  };
}

export function createPresenceDetector(name) {
  return {
    name: name,
    type: 'presenceDetector',
    detected: []
  };
}

export function createLightSensor(name) {
  return {
    name: name,
    type: 'lightSensor',
    brightness: 0
  };
}
