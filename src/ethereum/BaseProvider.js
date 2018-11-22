const Web3 = require("web3")
const abiDecoder = require("abi-decoder")
const CONSTANTS = require('../constant')

module.exports = class BaseProvider {
  constructor(rpcUrl) {
    this.rpc = new Web3(new Web3.providers.HttpProvider(rpcUrl, 3000))
  }

  version() {
    return this.rpc.version.api
  }

  getCurrentBlock(){
    return new Promise((resolve, rejected) => {
      this.rpc.eth.getBlockNumber((err, data) => {
        if (err != null) {
          rejected(err)
        } else {
          resolve(data)
        }
      })
    })
  }

  getTransactionReceipt(tx) {
    return new Promise((resolve, rejected) => {
      this.rpc.eth.getTransactionReceipt(tx, (err, data) => {
        if (err != null) {
          rejected(err)
        } else {
          resolve(data)
        }
      })
    })
  }

  getTx(txHash) {
    console.log("**************** get txhash:", txHash)
    return new Promise((resolve, rejected) => {
      this.rpc.eth.getTransaction(txHash).then((result) => {
        if (result != null) {
          resolve(result)
        } else {
          rejected(new Error("Cannot get tx hash"))
        }
      })
    })
  }

  getAbiByName(name, abi) {
    for (var value of abi) {
      if (value.name === name) {
        return [value]
      }
    }
    return false
  }

  exactTradeData(data) {
    return new Promise((resolve, reject) => {
      try {
        var ieoAbi = this.getAbiByName("trade", CONSTANTS.KYBER_ABI)
        abiDecoder.addABI(ieoAbi)
        var decoded = abiDecoder.decodeMethod(data);
        var arrayParams = decoded.params
        var paramsObj = {}
        arrayParams.map(a => paramsObj[a.name] = a.value)
        resolve(paramsObj)
      } catch (e) {
        reject(e)
      }
    })
  }

  exactPayData(data){
    return new Promise((resolve, reject) => {
      try {
        var payAbi = this.getAbiByName("pay", CONSTANTS.PAY_ABI)
        abiDecoder.addABI(payAbi)
        var decoded = abiDecoder.decodeMethod(data);
        var arrayParams = decoded.params
        var paramsObj = {}
        arrayParams.map(a => paramsObj[a.name] = a.value)
        resolve(paramsObj)
      } catch (e) {
        reject(e)
      }
    })
  }

  decodeHexAddress(data){
    return Promise.resolve(this.rpc.eth.abi.decodeParameters(['address'], data)) 
  }


  exactTransferData(data) {
    return new Promise((resolve, reject) => {
      try {
        var ieoAbi = this.getAbiByName("transfer", CONSTANTS.TOKEN_ABI)
        abiDecoder.addABI(ieoAbi)
        var decoded = abiDecoder.decodeMethod(data);
        var arrayParams = decoded.params
        var paramsObj = {}
        arrayParams.map(a => paramsObj[a.name] = a.value)
        resolve(paramsObj)
      } catch (e) {
        reject(e)
      }
    })
  }

  exactExecuteTradeData(data) {
    return new Promise((resolve, reject) => {
      try {
        var dataMapped = this.rpc.eth.abi.decodeParameters([
          {
            type: 'address',
            name: 'srcAddress'
          },
          {
            type: 'address',
            name: 'srcToken'
          },
          {
            type: 'uint256',
            name: 'srcAmount'
          },
          {
            type: 'address',
            name: 'destAddress'
          },
          {
            type: 'address',
            name: 'destToken'
          },
          {
            type: 'uint256',
            name: 'destAmount'
          }
      ], data)
        resolve(dataMapped)
      } catch (e) {
        reject(e)
      }
    })
  }

  exactPayData(data) {
    return new Promise((resolve, reject) => {
      try {
        var dataMapped = this.rpc.eth.abi.decodeParameters([
          // {
          //   type: 'address',
          //   name: '_payer'
          // },
          // {
          //   type: 'address',
          //   name: '_payee'
          // },
          {
            type: 'address',
            name: '_token'
          },
          {
            type: 'uint256',
            name: '_amount'
          },
          {
            type: 'bytes',
            name: '_data'
          },
      ], data)
        resolve(dataMapped)
      } catch (e) {
        reject(e)
      }
    })
  }



}
