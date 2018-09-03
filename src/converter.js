const BigNumber = require('bignumber.js')

module.exports = {
  toToken(number, decimal = 18) {
    if (!decimal) decimal = 18
    var bigNumber = new BigNumber(number)
    if (bigNumber == 'NaN' || bigNumber == 'Infinity') {
      return "0"
    } else {
      var weight = Math.pow(10, decimal)
      return bigNumber.dividedBy(weight).toString()
    }
  },

  mapAddress(tokens) {
    let mappedData = {}
  
    Object.keys(tokens).map(tokenSymbol => {
      mappedData[tokens[tokenSymbol].address.toLowerCase()] = tokenSymbol
    })
    return mappedData
  },

  isZero(number){
    if(!number) return true
    let bigNumber
    try {
      bigNumber = new BigNumber(number)
    } catch (e) {
    }
    return !bigNumber || bigNumber.isZero() || bigNumber == 'NaN' || bigNumber == 'Infinity' ? true : false
  },

  sumBig(arrayParams, initState) {
    return arrayParams.reduce((a, b) => {
      let bigA = a ? new BigNumber(a) : new BigNumber(0)
      let bigB = b ? new BigNumber(b) : new BigNumber(0)
      return bigA.plus(bigB)
    }, new BigNumber(initState))
    .toString()
  },
  
  timesBig(arrayParams) {
    return arrayParams.reduce((a, b) => {
      let bigA = a ? new BigNumber(a) : new BigNumber(0)
      let bigB = b ? new BigNumber(b) : new BigNumber(0)
      return bigA.times(bigB)
    }, 1)
    .toString()
  },

  minusBig(minuend, subtrahend){
    let bigMinuend = minuend ? new BigNumber(minuend) : new BigNumber(0)
    let bigSubtrahend = subtrahend ? new BigNumber(subtrahend) : new BigNumber(0)
    let bigMinus = bigMinuend.minus(bigSubtrahend)
    if(bigMinus.isNegative()) return '0'
    else return bigMinus.toString()
  },

  isLower(number, base){
    let bigNumber = number ? new BigNumber(number) : new BigNumber(0)
    let bigBase = base ? new BigNumber(base) : new BigNumber(0)
    return bigNumber.isLessThan(bigBase)
  }

}