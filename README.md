# Demo of a Node.js app that interacts by SMS

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

You also need to run `vagrant rsync-auto` in another shell if you want to edit
the files live from your host -_-


