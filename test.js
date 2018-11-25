var monitorTx = require("./src")

monitorTx.init({
  expression: "*/10 * * * * *",       //every 10 s
  mineCallback: (err, txData) => {
    console.log("_____________-callback", err, txData)
  },
  confirmCallback: (err, txData) => {
    console.log("_____________-finishCallback", err, txData)
  },
  includeReceipt: true
})


setTimeout(() => {
  monitorTx.addTx({
    hash: "0xe85faba1e403dc3fbef85e1d66fb1b7f1da85e237e5df80350eaa68cbc605d15",
    amount: '0.7653',
    symbol: 'KNC'
  })
}, 6000)



// monitorTx.init({
//   noPersit: true
// })

// setTimeout(() => {
//   monitorTx.utils.execTx({
//     hash: "0xe85faba1e403dc3fbef85e1d66fb1b7f1da85e237e5df80350eaa68cbc605d15",
//     amount: '0.7653',
//     symbol: 'KNC'
//   }, (err, data) => {
//     console.log("*******************", err, data)
//   })
// }, 6000)

