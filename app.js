'use strict';

const express = require('express');
const twilio = require('twilio');
const bodyParser = require('body-parser');

const app = express();

// Only supprt UK phone numbers at the moment
const LOCALE = 'GB';

// If we don't have the env vars we need, crash now instead of later.
if (!process.env.TWILIO_SOURCE_NUMBER)
    throw 'TWILIO_SOURCE_NUMBER not defined in environment'

console.log('Setting up Twilio client.');
const twilioClient = new twilio(
  process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN
);
console.log('Twilio client setup done.');

function sendSms(number, body, callback) {
  twilioClient.messages.create({
    to: number,
    // TODO: Using a fixed source number won't scale, because apparently if
    // too many texts come from a single number, carriers will filter them.
    // https://www.twilio.com/docs/api/rest/sending-messages-copilot
    from: process.env.TWILIO_SOURCE_NUMBER,
    body: body
  }).then((result) => callback(result));
}

app.use(bodyParser.json());

// In dev the client is compiled and served by webpack-dev-server. In prod, it's
// served by Express.
if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"));
}

app.post('/api/registerPhoneNumber', (req, res) => {
  console.log('request!');
  const params = req.body;
  const msg = 'Thanks for subscribing to cat facts!'

  sendSms(params.phoneNumber, msg, (result) => {
    console.log(result);
    res.status(200).send(result.sid).end();
  });

});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
