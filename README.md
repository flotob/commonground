# Setup

If you just cloned the project:

1) Run `./run.sh build_full` to build and run Common Ground. After the build is complete, the app will be available on `http://localhost:8000`. It will run in PWA mode, so when you rebuild, it will update.

2) You can always update the running backend with `./run.sh update_backend`.

3) If you want to run a local frontend that updates whenever you save changes, you can additionally run `./run.sh start`. This frontend will run on `http://localhost:3000`. Note: You also need to run the backend built with build_full, for the frontend to connect to.

4) If you want to test voice calls locally, you need to run `./run.sh start_https` instead. The frontend will now run on `https://localhost:3000`, and you'll have to ignore the certificate warning.

We will update this readme with more details soon.