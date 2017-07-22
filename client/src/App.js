import React, { Component } from 'react';
import './App.css';
import 'whatwg-fetch';

import Phone from 'react-phone-number-input'
import 'react-phone-number-input/rrui.css';
import 'react-phone-number-input/style.css';

import injectTapEventPlugin from 'react-tap-event-plugin';

import RaisedButton from 'material-ui/RaisedButton';
import CircularProgress from 'material-ui/CircularProgress';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';

import {isValidNumber, format as formatNumber} from 'libphonenumber-js';

// Needed for material-ui's onTouchTap
// http://stackoverflow.com/a/34015469/988941
injectTapEventPlugin();

const muiTheme = getMuiTheme();

// Pseudo-enum used for a state machine in the PhoneSubmitter component
const machineStates = {
  NEED_NUMBER: 0,               // Waiting for user to give valid number
  REGISTRATION_REQUESTED: 1,    // Waiting for response from backend
  REGISTRATION_SUCCESSFUL: 2    // Finished
};

class PhoneSubmitter extends Component {
  constructor(props) {

    super(props);

    this.state = {
      phoneNumber: '',
      country: 'GB',
      machineState: machineStates.NEED_NUMBER
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
      body: JSON.stringify(this.state),
      headers: {
        "Content-Type": "application/json"
      }
    }).then((response) => {
      console.log(response);
      this.setState({machineState: machineStates.REGISTRATION_SUCCESSFUL});
    });
    this.setState({machineState: machineStates.REGISTRATION_REQUESTED});
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
    case machineStates.NEED_NUMBER:
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
    case machineStates.REGISTRATION_REQUESTED:
      return (
        <div className="PhoneSubmitter">
          <CircularProgress />
        </div>
      );
    case machineStates.REGISTRATION_SUCCESSFUL:
      return (
        <div className="PhoneSubmitter">
          <p>DONE</p>
        </div>
      );
    default: return; // Probably can't be salvaged if we got here..
    }
  }
}

function App(props) {
  return (
    <MuiThemeProvider muiTheme={muiTheme}>
      <div className="App">
        <PhoneSubmitter />
      </div>
    </MuiThemeProvider>
  );
}

export default App;
