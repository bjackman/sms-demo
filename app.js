'use strict';

const util = require('util');
const express = require('express');
const twilio = require('twilio');
const bodyParser = require('body-parser');
const GoogleAuth = require('google-auth-library');
const Datastore = require('@google-cloud/datastore');
const bearerToken = require('express-bearer-token');

const app = express();

const datastore = Datastore();

/*
 * Twilio stuff
 */

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

/*
 * Google auth stuff
 */

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

/*
 * Data store stuff
 */

// Query the data store for a phone number, call th callback with the phone
// number or null if it wasn't found.
// TODO: Assumes that we haven't messed up the DB by storing two entities
//       with hte same googleUserId.  Presumably the DB tech has a way to make
//       that impossible (use googleUserId a key?). Should do that. Would
//       probably result in a faster index too.
function getUserPhoneNumber(googleUserId, callback) {
  const query = datastore.createQuery('User')
                    .filter('googleUserId', '=', googleUserId);

  console.log('Querying datastore for googleUserId ' + googleUserId);

  datastore.runQuery(query)
    .then((results) => {
      const users = results[0];

      console.log('Query results for googleUserId ' + googleUserId);
      console.log(results)

      if (users && users.length)
        callback(users[0].phoneNumber);
      else
        callback(null)
    })
    .catch((err) => {
      console.error('QUERY ERROR:', err);
    });
}

// Store a new user in the data store. Fire and forget :/
function setUserPhoneNumber(googleUserId, phoneNumber) {
  const key = datastore.key('User');
  const entity = {
    key: key,
    data: [
      {name: 'googleUserId', value: googleUserId},
      {name: 'phoneNumber', value: phoneNumber}
    ]
  };

  // Check that this user isn't already registered.
  // TODO: As mentioned above, can surely just let the DB do this for us.
  getUserPhoneNumber(googleUserId, ((phoneNumber) => {
    if (phoneNumber) {
      console.log(util.format('User [%s] already stored', googleUserId));
    } else {
      console.log(util.format('Storing user [%s] with number [%s]',
                              googleUserId, phoneNumber));

      datastore.save(entity)
        .then(() => {
          console.log(util.format('Successfully stored user [%s] with number [%s]',
                                  googleUserId, phoneNumber));
        })
        .catch((err) => {
          console.error('STORE ERROR:', err);
        });
    }
  }));
}

/*
 * API stuff
 */

app.use(bodyParser.json());
app.use(bearerToken());

// In dev the client is compiled and served by webpack-dev-server. In prod, it's
// served by Express.
if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"));
}

app.post('/api/registerPhoneNumber', (req, res) => {
  var googleIdToken, phoneNumber;

  // TODO: Move ID token to Authorization header instead of body?
  //       Does it matter?

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

  verifyGoogleIdToken(googleIdToken, function(googleUserId) {
    if (!googleUserId)
      res.status(500).send("Couldn't get Google User ID").end();
    else {
      sendSms(phoneNumber, msg, (result) => {
        res.status(200).send(result.sid).end();
      });
      setUserPhoneNumber(googleUserId, phoneNumber);
    }
  });
});

app.get('/api/me', (req, res) => {
  const googleIdToken = req.body.googleIdToken;

  console.log(req.token);

  if (!req.token) {
    res.status(401).send('Need to authorize with Google').end();
    return;
  }

  // TODO: Too many callbacks. Refactor this with a flow control library?
  verifyGoogleIdToken(req.token, function(googleUserId) {
    if (!googleUserId) {
      res.status(500).send("Couldn't get Google User ID").end();
      return;
    } else {
      getUserPhoneNumber(googleUserId, ((phoneNumber) => {
        if (phoneNumber) {
          const user = {googleUserId: googleUserId, phoneNumber: phoneNumber};
          res.status(200).send(JSON.stringify(user)).end();
        } else {
          res.status(404).send('User not found').end();
        }
      }));
    }
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});

/*

  A_A
 (-.-)
  |-|
 /   \
|     |   __
|  || |  |  \__
 \_||_/_/         [http://www.asciiworld.com/-Cats-.html]

*/
