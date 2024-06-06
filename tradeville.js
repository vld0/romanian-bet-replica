var WebSocket = require('websocket').w3cwebsocket;
var websocket;

/**
 *
 * Loads your portfolio from tradeville.ro
 * Implementation follows example from https://portal.tradeville.ro/diverse/api/APIdocs.htm#level2
 *
 */

module.exports = { loadMyPortfolio }

function loadMyPortfolio(user, password, demo) {

  return new Promise((resolve, reject) => {
    websocket = new WebSocket("wss://api.tradeville.ro", ["apitv"]);
    websocket.onopen = () => {
      websocket.send(JSON.stringify({cmd: 'login', prm: {coduser: user, parola: password, demo: demo}}));
    }
    websocket.onerror = (err) => console.log('eroare la conectare');

    websocket.onmessage = (e => {
      var ce = JSON.parse(e.data);
      if (websocket.readyState !== 1) {
        reject("connection to tradeville has failed")
      }
      if (ce.prm) delete ce.prm.parola;
      //console.log("response 1 = " + JSON.stringify(ce));
      resolve(ce.OK);//return 1
    });

  }).then(function (result) {
    //console.log("rs2=" + result);
    if (result!==1) {
      console.log("ups, connection to tradeville has failed with result " + result);
      process.exit();
    }

    return new Promise((resolve, reject) => { // (*)
      websocket.onmessage = (e => {
        var ce = JSON.parse(e.data);
        if (websocket.readyState !== 1) {
          reject("connection to tradeville has failed")
        }
        //console.log("response 2 = " + JSON.stringify(ce));
        resolve(data2structure(ce.data));
      });

      websocket.send(JSON.stringify({cmd: 'Portfolio', prm: {data: null}}));
    });

  }).then(function (result) {
    //console.log("rs3=" + JSON.stringify(result));
    websocket.close();//close
    return result;
  });


}



/**
 *
 * @param dd
 * @returns {*[]}
 */
function data2structure(dd) {
  var portofolio = [];

  const indexSymbol = Object.keys(dd).indexOf("Symbol");
  const symbols = Object.values(dd)[indexSymbol];

  const indexQuantity = Object.keys(dd).indexOf("Quantity");
  const quantities = Object.values(dd)[indexQuantity];

  const indexMarketPrice = Object.keys(dd).indexOf("MarketPrice");
  const marketPrice = Object.values(dd)[indexMarketPrice];

  if (symbols.length !== quantities.length || symbols.length !== marketPrice.length ) {
    throw new Error("different array sizes");
  }

  symbols.forEach((r, i) => {
    portofolio.push({
      'symbol': r,
      'quantity': quantities[i],
      'marketPrice': marketPrice[i]
    })
    /*var entry = {};
    entry[r] = quantities[i];
    portofolio.push(
      entry
    );*/

  });
  //console.log(portofolio);
  return portofolio;
}
