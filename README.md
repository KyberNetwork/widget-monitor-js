# Monitor Kyber Transaction

## Install
Install monitor-tx using npm:

```console
$ npm install --save monitor-tx
```

## Usage

Monitor-tx is a node.js module which provides an convenient way to validate transactions made through Kyber Widget.

When user makes a transaction, the workflow is as following:
1. Kyber Widget calls your supplied callback URL, passing the tx hash
2. Your server code then need to add the tx hash to monitor-tx queue, passing mineCallback and confirmCallback as parameters
3. Monitor-tx calls your mineCallback when the tx gets mined, however it will not be considered as a successful tx until a certain number of block confirmation.
4. Monitor-tx calls your confirmCallback when the tx is mined and persisted for at least a certain number of block confirmation or the tx is considered lost for being notfound for more than 15 minutes. At this point, status of the tx can be `lost`, `success`, `failed`, `invalid`.

The tx is considered invalid if one of the following is true.
1. The receiving address is different from receiveAddr passed to Kyber Widget
2. The receiving token is different from receiveToken passed to Kyber Widget
3. The receiving amount is less than receiveAmount passed to Kyber Widget

Within confirmCallback, make sure to check if status is `success` before proceeding.

Internally, the monitor-tx instance periodically polls blockchain nodes to query tx status. The polling interval is configurable.

By default, monitor-tx persist the tx queue to a SqLite DB, so transactions will not be lost if the running process restarts. You could change from SqLite to other kind of storage if desired.

### Methods
| method               |   Detail  
|----------------------|--------------------------------------------------------------
|  init(options)       |   Init the monitor-tx instance
|  addTx(txData)       |   Add an tx to queue
|  removeTx(txHash)    |   Remove tx from queue           

First we need init monitor task
```javascript
var monitorTx = require('monitor-tx');
var options = {...};
monitorTx.init(options)

```
Currently, the following options are supported.

|     field               |        value                         |      Detail                                                                      |
|-------------------------|--------------------------------------|----------------------------------------------------------------------------------|
|     nodes               |     Array<string>                    |    Array of URLS of nodes                                         |
|     network             |     'ropsten'/'mainnet'/'kovan'      |    Ethereum network                                                |
|     expression          |     "* * * * *"                      |    Cron Syntax for polling interval                                                                   |
|     blockConfirm        |     Number                           |    Number of block confirmation                                                       |
|     lostTimeout         |     Number (in seconds)              |    Time until declare a tx is lost                                             |
|     includeReceipt      |     Bolean                           |    Whether receipt data is pass to to confirmCallback                                    |
|     sqlPath             |     String                           |    Path to sqlite DB, set if you use Sqlite as tx storage                                                             |
|     mineCallback        |     Function                         |    Callback when tx is mined |
|     confirmCallback     |     Function                         |    Callback when tx is confirmed (successful, failed, or lost)                         |
|     sqlIntance          |     Class                            |    Storage instance to use instead of sqlite. See later section for details.                                                            |

Default values:
```
  nodes = ['https://ropsten.infura.io']
  network = 'ropsten' 
  expression = "*/15 * * * * *";  //  every 10s
  blockConfirm = 5;
  lostTimeout = 15 * 60            //  15 MINS
  includeReceipt = false
  sqlPath = './src/db/txs.db'
```

#### Cron Syntax

This is a quick reference to cron syntax. For more details, please [refer here](http://www.nncron.ru/help/EN/working/cron-format.htm).

Allowed fields

```
 # ┌────────────── second (optional)
 # │ ┌──────────── minute
 # │ │ ┌────────── hour
 # │ │ │ ┌──────── day of month
 # │ │ │ │ ┌────── month
 # │ │ │ │ │ ┌──── day of week
 # │ │ │ │ │ │
 # │ │ │ │ │ │
 # * * * * * *

 */2 * * * *          // running a task every two minutes
```

Allowed values

|     field    |        value        |
|--------------|---------------------|
|    second    |         0-59        |
|    minute    |         0-59        |
|     hour     |         0-23        |
| day of month |         1-31        |
|     month    |     1-12 (or names) |
|  day of week |     0-7 (or names, 0 or 7 are sunday)  |

#### addTx/removeTx
Add an transaction with hash and data (amount, token symbol) to queue.
```javascript
monitorTx.addTx({
  hash: "0xe763ffe95d02e231f1d745...8bf604953077fefc1eef369e901e",
  amount: '0.7653',
  symbol: 'KNC'
})

monitorTx.removeTx("0xe763ffe95d02e231f1d745...8bf604953077fefc1eef369e901e")

```

The following example shows how to use this module:


```javascript
const monitorTx = require('monitor-tx');

const mineCallback = (err, result) => {
  console.log("MINED!", err, result)
}
const confirmCallback = (err, result) => {
  console.log("CONFIRMED!", err, result)
  // checked if tx is successful
  if(result.confirm && result.confirmTransaction.status == 'success'){
    // transaction succeeded
    console.log("Tx succedded");
  }
}
monitorTx.init({
  nodes : ['https://mainnet.infura.io'],
  network : 'mainnet',
  expression : "*/30 * * * * *";,  //  every 30s
  blockConfirm : 15,
  lostTimeout : 20 * 60, // 1200 seconds = 20 minutes
  includeReceipt : true,
  sqlPath : './src/db/txs.db',
  mineCallback: mineCallback,
  confirmCallback: confirmCallback
})


app.post('/payment/callback', function(req, res, next) {
  data = req.body
  // Add tx to queue
  monitorTx.addTx({
    hash: data.tx,
    amount: data.paymentAmount,
    symbol: data.paymentToken
  })
});
```

#### useage of no persit, just verify status only
Monitor-tx can run no-persit mode, execTx will return tx status immediately

```javascript
monitorTx.init({
  noPersit: true
})

monitorTx.utils.execTx({
  hash: "0xe85faba1e403dc3fbef85e1d66fb1b7f1da85e237e5df80350eaa68cbc605d15",
  amount: '0.7653',
  symbol: 'KNC'
}, (err, data) => {
  console.log("*******************", err, data)
})
```


#### Sample confirmCallback data

```javascript
{ hash: '0xe763ffe95d02e231f1d7450a0848b588447c8bf604953077fefc1eef369e901e',
  data:
   { type: 'trade',
     blockNumber: 3918689,
     from: '0x8fA07F46353A2B17E92645592a94a0Fc1CEb783F',
     to: '0x8fa07f46353a2b17e92645592a94a0fc1ceb783f',
     amount: '0.7653230595192',
     tokenSymbol: 'KNC',
     tokenName: 'KyberNetwork',
     srcTokenSymbol: 'OMG',
     srcAmount: '0.1',
     srcTokenName: 'OmiseGO',
     inputTokenSymbol: 'OMG',
     inputAmount: '0.1',
     inputTokenName: 'OmiseGO' },
  confirmBlock: '35235',
  status: 'success',
  confirmTransaction: { status: 'success', amount: 0.7653, symbol: 'KNC' } 
}


{ hash: '0xd910078d3c2630acfdf15c0f72b09d0808639fcc5323ea6fe054e9444f90525d',
  data:
   { type: 'transfer',
     blockNumber: 3918655,
     from: '0x8fA07F46353A2B17E92645592a94a0Fc1CEb783F',
     to: '0x8fa07f46353a2b17e92645592a94a0fc1ceb783f',
     amount: '1',
     tokenSymbol: 'KNC',
     tokenName: 'KyberNetwork' },
  confirmBlock: '35296',
  status: 'success',
  confirmTransaction: { status: 'success', amount: 0.7653, symbol: 'KNC' } }
```

#### Use a custom tx storage
You could change the tx storage from default of SqLite to one of your own (e.g. in-memory, file, MySql, MongoDB, etc.) by passing a storage object to monitor-tx's `init` method.

Example:
```javascript
const monitorTx = require('monitor-tx');
var myCustomStorageInstance = {...};
monitorTx.init({
  sqlIntance: myCustomStorageInstance
})
```

Storage instance must be an object with the following functions:

```javascript
  /**
   * Find tx by tx hash
   * @param {string} hash 
   * @param {function} callback 
   */
  findByHash(hash, callback)

  /**
   * Get all txs in storage
   * @param {function} callback
   */
  getAll(callback)

  /**
   * Add tx to storage
   * @param {tx object data} data 
   * {
   *      hash: String,
   *      amount: String,
   *      symbol: String
   * }
   * @param {function} callback 
   */
  addTx(data, callback)

  /**
   * remove tx with hash from storate
   * @param {string} hash 
   * @param {function} callback 
   */
  removeTxByHash(hash, callback)
```

#### SqLite schema

If you use the default SqLite storage, a SqLite table named `txs` will be created if not existed with the following table schema.
```
hash: String,
blockConfirm: Number,
timeStamp: Number,
amount: String,
symbol: String
```

