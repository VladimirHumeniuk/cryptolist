import React, { Component } from 'react';
import axios from 'axios';
import './App.css';
import io from 'socket.io-client';
import { Table } from 'antd';
import NumberFormat from 'react-number-format';

const CRYPTOCOMPARE_API = "https://streamer.cryptocompare.com/";
const COINMARKET_API = "https://api.coinmarketcap.com/v1/ticker/?limit=10";

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      coins: {},
      columns: [{
        title: '',
        dataIndex: 'rank',
        key: 'rank',
        width: '50px'
      },
      {
        title: 'Cryptocurrency',
        key: 'name',
        render: (data) => <span><img src={`assets/coins/${data.symbol}.png`.toLowerCase()} className="coin-logo" alt={data.name}/> {data.name}</span>
      },
      {
        title: 'Symbol',
        dataIndex: 'symbol',
        key: 'symbol'
      },
      {
        title: 'Price',
        dataIndex: 'price_usd',
        key: 'price',
        className: 'price',
        render: (data) => <span>{data}</span>
      },
      {
        title: 'Volume (24h)',
        dataIndex: '24h_volume_usd',
        key: 'volume',
        render: (data) => <NumberFormat value={data} format="$# ### ### ###" displayType={'text'} decimalprecision={0} thousandseparator='true' />
      },
      {
        title: 'Change (24h)',
        dataIndex: 'percent_change_24h',
        key: 'change',
        className: 'change',
        render: (data) => <NumberFormat value={data} displayType={'text'} className={data < 0 ? 'text-red' : 'text-green'} suffix={'%'} />
      }]
    };
  }

  getAllCoins = () => {
    axios.get(COINMARKET_API).then((response) => {
      if (response.status === 200) {

        let coins = {}

        console.log(response)

        response.data.map((coin) => {
          coins[coin.symbol] = coin;
          return null
        })

        this.setState({coins: coins})
        this.subscribeCryptoStream()
      }
    })
  }

  subscribeCryptoStream = () => {
    let subs = [];
    let cryptoIO = io.connect(CRYPTOCOMPARE_API);

    Object.keys(this.state.coins).map((key) => {
      subs.push(`5~CCCAGG~${key}~USD`)
      return null
    })

    cryptoIO.emit("SubAdd", { "subs": subs })
    cryptoIO.on("m", (message) => {
      this.updateCoin(message)
    })
  }

  updateCoin = (message) => {
    message = message.split("~")
    let coins = Object.assign({}, this.state.coins)

    if ((message[4] === "1") || (message[4] === "2")) {

      if (message[4] === "1") {
        coins[message[2]].goUp = true
        coins[message[2]].goDown = false
      }
      else if (message[4] === "2") {
        coins[message[2]].goUp = false
        coins[message[2]].goDown = true
      }
      else {
        coins[message[2]].goUp = false
        coins[message[2]].goDown = false
      }

      coins[message[2]].price_usd = message[5]
      this.setState({ "coins": coins })

      setTimeout(() => {
        coins = Object.assign({}, this.state.coins)
        coins[message[2]].goUp = false
        coins[message[2]].goDown = false
        this.setState({coins: coins})
      }, 1000)
    }
  }

  getTickStyle = (coin) => {
    if (coin.goUp) {
      return " green "
    } else if (coin.goDown) {
      return " red "
    } else {
      return " "
    }
  }

  componentDidMount() {
    this.getAllCoins();
  }

  render() {
    let { columns, coins } = this.state;

    let data = Object.keys(coins).map((key) => {
      return coins[key];
    })

      return (
        <div>
          <Table columns={columns} dataSource={Array.from(data)} rowKey="symbol" pagination={false} rowClassName={record => this.getTickStyle(record)}/>
        </div>
      )
    }
}

export default App;
