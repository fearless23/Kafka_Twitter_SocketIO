# TWITTER LIVE STREAMING APIWITH KAFKA & SOCKETIO

[![Netlify Status](https://api.netlify.com/api/v1/badges/cd322eff-74ef-440b-8ede-991dcf80d88e/deploy-status)](https://app.netlify.com/sites/kafka-twiiter-socket/deploys)

### [FRONTEND ON NETLIFY](https://kafka-twiiter-socket.netlify.app/)

## Project structure

- **`docker_kafka_zookeeper`**: It contains various docker-compose files for different doker images of kafka, zookeeper like bitnami, latest and other versions. Choose one based on liking.

  > Use `docker-compoe up -d` command to run kafka locally or cloud, but requires a machine with atleast 2GB RAM

  > Adjust docker-compose to use authentication method, currently it require no login/password. Adjust the code accordingly in `src/config/kafka.config.js` and your env variables.

* **`FrontEnd`**: Vanilla Javascript `index.html` with

  - `socket-io` client;
  - `bulma` and `Font Awesome` for styling
  - Simple DOM manuplation with vanilla JS

  > Deploy `FrontEnd` directory to Netlify with no build command

- **`src`**: Folder contains

  - `socket.io` server
  - `node-rdkafka` for kafka producer ,consumer apis. Also converted rdkafka wrapping into promises and observables.
  - `twit` npm package for twitter live streaming api,
  - `rxjs` for easing working with kafka streams, only used subject

  > Can be deployed on Heroku with git push (add feature affinity for sticky session socket.io)> Can be deployed with docker along with kafka and zookeeper.

- **`env`**: Locally, I have used `dotenv npm` package to use .env file. Then, added those variables on heroku. Look for .env.sample file to know which variables are required.

### NPM Scripts:

- **`start`**: For Cloud, start socket-io server.
- **`start:local`**: Uses dotenv to load .env, alternatively you can use vscode launch/debug and pass `.env` file path. Look for `launch.json` in .vscode folder
