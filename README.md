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

- `ZIPABOX_USER`: The username for the **Zipabox** access.
- `ZIPABOX_PASSWORD`: The password for the **Zipabox** access.
- `ZIPABOX_BLIND_DEVICE_UUID`: The **Zipabox** device UUID for the blind.
- `ZIPABOX_BLIND_ENDPOINT_UUID`: The **Zipabox** endpoint UUID for the blind.
- `ZIPABOX_LIGHT_SENSOR_DEVICE_UUID`: The **Zipabox** device UUID for the light sensor.
- `ZIPABOX_LIGHT_SENSOR_ENDPOINT_UUID`: The **Zipabox** endpoint UUID for the light sensor.

#### SAMI ####

In order to connect to the SAMI API and use the associated devices, you can set the following variables:

- `SAMI_CLIENT_ID`: The client ID for the **SAMI.IO** application.
- `SAMI_CLIENT_SECRET`: The client secret for the **SAMI.IO** application.
- `SAMI_BLIND`: The **SAMI.IO** device ID for the blind. Should instanciate a device type _craft ai blind_ (dtid _dt1b8e051f028f4b95a35452238c3684c4_).
- `SAMI_LIGHT_SENSOR`: The **SAMI.IO** device ID for the light sensor. Should instanciate a device type _craft ai light sensor_ (dtid _dt793c92541dcf4e99a79ded0444244168_).
- `SAMI_TV`: The **SAMI.IO** device ID for the TV. Should instanciate a device type _craft ai tv_ (dtid _dt3fdf857d42f943919d103aa3e0316052_).
- `SAMI_PRESENCE`: The **SAMI.IO** device ID for the indoor positioning system. Should instanciate a device type _craft ai ips_ (dtid _dtff8e26eaa7f04047ace3b5ff542a9696_).
- `SAMI_BULB_0` through `SAMI_BULB_5`: The **SAMI.IO** device ID for the bulbs of the rooms 0 through 5. Should instanciate a device type _craft ai bulb_ (dtid _dt6f3f2abffe33490695515a5ed26efd24_).

Note that your **SAMI.IO** application must have the permissions for reading and writing on each of the device types instantiated by your **SAMI.IO** devices.
If you define `SAMI_CLIENT_ID` and `SAMI_CLIENT_SECRET` in your environment, the application create temporary devices for all devices that do not have an ID set as environment variable. Those temporary devices will be deleted upon server or client termination.

Moreover, you will need to log into your **Samsung** account through the application to grant it the required permissions. Simply go to <http://localhost:4444/sami/auth> once the server is running and sign in.

#### Philips Hue ####

The application can connect to a **Philips Hue** bridge if one (or more) is detected on the network.
The following variables can be used to specify the use of the **Philips Hue** bridge and bulbs:

- `HUE_PREFERRED_BRIDGE`: The ID of the bridge to connect to (in case several bridges are discovered).
- `HUE_BRIDGE_IP`: The IP of the bridge to connected to (in case you want to bypass the bridge discovery).
- `HUE_USER`: The user ID to use on the connected bridge (will create the given user if it does not exist on the bridge).
- `HUE_BULB_0` through `HUE_BULB_5`: The ID of the Hue light bulbs to use for the rooms 0 through 5.

#### LIFX ####

It is possible to enable the connection with **LIFX** light bulbs by setting the environment variable LIFX_TOKEN with a valid **LIFX** developer access token.
You can set the variables 'LIFX_BULB_0' through 'LIFX_BULB_5' to valid **LIFX** light bulb IDs in order to associate those light bulbs to the rooms 0 through 5.

To install dependencies, run

    npm install
    pip install -r requirements.txt

To launch an autoreloading server on <http://localhost:4444>, run

    ./weblifx.py
    npm run dev

To launch a style checking of the code, run

    npm run lint
