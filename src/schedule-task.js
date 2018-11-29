
const CONSTANTS = require('./constant')
const converter = require("./converter")
const loadEnv = require("./env")
const async = require("async")
////tx = {}
// hash:
// block confirm
// lost time out
// timeStamp


module.exports = class ScheduleTask {
  constructor(props) {
    this.EthereumService = props.ethereumService
    this.network = props.network
    this.BlockchainInfo = loadEnv(this.network)
    this.MappedTokens = converter.mapAddress(this.BlockchainInfo.tokens)
    this.getReceipt = props.getReceipt
    this.globalBlockConfirm = props.globalBlockConfirm
    this.lostTimeout = props.lostTimeout
    this.maxProcessTxs = props.maxProcessTxs

    this.mineCallback = props.mineCallback
    this.confirmCallback = props.confirmCallback

    this.noPersit = props.noPersit
  }

  processTrade(txData, receipt, callback){
    // console.log("===================receip", receipt)
    this.EthereumService.callMultiNode('exactTradeData', txData.input)
    .then(tradeData => {
      const inputTokenSymbol = this.MappedTokens[tradeData.src.toLowerCase()]
      if(!inputTokenSymbol) return callback("token not support by Kyber!")

      const inputAmount = converter.toToken(tradeData.srcAmount, this.BlockchainInfo.tokens[inputTokenSymbol].decimals)

      const receiptLogs = receipt.logs
      const indexExecuteTradeLog = receiptLogs.map(l => l.topics[0]).indexOf(CONSTANTS.TRADE_TOPPIC)
      
      if(indexExecuteTradeLog < 0) return callback("Transaction not use ExecuteTrade of KYber!")
      else {
        const dataTrade = receiptLogs[indexExecuteTradeLog].data
        this.EthereumService.callMultiNode('exactExecuteTradeData', dataTrade)
        .then(tradeExtractData => {
          const srcTokenSymbol = this.MappedTokens[tradeExtractData.srcToken.toLowerCase()]
          const srcAmount = converter.toToken(tradeExtractData.srcAmount, this.BlockchainInfo.tokens[srcTokenSymbol].decimals)

          const tokenSymbol = this.MappedTokens[tradeExtractData.destToken.toLowerCase()]
          const amount = converter.toToken(tradeExtractData.destAmount, this.BlockchainInfo.tokens[tokenSymbol].decimals)
          return callback(null, {
            type: 'trade',
            blockNumber: txData.blockNumber,
            from: txData.from,
            to: tradeData.destAddress,

            amount: amount,
            tokenSymbol: tokenSymbol,
            tokenName: this.BlockchainInfo.tokens[tokenSymbol].name,

            srcTokenSymbol: srcTokenSymbol,
            srcAmount: srcAmount,
            srcTokenName: this.BlockchainInfo.tokens[srcTokenSymbol].name,

            inputTokenSymbol: inputTokenSymbol,
            inputAmount: inputAmount,
            inputTokenName: this.BlockchainInfo.tokens[inputTokenSymbol].name,
            // rate ?
          })
        })
        .catch(err => console.log(err))
      }
    })
    .catch(callback)
  }

  processPay(txData, receipt, callback){
    const receiptLogs = receipt.logs
    const indexPayLog = receiptLogs.map(l => l.topics[0]).indexOf(CONSTANTS.PROOF_OF_PAYMENT_TOPIC)
    
    if(indexPayLog < 0) return callback("Transaction not use Pay with Kyber!")
    else {
      // const destAddr = 
      const destAddr = converter.decodeHexToAddress(receiptLogs[indexPayLog].topics[2]) 
      const dataPay = receiptLogs[indexPayLog].data
      this.EthereumService.callMultiNode('exactPayData', dataPay)
      .then(payExtractData => {

        const tokenSymbol = this.MappedTokens[payExtractData._token.toLowerCase()]

        if(!tokenSymbol) return callback(`Token (${payExtractData._token}) not supported by kyber!`)
        const tokenAmount = converter.toToken(payExtractData._amount, this.BlockchainInfo.tokens[tokenSymbol].decimals)
        return callback(null, {
          type: 'pay',
          blockNumber: txData.blockNumber,
          from: txData.from,
          to: destAddr,

          amount: tokenAmount,
          tokenSymbol: tokenSymbol,
          tokenName: this.BlockchainInfo.tokens[tokenSymbol].name,
        })

      })
      .catch(err => console.log(err))
    }

  }

  processTransfer(txData, callback){
    if (converter.isZero(txData.value)) {
      // transfer token
      this.EthereumService.callMultiNode('exactTransferData', txData.input)
      .then(transferData => {
        const tokenSymbol = this.MappedTokens[txData.to.toLowerCase()]
        if(!tokenSymbol) return callback("token not support by Kyber!")

        const amount = converter.toToken(transferData._value, this.BlockchainInfo.tokens[tokenSymbol].decimals)

        return callback(null, {
          type: 'transfer',
          blockNumber: txData.blockNumber,
          from: txData.from,
          to: transferData._to,
          amount: amount,
          tokenSymbol: tokenSymbol,
          tokenName: this.BlockchainInfo.tokens[tokenSymbol].name
          // rate ?
        })
      })
      .catch(callback)

    } else {
      // transfer ether
      return callback(null, {
        type: 'transfer',
        blockNumber: txData.blockNumber,
        from: txData.from,
        to: txData.to,
        amount: converter.toToken(txData.value, this.BlockchainInfo.tokens["ETH"].decimals),
        tokenSymbol: "ETH",
        tokenName: this.BlockchainInfo.tokens["ETH"].name
        // rate ?
      })
    }
  }

  getTransactionReceipt(hash, callback){
    this.EthereumService.callMultiNode('getTransactionReceipt', hash)
    .then(result => {
      return callback(null, result)
    })
    .catch(callback)
  }

  getCurrentBlock(callback){
    this.EthereumService.callMultiNode('getCurrentBlock')
    .then(blockNo => {
      return callback(null, blockNo)
    })
    .catch(callback)
  }

  getConfirmData(hash, receipt, callback){
    this.EthereumService.callMultiNode('getTx', hash)
    .then(txData => {
      if(txData.to.toLowerCase() == this.BlockchainInfo.wrapper.toLowerCase()){
        // handle with new wrapper
        return this.processPay(txData, receipt, callback)
      }
      else if (txData.to.toLowerCase() == this.BlockchainInfo.network.toLowerCase()) {
        return this.processTrade(txData, receipt, callback)
      } else {
        return this.processTransfer(txData, callback)
      }
    })
    .catch(callback)
  }

  processTx(tx, callback, finishCallback) {
    console.log("_____________________process tx", tx)
    async.auto({
      receipt: asyncCallback => this.getTransactionReceipt(tx.hash, asyncCallback),
      currentBlock: asyncCallback => this.getCurrentBlock(asyncCallback),
      confirm: ['receipt', (results, asyncCallback) => this.getConfirmData(tx.hash, results.receipt, asyncCallback)]
    }, (err, results) => {
      if(err) {
        /// handle tx pending or lost
        if(this.noPersit) return callback(err)
        console.log(err)
        const now = new Date().getTime()
        if(tx.timeStamp && now - tx.timeStamp > this.lostTimeout) return finishCallback && finishCallback(null, { status: CONSTANTS.TRANSACTION_STATUS.LOST})
        else return 
        // callback(null, {pending: true})
      }

      const blockRange = converter.minusBig(results.currentBlock, results.confirm.blockNumber)
      const confirmBlock = tx.confirmBlock || this.globalBlockConfirm
      const txStatus = results.receipt.status ? CONSTANTS.TRANSACTION_STATUS.SUCCESS : CONSTANTS.TRANSACTION_STATUS.FAIL

      var confirmTransaction, transactionStatus = txStatus
      if(tx.amount && tx.symbol){
        if(transactionStatus == CONSTANTS.TRANSACTION_STATUS.SUCCESS){

          if(converter.isLower(results.confirm.amount, tx.amount) || 
            results.confirm.tokenSymbol !== tx.symbol.toUpperCase()){
              transactionStatus = CONSTANTS.TRANSACTION_STATUS.NOT_ENOUGH
          }

        }
        confirmTransaction = {
          status: transactionStatus,
          amount: tx.amount,
          symbol: tx.symbol
        }
      }

      if(blockRange > confirmBlock){
        //todo push finish callback
        // clear tx from array
        return (finishCallback || callback)(null, {
          hash: tx.hash,
          data: results.confirm,
          confirmBlock: blockRange,
          status: txStatus,
          ...(this.getReceipt && {receipt: results.receipt}),
          ...(confirmTransaction && {confirmTransaction: confirmTransaction})
        })
      } else {
        return callback(null, {
          hash: tx.hash,
          data: results.confirm,
          confirmBlock: blockRange,
          status: txStatus,
          ...(confirmTransaction && {confirmTransaction: confirmTransaction})
        })
      }
  });
}



  exec(txs, clearCallback) {
    try {
      async.eachLimit(txs, this.maxProcessTxs, (tx, asyncCallback) => {
        this.processTx(tx, this.mineCallback, (finalErr, finalResult) => {
          this.confirmCallback(finalErr, finalResult);
          clearCallback(tx)
          return asyncCallback()
        })
      }, err => {
        console.log(err)
      })
    } catch (error) {
      console.log("!!!!!!!!Error: ", error)
    }
  }




}