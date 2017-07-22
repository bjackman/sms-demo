import React, { Component } from 'react';
import './App.css';
import 'whatwg-fetch';

import Phone from 'react-phone-number-input'
import 'react-phone-number-input/rrui.css';
import 'react-phone-number-input/style.css';

import {isValidNumber} from 'libphonenumber-js';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      phoneNumber: ''
    }
  }

  handleChange(value) {
    this.setState({phoneNumber: value});
    console.log(isValidNumber(value));
  }

  render() {
    return (
      <div className="App">
        <div className="Phone-container">
          <Phone
            country='GB'
            placeholder="Enter phone number"
            value={this.state.phoneNumber}
            onChange={value => this.handleChange(value)} />
        </div>
        <p className="output">
          You entered {this.state.phoneNumber}
        </p>
      </div>
    );
  }
}

export default App;
