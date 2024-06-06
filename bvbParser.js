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
      .get("https://bvb.ro/FinancialInstruments/Indices/IndicesProfiles.aspx?i=BET")
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
