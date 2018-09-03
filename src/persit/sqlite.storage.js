const sqlite3 = require('sqlite3').verbose()

module.exports = class SqliteStorage {
  constructor(path){
    this.db = new sqlite3.Database(path, (err) => {
      if (err) {
        console.error(err.message);
      } else {
        console.log('Connected to the sqlite3 database.');
      }
    });
  }

  initDb(callback){
    let sql = `CREATE TABLE IF NOT EXISTS txs (id INTEGER PRIMARY KEY AUTOINCREMENT, hash STRING UNIQUE, blockConfirm STRING, timeStamp INTEGER, amount STRING, symbol STRING)`
    this.db.all(sql, [], callback)
  }

  findByHash(hash, callback) {
    let sql = `SELECT * FROM txs WHERE LOWER(hash) = ?`
    return this.db.all(sql, [hash.toLowerCase()], callback)
  }

  getAll(callback){
    let sql = `SELECT * FROM txs`
    return this.db.all(sql, [], callback)
  }

  addTx(data, callback){
    let columns = Object.keys(data).join(',')
    let columns_mask = new Array(Object.keys(data).length + 1).join('?').split('').join(',')

    let values = Object.values(data)

    let sql = `INSERT INTO txs(${columns}) VALUES (${columns_mask})`

    this.db.run(sql, values, callback)
  }

  removeTxByHash(hash, callback){
    let sql = `DELETE FROM txs WHERE LOWER(hash) = ?`
    return this.db.all(sql, [hash.toLowerCase()], callback)
  }

  updatetimeStampTxs(callback){
    let sql = `UPDATE txs SET timeStamp = ?`
    this.db.run(sql, [new Date().getTime()], callback)
  }

}