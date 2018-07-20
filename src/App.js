import React, { Component } from 'react';
import CurrencyTable from './components/CurrencyTable/CurrencyTable';

class App extends Component {
  render() {
    return (
      <div className="container">
        <CurrencyTable />
      </div>
    )
  }
}

export default App;
