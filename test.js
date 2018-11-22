var monitorTx = require("./src")

monitorTx.init({
  expression: "*/10 * * * * *",       //every 10 s
  mineCallback: (err, txData) => {
    console.log("_____________-callback", err, txData)
  },
  confirmCallback: (err, txData) => {
    console.log("_____________-finishCallback", err, txData)
  }
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
    hash: "0x4df564345381513726326cbeb3a60a8005582333996d45fba9fdeddaa7fc5a10",
    amount: '0.7653',
    symbol: 'KNC'
  })
}, 6000)