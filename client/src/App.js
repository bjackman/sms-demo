import React, { Component } from 'react';
import './App.css';
import 'whatwg-fetch';

import Phone from 'react-phone-number-input'
import 'react-phone-number-input/rrui.css';
import 'react-phone-number-input/style.css';

import injectTapEventPlugin from 'react-tap-event-plugin';

import RaisedButton from 'material-ui/RaisedButton';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';

import {isValidNumber, format as formatNumber} from 'libphonenumber-js';

// Needed for material-ui's onTouchTap
// http://stackoverflow.com/a/34015469/988941
injectTapEventPlugin();

const muiTheme = getMuiTheme();

class PhoneSubmitter extends Component {
  constructor(props) {
    super(props);
    this.state = {
      phoneNumber: '',
      country: 'GB'
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

  handleSubmit(event) {
    fetch('/api', {
      method: 'POST',
      body: JSON.stringify(this.state),
      headers: {
        "Content-Type": "application/json"
      }
    }).then((response) => console.log(response));
  }

  render() {
    const countryError = this.state.country !== 'GB' ?
          'Sorry, only United Kingdom phone numbers are supported' : ''

    const buttonText = isValidNumber(this.state.phoneNumber) && !countryError ?
          'Send SMS to ' + formatNumber(this.state.phoneNumber, 'GB', 'International') :
          'Enter valid number to send SMS'
            // This prop doesn't seem to be documented, I found it in the
            // react-phone-number-input source code :|

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
        <RaisedButton disabled={!isValidNumber(this.state.phoneNumber)}
                      value={this.state.phoneNumber}
                      primary="true"
                      onTouchTap={this.handleSubmit}
                      label={buttonText} />
      </div>
    );
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
