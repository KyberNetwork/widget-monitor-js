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

// setTimeout(() => {
//   console.log("___________-add tx")
//   monitorTx.addTx({
//     hash: "0xd910078d3c2630acfdf15c0f72b09d0808639fcc5323ea6fe054e9444f90525d",
//     amount: '0.7653',
//     symbol: 'KNC'
//   })
// }, 5000)



setTimeout(() => {
  monitorTx.addTx({
    hash: "0xe85faba1e403dc3fbef85e1d66fb1b7f1da85e237e5df80350eaa68cbc605d15",
    amount: '0.7653',
    symbol: 'KNC'
  })
}, 6000)