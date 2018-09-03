const BaseProvider = require('./BaseProvider')

module.exports = class EthereumService {
  constructor(arrayNodes) {
    
    this.listProviders = []
    for (var node of arrayNodes) {
      var provider = new BaseProvider(node)
      this.listProviders.push(provider)
    }
  }

  processOneNode(list, index, fn, callBackSuccess, callBackFail, lastError, ...args) {
    if (!list[index]) {
      let err = lastError ? lastError : new Error("Cannot resolve result: " + fn)
      callBackFail(err)
      return
    }
    if (!list[index][fn]) {
      this.processOneNode(list, ++index, fn, callBackSuccess, callBackFail, lastError, ...args)
      return
    }
    list[index][fn](...args).then(result => {
      callBackSuccess(result)
    }).catch(err => {
      this.processOneNode(list, ++index, fn, callBackSuccess, callBackFail, err, ...args)
    })
  }

  call(fn, ...args){
    return new Promise((resolve, reject) => {
      this.processOneNode(this.listProviders, 0, fn, resolve, reject, null, ...args)
    })
  }


  processMultiNode(list, index, fn, callBackSuccess, callBackFail, results, errors, ...args) {
    if (!list[index]) {
      if(results.length > 0){
       // callBackSuccess(results[0])
      }else{
        callBackFail(errors)
      }      
      return
    }
    if (!list[index][fn]) {
      errors.push(new Error(list[index].rpcUrl +  " not support func: " + fn))
      this.processMultiNode(list, ++index, fn, callBackSuccess, callBackFail, results, errors, ...args)
      return
    }
    list[index][fn](...args).then(result => {      
      results.push(result)
      this.processMultiNode(list, ++index, fn, callBackSuccess, callBackFail, results, errors, ...args)
      callBackSuccess(result)
    }).catch(err => {
      errors.push(err)
      this.processMultiNode(list, ++index, fn, callBackSuccess, callBackFail, results, errors, ...args)
    })
  }

  callMultiNode(fn, ...args) {
    var errors = []
    var results = []
    return new Promise((resolve, reject) => {
      this.processMultiNode(this.listProviders, 0, fn, resolve, reject, results, errors, ...args)
    })
  }
}