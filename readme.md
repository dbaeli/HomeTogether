# Home Together #
## Autonomous Home powered by **craft ai** ##

**HomeTogether** showcases the **craft ai** AI platform in a SmartHome context,
this demo was presented at [CES 2016](http://www.craft.ai/blog/home-together-a-ces-demo/).

> :point_right: This version has been reimplemented using **craft ai** newer learning API!

## Build & Run ##

**HomeTogether** can be used with either fully simulated devices or connecting to real devices:
- [Philips Hue](http://www2.meethue.com) lightbulbs,
- [LiFX](http://www.lifx.com) lightbulb,
- Devices connected to a box using [Zipato](https://www.zipato.com),
- Devices connected through the [Samsung SAMI](https://www.samsungsami.io) cloud platform.

To begin with you'll need to do to the following:
1. Download & install [Node.js v4.X](https://nodejs.org/en/download/);
2. Install dependencies running `npm install`.
3. Create a new `.env` file, it'll be used to define environment variable.
4. In this file, enter the following (replace the values by the one that were provided to you):

        CRAFT_URL=https://craft_ai_learning_url.ai
        CRAFT_TOKEN=abcde.fghij.klmn

### Fully Simulated ###

To launch a fully simulated version of the demo, it's very straightforward:

1. Build using `npm run build`;
2. Run using `npm run start`;
3. Go to <http://localhost:4444>;
4. [Play](#play)!

### Using real devices ###

:construction: :construction: :construction:

## Play ##

1. When the app starts, “Gisele” is wandering around in the home,
2. You can lower the outside’s luminosity using the slider,
3. The light agent turns the light on/off when she enters/leaves a room,
4. If you click on a room, “Marcel” enters the house,
5. You can change his lighting settings for the room his in (this acts as a simulation of the Philips Hue app for example),
6. The light agent learns his preference in each context (luminosity), it is able to automate the lights with no explicit settings!
