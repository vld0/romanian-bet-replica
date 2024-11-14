const axios = require('axios');
const jsdom = require("jsdom");
const {JSDOM} = jsdom;

/**
 * A HTML Parser that extracts the info about the stocks from Romanian BET Index
 * https://ro.wikipedia.org/wiki/Indicele_Bursei_de_Valori_Bucure%C8%99ti
 */

module.exports = { loadIndexComposition }

function loadIndexComposition() {
  return new Promise((resolve, reject) => {
    axios.defaults.headers.common['Accept-Language'] = 'en-US,en;q=0.5' // for all requests
    axios
      .get("https://bvb.ro/FinancialInstruments/Indices/IndicesProfiles.aspx?i=BET",
        {
          'headers': {
            'Host': 'bvb.ro',
            'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/113.0',
            'Accept': ' text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': ' en-US,en;q=0.5',
            'Accept-Encoding': ' gzip, deflate, br',
            'Connection': ' keep-alive',
            //'Cookie': ' BVBCulturePref=ro-RO; ASP.NET_SessionId=r%2bBkJ%2bu2pV10YJcYvhBMFw%3d%3d; cookiesession1=678B287258B3E05F0462C8B26222B344',
            'Upgrade-Insecure-Requests': ' 1',
            'Sec-Fetch-Dest': ' document',
            'Sec-Fetch-Mode': ' navigate',
            'Sec-Fetch-Site': ' none',
            'Sec-Fetch-User': ' ?1',
            'Pragma': ' no-cache',
            'Cache-Control': ' no-cache'
          }
        }

        )
      .catch(function (error) {
        console.log("ERROR READING BET INDEX" + error);
      })
      .then((response) => {

        const dom = new jsdom.JSDOM(response.data);

        var betIndexComposition = [];
        //const element = dom.window.document.querySelector('table tr');
        //table tr td
        //#gvC > tbody:nth-child(2) > tr:nth-child(1) > td:nth-child(1)
        //#gvC > tbody:nth-child(2) > tr:nth-child(1)
        var tableRows = dom.window.document.querySelectorAll("#gvC > tbody > tr");
        for (var i = 0; i < tableRows.length; i++) {
          var tableRow = tableRows[i];
          //console.log(tableRow.textContent);

          var symbol = tableRows[i].querySelector('td:nth-child(1)').textContent;
          var price = tableRows[i].querySelector('td:nth-child(4)').textContent;
          price = parseFloat(price.replace(/,/g, '.'));
          var weight = tableRows[i].querySelector('td:nth-child(8)').textContent.replace(/,/g, '.');
          weight = parseFloat(weight.replace(/,/g, '.'));

          //console.log(symbol + ' ' + price + ' ' + weight);

          betIndexComposition.push({
            'symbol': symbol,
            'price': price,
            'weight': weight
          });
        }

        //console.log(betIndexComposition);

        resolve(betIndexComposition);
      });
  });
}

/*
function run() {
  loadIndexComposition().then(function (msg) {
    console.log(msg);
  })
    .catch(function (error) {
      console.error(error);
    });

}

run();*/
