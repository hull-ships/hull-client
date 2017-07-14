# Hull Browser Personalization

Sends Hull customer data back in the page, so you can use it for personalization, segmentation and ad targeting.

If you want your own instance: [![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy?template=https://github.com/hull-ships/hull-browser)

---

### Using :

[See Readme here](https://dashboard.hullapp.io/readme?url=https://hull-browser.herokuapp.com)

### Developement setup :

```sh
git clone git@github.com:hull-ships/hull-slack.git
cd hull-browser
yarn
npm run ngrok # Serves connector on `https://browser.eu.ngrok.io` - See `package.json` 
npm run start:dev # starts in development mode
npm run build # builds the app
```

### How it works

When a User hits a webpage with the snippet, the snippet will attempt to establish a websocket connection to the connector backend.
If the domain is authorized, we will let it pass. Once this is done, the client searches for a set of identifiers in the page, from Segment.com, Hull and Intercom.
It forwards this to the backend, which subscribes the browser to all valid Identifiers (`ID`, `external ID` and `anonymous IDs`) as socket IO Rooms.

When the user is updated (with Fast lane this should happen in a few seconds), Hull will send an update to the connector,
which in turn will broadcast it to all the Rooms with that user's `ID`, `external ID` and `anonymous IDs`

### Logged events

Here are the events that the Slack connector tracks

- `outgoing.user.fetch.error` - An error happened when a browser asked for info about a user
- `incoming.connection.start` - Started Socket.io connection
- `incoming.connection.error` - Failed establishing connection. see error message
- `incoming.connection.success` - Established connection successfully
- `incoming.user.join-channel` - Joined `channel` (any User ID we have available)
- `outgoing.user.fetch.start` - Started fetching user data from a `Hull ID` (we have one after first succcessful connection)
- `outgoing.user.fetch.success` - Success fetching a user
- `outgoing.user.fetch.error` - Error while searching for a User
- `outgoing.user.start` - We received a User Update, attempt to send it to all rooms
- `outgoing.user.success` - Success in sending the user update to rooms.

# Environment variables

```sh
SECRET="A randomly created secret. Make it long and complex"
REDIS_URL="Redis connection URI"
```

On Heroku, don't forget to setup Session Affinity to have users always hit the same node.
It's not mandatory since we use Redis behind the scenes for a LRU and a Config cache, but it's always cleaner.


https://devcenter.heroku.com/articles/session-affinity
https://socket.io/docs/using-multiple-nodes/
