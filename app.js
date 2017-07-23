'use strict';

const util = require('util');
const express = require('express');
const twilio = require('twilio');
const bodyParser = require('body-parser');
const GoogleAuth = require('google-auth-library');

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
  console.log('Sending SMS to ' + number)
  twilioClient.messages.create({
    to: number,
    // TODO: Using a fixed source number won't scale, because apparently if
    // too many texts come from a single number, carriers will filter them.
    // https://www.twilio.com/docs/api/rest/sending-messages-copilot
    from: process.env.TWILIO_SOURCE_NUMBER,
    body: body
  }).then((result) => callback(result));
}

console.log('Setting up Google authentication client');
var auth = new GoogleAuth;
const GOOGLE_CLIENT_ID="28748073213-ue32s6jvqdctoks3pib0gpitd9sjumgi.apps.googleusercontent.com"
var googleClient = new auth.OAuth2(GOOGLE_CLIENT_ID, '', '');
console.log('Google authentication client setup done');

// Verify the Google auth JWT, then call callback with the Google user ID as a
// parameter.
function verifyGoogleIdToken(token, callback) {
  googleClient.verifyIdToken(
    token,
    GOOGLE_CLIENT_ID,
    function(e, login) {
      var payload = login.getPayload();
      var userId = payload['sub'];
      // TODO - not going to test this with invalid tokens so not including
      // proper handling of failed validation. Just use the presence of a
      // returned userId as an indication of success.
      callback(userId)
    });
}

app.use(bodyParser.json());

// In dev the client is compiled and served by webpack-dev-server. In prod, it's
// served by Express.
if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"));
}

app.post('/api/registerPhoneNumber', (req, res) => {
  var googleIdToken, phoneNumber;

  // Validate request.
  // If this validation becomes nontrivial, something like
  // object-schma-validation might be helpful.
  ({phoneNumber, googleIdToken} = req.body);
  if (!phoneNumber || !googleIdToken) {
    res.status(400).send('Invalid params').end();
    return;
  }

  console.log(util.format('Number reg request token [%s] number [%s]',
                          googleIdToken, phoneNumber));

  const params = req.body;
  const msg = 'Thanks for subscribing to cat facts!'

  verifyGoogleIdToken(googleIdToken, function(userId) {
    if (!userId)
      res.status(500).send("Couldn't get Google User ID").end();
    else
      sendSms(phoneNumber, msg, (result) => {
        res.status(200).send(result.sid).end();
      });
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
