# Home Together #
## Autonomous Home powered by **craft ai** ##

### Local development ###

The following environment variables are required, for example in a `.env` file at the root

- `CRAFT_PROJECT_OWNER`: The **craft ai** project owner, e.g. _craft-ai_.
- `CRAFT_PROJECT_NAME`: The **craft ai** project name, e.g. _HomeTogether_.
- `CRAFT_PROJECT_VERSION`: The **craft ai** project name, e.g. _master_.
- `CRAFT_APP_ID`: The **craft ai** project application id.
- `CRAFT_APP_SECRET`: The **craft ai** project application secret.
- `LI_MIN`: The minimum light intensity value (depends on your webcam).
- `LI_NIGHT_MAX`: The maximum 'night' intensity value (depends on your webcam).
- `LI_DAY_MIN`: The minimum 'day' intensity value (depends on your webcam).
- `LI_MAX`: The maximum light intensity value (depends on your webcam).
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

To install dependencies, run

    npm install
    pip install -r requirements.txt

To launch an autoreloading server on <http://localhost:4444>, run

    ./weblifx.py
    npm run dev

To launch a style checking of the code, run

    npm run lint
