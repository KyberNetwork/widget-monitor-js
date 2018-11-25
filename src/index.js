'use strict';

const cron = require('node-cron');
const CONSTANTS = require('./constant')
const ScheduleTask = require('./schedule-task')
const EthereumService = require('./ethereum/ethereum')
// var txs = []


const init = (config) => {
  //todo init task schedule with params
  // nodes: array { url, prune, }
  // network
  // default block confirm
  // default lost timeout
  // dafault interval time
  // txs 

  // confirmCallback
  // mineCallback
  var expression = config.expression || CONSTANTS.DEFAULT_EXPRESION
  // if(config.txs){
  //   txs = config.txs
  //   txs = txs.map(tx => Object.assign(tx, {
  //     timeStamp: new Date().getTime()
  //   }))
  // }
  var arrayNodes = config.nodes || CONSTANTS.DEFAULT_NODE
  var network = config.network || CONSTANTS.DEFAULT_NETWORK
  var getReceipt = config.includeReceipt || CONSTANTS.DEFAULT_GET_RECEIPT
  var globalBlockConfirm = config.blockConfirm || CONSTANTS.DEFAULT_BLOCK_CONFIRM
  var lostTimeout = (config.lostTimeout || CONSTANTS.DEFAULT_TIMEDOUT) * 1000
  var maxProcessTxs = config.maxProcessTxs || CONSTANTS.DEFAULT_MAX_PROCESS_TXS
  var mineCallback = config.mineCallback || CONSTANTS.DEFAULT_MINE_CALLBACK
  var confirmCallback = config.confirmCallback || CONSTANTS.DEFAULT_CONFIRM_CALLBACK
  var sqlPath = config.sqlPath || CONSTANTS.DEFAULT_SQL_PATH


  var ethereumService = new EthereumService(arrayNodes)
  const params = {
    ethereumService, 
    network, 
    getReceipt, 
    globalBlockConfirm, 
    lostTimeout, 
    maxProcessTxs,
    mineCallback,
    confirmCallback
  }
  this.scheduleTask = new ScheduleTask(params)
  if(!config.noPersit){
    const Txs = require('./persit/sqlite.storage')
    this.txs = config.sqlIntance || new Txs(sqlPath)
    this.txs.initDb((err, result) => {
      if(err) return console.log(err)
  
      cron.schedule(expression, () => {
        this.txs.getAll( (err, txs) => {
          if(err) return
          this.scheduleTask.exec(txs, (tx) => {
            removeTx(tx.hash)
          })
        })
      });
  
    })
  }
   

  
}

const addTx = (txConfig) => {
  // add tx to array txs to check status
  // with config
  // hash:
  // blockConfirm
  // amount
  // symbol
  this.txs.findByHash(txConfig.hash, (err, result) => {
    console.log("______________", err, result)
    if(err) return console.log(err)

    if(result && result.length) return console.log("tx already exist!")

    Object.assign(txConfig, {timeStamp: new Date().getTime()})
    // txs.push(txConfig)
    this.txs.addTx(txConfig, (er, result) => console.log(err))
  })

  // const indexDel = txs.map(t => t.hash.toLowerCase()).indexOf(txConfig.hash.toLowerCase())
  // if(indexDel >= 0) console.log("tx already exist")
  // else {
  //   Object.assign(txConfig, {timeStamp: new Date().getTime()})
  //   // txs.push(txConfig)
  //   this.txs.addTx(txConfig)
  // }
  // // callback
  // // finishCallback

  
  
  // callback return [tx data, current block confirm] when current < blockConfirm
  // finishCallback return [tx data, block confirm] current > blockConfirm 
  // -> clear tx from array
}

const removeTx = (hash) => {
  //remove tx with hash from array
  // const indexDel = txs.map(t => t.hash.toLowerCase()).indexOf(hash.toLowerCase())
  // if(indexDel < 0) console.log("Cannot index delete tx")
  // else {
  //   txs.splice(indexDel, 1)
  // }
  console.log("*********** run to remove tx", hash)
  this.txs.removeTxByHash(hash, err => console.log(err))
}

const utils = {
  execTx: (txObj, callback) => this.scheduleTask.processTx(txObj, callback)
}

module.exports = {
  init, addTx, removeTx, utils
}