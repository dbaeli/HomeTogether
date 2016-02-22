# Home Together #
## Autonomous Home powered by **craft ai** ##

**HomeTogether** showcases the **craft ai** AI platform in a SmartHome context,
this demo was presented at [CES 2016](http://www.craft.ai/blog/home-together-a-ces-demo/).

For further information, please check the dedicated [blog post](http://www.craft.ai/blog/home-together-hands-on/).

### Local development ###

The following environment variables are required, for example in a `.env` file at the root

- `CRAFT_PROJECT_OWNER`: The **craft ai** project owner, e.g. _craft-ai_.
- `CRAFT_PROJECT_NAME`: The **craft ai** project name, e.g. _HomeTogether_.
- `CRAFT_PROJECT_VERSION`: The **craft ai** project name, e.g. _master_.
- `CRAFT_APP_ID`: The **craft ai** project application id.
- `CRAFT_APP_SECRET`: The **craft ai** project application secret.

#### Zipabox ####

Setting the following variables will enable the connection with the Zipabox API and the associated devices.

- `ZIPABOX_USER`: The username for the _Zipabox_ access.
- `ZIPABOX_PASSWORD`: The password for the _Zipabox_ access.
- `ZIPABOX_BLIND_DEVICE_UUID`: The _Zipabox_ device UUID for the blind.
- `ZIPABOX_BLIND_ENDPOINT_UUID`: The _Zipabox_ endpoint UUID for the blind.
- `ZIPABOX_LIGHT_SOCKET_DEVICE_UUID`: The _Zipabox_ device UUID for the light socket.
- `ZIPABOX_LIGHT_SOCKET_ENDPOINT_UUID`: The _Zipabox_ endpoint UUID for the light socket.
- `ZIPABOX_MOTION_SENSOR_DEVICE_UUID`: The _Zipabox_ device UUID for the motion sensor.
- `ZIPABOX_MOTION_SENSOR_ENDPOINT_UUID`: The _Zipabox_ endpoint UUID for the motion sensor.
- `ZIPABOX_MAG_DETECTOR_DEVICE_UUID`: The _Zipabox_ device UUID for the magnetic detector.
- `ZIPABOX_MAG_DETECTOR_ENDPOINT_UUID`: The _Zipabox_ endpoint UUID for the magnetic detector.
- `ZIPABOX_LIGHT_SENSOR_DEVICE_UUID`: The _Zipabox_ device UUID for the light sensor.
- `ZIPABOX_LIGHT_SENSOR_ENDPOINT_UUID`: The _Zipabox_ endpoint UUID for the light sensor.

#### Philips Hue ####

The application can connect to a Philips Hue bridge if one (or more) is detected on the network.
The following variables can be used to specify the use of the Philips Hue bridge and bulbs:

- `HUE_PREFERRED_BRIDGE`: The ID of the bridge to connect to (in case several bridges are detected).
- `HUE_USER`: The user ID to use on the connected bridge (will create the user if it does not exist on the bridge).
- `HUE_BULB_0` through `HUE_BULB_5`: The ID of the Hue light bulbs to use for the rooms 0 through 5.

#### Lifx ####

It is possible to enable the connection with LiFX light bulbs by setting the environment variable LIFX_TOKEN with a valid lifx developer access token.
You can set the variables 'LIFX_BULB_0' through 'LIFX_BULB_5' to valid lifx light bulb IDs in order to associate those light bulbs to the rooms 0 through 5.

To install dependencies, run

    npm install
    pip install -r requirements.txt

To launch an autoreloading server on <http://localhost:4444>, run

    ./weblifx.py
    npm run dev

To launch a style checking of the code, run

    npm run lint
