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
      phoneNumber: '+447402103030', // TODO remove this!
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
      <div className="App">
        <form action="#" onSubmit={this.handleSubmit}>
          <Phone
            country={this.state.country}
            placeholder="Enter phone number"
            value={this.state.phoneNumber}
            onChange={value => this.handleChangeNumber(value)}
            onCountryChange={value => this.handleChangeCountry(value)} />
          <div className="country-error">
            <p> {countryError} </p>
          </div>
          <button disabled={!isValidNumber(this.state.phoneNumber)}
                  value={this.state.phoneNumber}>
            {buttonText}
          </button>
        </form>
      </div>
    );
  }
}

export default App;
