import React, { Component } from 'react';
import './App.css';
import 'whatwg-fetch';

import Phone from 'react-phone-number-input'
import 'react-phone-number-input/rrui.css';
import 'react-phone-number-input/style.css';

import {isValidNumber, format as formatNumber} from 'libphonenumber-js';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      phoneNumber: '',
      country: 'GB'
    }
  }

  handleChange(value) {
    this.setState({phoneNumber: value});
  }

  handleCountryChange(value) {
    this.setState({country: value});
  }

  render() {
    const countryError = this.state.country != 'GB' ?
          'Sorry, only United Kingdom phone numbers are supported' : ''

    const buttonText = isValidNumber(this.state.phoneNumber) && !countryError ?
          'Send SMS to ' + formatNumber(this.state.phoneNumber, 'GB', 'International') :
          'Enter valid number to send SMS'

    return (
      <div className="App">
        <div className="Phone-container">
          <Phone
            country={this.state.country}
            placeholder="Enter phone number"
            value={this.state.phoneNumber}
            onChange={value => this.handleChange(value)}
            onCountryChange={value => this.handleCountryChange(value)}
          />
        </div>
        <div className="country-error">
          <p> {countryError} </p>
        </div>
        <button disabled={!isValidNumber(this.state.phoneNumber)}>
          {buttonText}
        </button>
      </div>
    );
  }
}

export default App;
