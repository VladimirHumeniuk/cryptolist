import React, { Component } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { Table } from 'antd';
import NumberFormat from 'react-number-format';

import './CurrencyTable.css';

const CRYPTOCOMPARE_API = "https://streamer.cryptocompare.com/";
const COINMARKET_API = "https://api.coinmarketcap.com/v1/ticker/";

class CurrencyTable extends Component {
  constructor(props) {
    super(props);

    this.state = {
      coins: {},
      pagination: {},
      subs: [],
      loading: true,
      cryptoIO: io.connect(CRYPTOCOMPARE_API),
      columns: [{
        title: '#',
        dataIndex: 'rank',
        key: 'rank',
        width: '90px'
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
        render: (data) => <span>${data}</span>
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
    }
  }

  getAllCoins = (start = 0, limit = 10) => {
    axios.get(`${COINMARKET_API}?start=${start}&limit=${limit}`).then((response) => {
      this.setState({ loading: true });

      if (response.status === 200) {

        let coins = {};
        let subs = [];
        const pagination = { ...this.state.pagination };

        pagination.total = 100;

        response.data.map((coin) => {
          coins[coin.symbol] = coin;
          return null
        })

        Object.keys(coins).map((key) => {
          subs.push(`5~CCCAGG~${key}~USD`)
          return null
        })

        Promise.all([this.unsubscribeCryptoStream(this.state.subs)])
          .then(() => {
            this.setState({loading: false, coins: coins, pagination, subs: subs})
            this.subscribeCryptoStream(this.state.subs)
          })
      }
    })
  }

  subscribeCryptoStream = (subs) => {
    this.state.cryptoIO.emit("SubAdd", { "subs": subs })
    this.state.cryptoIO.on("m", (message) => {
      this.updateCoin(message)
    })
  }

  unsubscribeCryptoStream  = (subs) => {
    this.state.cryptoIO.emit("SubRemove", { "subs": subs })
  }

  updateCoin = (message) => {
    message = message.split("~")
    let coins = Object.assign({}, this.state.coins)

    if (coins[message[2]]) {
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

          if (coins[message[2]]) {
            coins[message[2]].goUp = false
            coins[message[2]].goDown = false
            this.setState({coins: coins})
          }
        }, 1000)
      }
    }
  }

  handleTableChange = (pagination) => {
    const pager = { ...this.state.pagination };
    pager.current = pagination.current;

    this.setState({pagination: pager});

    if (pager.current === 1) {
      this.getAllCoins(0 , 10);
    } else {
      this.getAllCoins((pager.current - 1) * 10, 10);
    }
  }

  getTickStyle = (coin) => {
    if (coin.goUp) {
      return " is-up "
    } else if (coin.goDown) {
      return " is-down "
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
        <h1 className="heading text-center">Top 100 Cryptocurrencies By Market Capitalization</h1>

        <Table
        columns={columns}
        dataSource={Array.from(data)}
        rowKey='rank'
        pagination={this.state.pagination}
        loading={this.state.loading}
        onChange={this.handleTableChange}
        rowClassName={record => this.getTickStyle(record)}
        />
      </div>
    )
  }
}

export default CurrencyTable;