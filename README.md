# Demo of a Node.js app that interacts by SMS

## Approach

### Tech

Server: Node.js + Express because I'm _somewhat_ familiar with it and it seems
to be becoming one of the industry standards.

Client: Using React because I want to see what all the hype is about

Platform: Have used Apache OpenShift before, I think it would have been suitable
but wanted to get broader experience by trying something else. Glanced at AWS -
Lambda seemed too high-level, a raw EC2 instance seemed too low-level. Chose
Google App Engine.

### Learning Resources I used

For how to use React:

https://facebook.github.io/react/tutorial/tutorial.html

For how to structure & deploy the project wrt. server/client code:

https://www.fullstackreact.com/articles/using-create-react-app-with-a-server/

## Running it - locally

First create `secrets.inc` in the root dir - this is a shell script that gets
included before the app is started. Put this in there:

    export TWILIO_ACCOUNT_SID=<Twilio SID
    export TWILIO_AUTH_TOKEN=<Twilio token>
    export TWILIO_SOURCE_NUMBER=<Twilio phone number>

Then,

- vagrant up
- vagrant ssh
- cd /vagrant
- npm install
- npm start


## TODOs

Things I've cut corners on:

- No SSL :|

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
  react-scripts stuff.

- Ignoring a webpack warning apparently caused by libphonenumber-js using a
  deprecated JSON loader.
