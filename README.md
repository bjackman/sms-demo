# Demo of a Node.js app that interacts by SMS

## Approach

### Tech

Server: Node.js + Express because I'm _somewhat_ familiar with it and it seems
to be becoming one of the industry standards.

Client: Using React because I want to see what all the hype is about

Platform: Have used Apache OpenShift before, I think it would have been suitable
but wanted to get broader experience by trying something else. Glanced at AWS -
Lambda seemed too high-level, a raw EC2 instance seemed too low-level. Chose
Google App Engine. Likely I didn't fully understand the AWS usage model.

### Learning Resources

For how to use React:

https://facebook.github.io/react/tutorial/tutorial.html

For how to structure & deploy the project wrt. server/client code:

https://www.fullstackreact.com/articles/using-create-react-app-with-a-server/

### Other things that were used

- [Twilio](https://www.twilio.com/) for SMS.
- [react-phone-number-input](https://github.com/catamphetamine/react-phone-number-input)
  and by extension
  [libphonenumber-js](https://github.com/catamphetamine/libphonenumber-js) for
  handling phone numbers.
- [material-ui](http://www.material-ui.com) just for a pretty button and loading
  spinner.

## Running it

You'll need a Twilio account, and if you want to deploy, a Google App Engine
account.

First create `secrets.inc` in the root dir - this is a shell script that gets
included before the app is started. Put this in there:

    export TWILIO_ACCOUNT_SID=<Twilio SID>
    export TWILIO_AUTH_TOKEN=<Twilio token>
    export TWILIO_SOURCE_NUMBER=<Twilio phone number>

Then set up the `gcloud` SDK tool. This is needed for deployment and also to
make the storage engine Just Work. You can configure this to work with a local
dummy storage engine, in which case you can skip the `gcloud` set up, but I
haven't tried it.

Then,

- `vagrant up`
- `vagrant ssh`
- `cd /vagrant`
- `npm install`
- `(cd client; npm install)`

To run locally, `npm start`. This:

- Starts the server on one port
- On another port, starts a webpack server which serves (and live-updates) the
  client while proxying back-end API requests to the server port.

You can also start the separately with 'npm run server' in one shell and '(cd
client; npm start)' in another.

To deploy it to App Engine (takes 10/15 mins):

- Compile the React App into a prod version with `(cd client; npm run build)`
- `npm run deploy`

## Design

The front-end is a single-page app implemented as a big state machine. It starts
by getting a Google auth token. Next it provides a phone-number input field
which, when submitted, makes a registration request to the back-end API.

The back-end is a "Rest API" (?) with a single endoint,
/api/registerPhoneNumber. When you POST that endpoint with a body like
`{phoneNumber: foo, googleIdToken: bar}`, the google ID token (which should be a
standard JWT) is validated and a confirmation text is sent to `foo`. All the
other details than the phone number (like the locale) are hard-coded.

## TODOs

Things I've cut corners on:

- No error handling. Just assumes everything will work.

- No SSL :|

- The UI layout is obviously incomplete. I guess it would really be used as a
  component in a site-wide template (with navbars etc) so maybe that's fine...

- Sends SMS from a single fixed number. This won't scale. Should either use
  Twilio's availableNumbers API directly, or a queueing service like Copilot, to
  diversify source numbers.

- Having API keys in a `secrets.inc` file seems dodgy, and then injecting them
  into the process environment seems even dodgier. Probably the PaaS should have
  some mechanism for doing this more safely.

- I'm using VirtualBox via Vagrant, and VB's shared folder filesystem (vboxsfs)
  doesn't support inotify, so webpack's watch mechanism doesn't work. So you
  need to configure webpack to poll the filesystem. But react-scripts (provided
  by create-react-app) don't have a way to configure that, so I did 'npm eject'
  to allow me to tweak webpack. That means I won't easily get updates to
  react-scripts stuff. Maybe this doesn't matter.

- Ignoring a webpack warning apparently caused by libphonenumber-js using a
  deprecated JSON loader.
