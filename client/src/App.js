import React, { Component } from 'react';
import './App.css';
import 'whatwg-fetch';

import Phone from 'react-phone-number-input'
import 'react-phone-number-input/rrui.css';
import 'react-phone-number-input/style.css';

import {isValidNumber, format as formatNumber} from 'libphonenumber-js';


import RaisedButton from 'material-ui/RaisedButton';
import CircularProgress from 'material-ui/CircularProgress';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import injectTapEventPlugin from 'react-tap-event-plugin';

import GoogleLogin from 'react-google-login';

// Needed for material-ui's onTouchTap
// http://stackoverflow.com/a/34015469/988941
injectTapEventPlugin();

const muiTheme = getMuiTheme();

// Pseudo-enum used for a state machine in the PhoneSubmitter component
const submitterStates = {
  NEED_NUMBER: 0,               // Waiting for user to give valid number
  REGISTRATION_REQUESTED: 1,    // Waiting for response from backend
  REGISTRATION_SUCCESSFUL: 2    // Finished
};

// AFAICT it's OK to hard-code this in the client
const GOOGLE_CLIENT_ID="28748073213-ue32s6jvqdctoks3pib0gpitd9sjumgi.apps.googleusercontent.com"

// Component to read a phone number from the user and send it to the back-end.
// Required props:
//   {googleUser: <GoogleUser object returned by GoogleLogin component>}
class PhoneSubmitter extends Component {
  constructor(props) {

    super(props);

    // TODO: Validate props? react-prop-schema?

    this.state = {
      phoneNumber: '',
      country: 'GB',
      machineState: submitterStates.NEED_NUMBER
    }

    this.handleChangeNumber = this.handleChangeNumber.bind(this);
    this.handleChangeCountry = this.handleChangeCountry.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChangeNumber(value) {
    this.setState({phoneNumber: value});
  }

  handleChangeCountry(value) {
    this.setState({country: value});
  }

  // Callback for when the submit button is pressed.
  // Sends reg request to backend and throws up a loading spinner, then clears
  // the UI once we get a response from the backend.
  handleSubmit(event) {
    fetch('/api/registerPhoneNumber', {
      method: 'POST',
      body: JSON.stringify({
        googleIdToken: this.props.googleUser.tokenId,
        phoneNumber: this.state.phoneNumber
      }),
      headers: {
        "Content-Type": "application/json"
      }
    }).then((response) => {
      console.log(response);
      // TODO: Check response.ok!
      this.setState({machineState: submitterStates.REGISTRATION_SUCCESSFUL});
      if (this.props.onCompleted)
        this.props.onCompleted();
    });
    this.setState({machineState: submitterStates.REGISTRATION_REQUESTED});
  }

  render() {
    // We're using an international phone number component because when this
    // Killer App is launched we'll want international support from the get-go,
    // but for now our Twilio account only services UK numbers.
    const countryError = this.state.country !== 'GB' ?
          'Sorry, only United Kingdom phone numbers are currently supported' : ''

    // We're gona disable the submit button until we've got a valid phone number.
    // Also change the button label.
    const readyToSend = isValidNumber(this.state.phoneNumber) && !countryError;
    const buttonText =  readyToSend ?
          'Send SMS to ' + formatNumber(this.state.phoneNumber, 'GB', 'National') :
          'Enter valid number to send SMS'

    // We render totally different things depending on our state machine.
    // Either a phone number input form, a loading spinner or a success message.
    // TODO: Would a proper React approach be to have three separate components?
    //       Does it matter?
    // NB: the onCountryChange prop below doesn't seem to be documented, but I
    // found it in the source code for the component :/
    switch (this.state.machineState) {
    case submitterStates.NEED_NUMBER:
      return (
        <div className="PhoneSubmitter">
          <Phone
            country={this.state.country}
            placeholder="Enter phone number"
            value={this.state.phoneNumber}
            onChange={value => this.handleChangeNumber(value)}
            onCountryChange={value => this.handleChangeCountry(value)} />
          <div className="country-error">
            <p> {countryError} </p>
          </div>
          <RaisedButton disabled={!readyToSend}
                        value={this.state.phoneNumber}
                        primary={true}
                        onTouchTap={this.handleSubmit}
                        label={buttonText} />
        </div>
      );
    case submitterStates.REGISTRATION_REQUESTED:
      return (
        <div className="PhoneSubmitter">
          <CircularProgress />
        </div>
      );
    case submitterStates.REGISTRATION_SUCCESSFUL:
      return (
        <div className="PhoneSubmitter">
          <p>DONE</p>
        </div>
      );
    default: return; // Probably can't be salvaged if we got here..
    }
  }
}

// State machine states for the overall app
const appStates = {
  NO_USER: 0,       // Haven't authed with Google yet
  FETCHING_USER: 1, // Waiting for CatFacts user
  NEED_REGISTER: 2, // Have Google auth but no CatFacts number
  READY: 3          // Ready to rumble, it's cat fact time
};

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      machineState: appStates.NO_USER,
      googleUser: null,
      catFactsUser: null
    };

    this.handleGoogleSuccess = this.handleGoogleSuccess.bind(this);
    this.handleGoogleFailure = this.handleGoogleFailure.bind(this);
    this.handleSendFact = this.handleSendFact.bind(this);
    this.fetchCatFactsUser = this.fetchCatFactsUser.bind(this);
  }

  handleGoogleFailure(response) {
    // TODO: Should figure out whether this failed for a reason the user knows
    // about (in which case we can just do nothing), or whether we need to
    // display an error message.
    console.log('Failed to log in with Google');
    console.log(response);
  }

  // Callback for when we've auth'd via Google.
  // Send the token to the back-end to find out if this user was already
  // registered.
  handleGoogleSuccess(googleUser) {
    this.setState({googleUser: googleUser});
    this.fetchCatFactsUser();
  }

  // This is what it's all about, baby. Pure, unadulterated cat fact madness.
  handleSendFact() {
    if (!this.state.catFactsUser) {
      console.log('Got handleSendFact too early');
      return;
    }

    fetch('/api/sendFact', {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + this.state.googleUser.tokenId
      }
    }).then((response) => {
      if (response.ok)
        console.log('sent a fact');
      else
        console.log(response);
    });
  }

  // Use the /api/me endpoint to see if we have a user associated with the
  // Auth'd google user. If we do, set the state to READY (so we can get
  // straight down to busines), if not set it to NEED_REGISTER so the user can
  // enter there phone number.
  fetchCatFactsUser() {
    this.setState({machineState: appStates.FETCHING_USER});
    fetch('/api/me', {
      method: 'GET',
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + this.state.googleUser.tokenId
      }
    }).then((response) => {
      response.text().then((text) => {
        console.log(response);
        if (response.ok)
          this.setState({
            catFactsUser: JSON.parse(text),
            machineState: appStates.READY
          });
        else
          this.setState({machineState: appStates.NEED_REGISTER});
      })
    });
  }

  // Set tab title
  componentDidMount() {
    console.log('mount');
    document.title = 'Cat Facts!';
  }

  render() {
    let component;

    switch (this.state.machineState) {
    case appStates.NO_USER:
      component = (
        <div className='request-google-auth'>
          <p>Login with Google to start using Cat Facts!</p>
          <GoogleLogin
              clientId={GOOGLE_CLIENT_ID}
              buttonText="Login with Google"
              onSuccess={this.handleGoogleSuccess}
              onFailure={this.handleGoogleFailure} />
        </div>
      );
      break;
    case appStates.FETCHING_USER:
      component = (
        <div>
          <p>Fetching user info from server</p>
          <CircularProgress />
        </div>
      );
      break;
    case appStates.NEED_REGISTER:
      component = (
          <div className='register-user'>
            <p>Enter your phone number to register for Cat Facts!</p>
              <PhoneSubmitter googleUser={this.state.googleUser}
                              onCompleted={this.fetchCatFactsUser}/>
          </div>
      );
      break;
    case appStates.READY:
    if (this.state.catFactsUser)
      component = (
        <RaisedButton primary={true}
                      onTouchTap={this.handleSendFact}
                      label='Send me a cat fact!' />
      );
      break;
    default: console.log('Critical error in app render');
    }

    return (
      <MuiThemeProvider muiTheme={muiTheme}>
        <div className="App">
          {component}
        </div>
      </MuiThemeProvider>
    );
  }
}

export default App;
