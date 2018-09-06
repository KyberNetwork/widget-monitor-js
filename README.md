# Monitor Kyber Transaction

## Install
Install monitor-tx using npm:

```console
$ npm install --save monitor-tx
```

## Usage

Monitor-tx is a node.js module which provides an easy way to validate transaction made by Kyber Widget. It creates a cron job to periodicly check status off every registered tx. Callback function is also fired each time a tx status is changed. There are 2 types of callback function:
- mineCallback: it is called when the tx is mined, however it will not be considered as a successful tx until a certain number of block confirmation.
- confirmCallback: it is called when the tx is mined and persisted for at least a certain number of block confirmation or the tx is considered lost for being notfound for more than 15 minutes. At this point, status of the tx can be `lost`, `success`, `failed`.


### Method
| method               |   Detail  
|----------------------|--------------------------------------------------------------
|  init(initConfig)    |   Init an schedule task, interval check status of array txs
|  addTx(TxData)       |   Add an tx to queue
|  removeTx(hash)      |   Remove tx from queue           

First we need init monitor task
```javascript
var monitorTx = require('monitor-tx');

monitorTx.init({params})

```
we can pass manual config for monitor task

|     field               |        value                         |      Detail                                                                      |
|-------------------------|--------------------------------------|----------------------------------------------------------------------------------|
|     nodes               |     Array<string>                    |    Array url of node, match with network                                         |
|     network             |     'ropsten'/'mainnet'/'kovan'      |    Network of transaction base on                                                |
|     expression          |     "* * * * *"                      |    Cron Syntax                                                                   |
|     blockConfirm        |     Number                           |    Number of block confirm                                                       |
|     lostTimeout         |     Number(second)                   |    Time to check transaction is lost                                             |
|     includeReceipt      |     Bolean                           |    Is include receipt to confirmCallback data                                    |
|     sqlPath             |     String                           |    Path to sqlite db                                                             |
|     mineCallback        |     Function                         |    Callback call each time cron fetched tx data, but confirm block is not enough |
|     confirmCallback     |     Function                         |    Callback call when block confirm is enough or tx lost                         |
|     sqlIntance          |     Class                            |    Database instance                                                             |

Default value:
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

This is a quick reference to cron syntax and also shows the options supported by node-cron.

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

 */2 * * * *          //running a task every two minutes
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
Add an transaction with hash and data (amount, token symbol) to queue, schedule task will auto check and validate with tx data fetched from network
```javascript
monitorTx.addTx({
  hash: "0xe763ffe95d02e231f1d745...8bf604953077fefc1eef369e901e",
  amount: '0.7653',
  symbol: 'KNC'
})

monitorTx.removeTx("0xe763ffe95d02e231f1d745...8bf604953077fefc1eef369e901e")

```

The following example shows some of these features:


```javascript
const monitorTx = require('monitor-tx');

const mineCallback = (err, result) => {
  console.log("-----------", err, result)
}
const confirmCallback = (err, result) => {
  console.log("=====================confirm callback", err, result)
  // checked data is in result.confirm
  if(result.confirm && result.confirmTransaction.status == 'success'){
    // transaction success, save result.hash to database
  }
}
monitorTx.init({
  nodes : ['https://mainnet.infura.io'],
  network : 'mainnet',
  expression : "*/30 * * * * *";,  //  every 30s
  blockConfirm : 15,                // confirmCallback fill call after tx has over 15 blocks confirm
  lostTimeout : 20 * 60,            // if there is no data of tx after 20 MINS, tx will marked as lost and remove from queue
  includeReceipt : true ,          // include receipt in confirmCallback data
  sqlPath : './src/db/txs.db',      // sqlite path inside nodemodule, you can set to specific path inside project
  mineCallback: mineCallback,
  confirmCallback: confirmCallback
})


app.post('/payment/callback', function(req, res, next) {
  data = req.body
  // Add tx to monitorTx process
  monitorTx.addTx({
    hash: data.tx,
    amount: data.paymentAmount,
    symbol: data.paymentToken
  })
});

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

when tx pending
```
err: null 
{ pending: true }
```


#### abtract database
you can manual option which database use by passing database instance to config.
Database instance is an class which contain all of this method:

```javascript
  /**
   * Find tx by hash
   * @param {string} hash 
   * @param {function} callback 
   */
  findByHash(hash, callback)

  /**
   * Get call txs in database
   * @param {function} callback 
   */
  getAll(callback)

  /**
   * Add tx to database
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
   * remove tx with hash from database
   * @param {string} hash 
   * @param {function} callback 
   */
  removeTxByHash(hash, callback)
```

txs schema
```
hash: String,
blockConfirm: Number,
timeStamp: Number,
amount: String,
symbol: String
```




