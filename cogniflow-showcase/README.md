# CogniFlow showcase media

Place the three presentation assets in this directory with these exact names:

- `cf_web_home.png`
- `cf_web_showcase_1.mp4`
- `cf_web_showcase_2.mp4`

Vite serves files from `apps/pitch/public/` at the site root, so the semantic
presentation references them as:

- `/cogniflow-showcase/cf_web_home.png`
- `/cogniflow-showcase/cf_web_showcase_1.mp4`
- `/cogniflow-showcase/cf_web_showcase_2.mp4`

The image is a dedicated slide before the videos. Each video begins only when its
own slide becomes active; leaving the slide pauses and resets it.
