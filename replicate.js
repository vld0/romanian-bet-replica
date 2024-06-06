const bvbParser = require('./bvbParser.js');
const tradeville = require("./tradeville.js");
const {w3cwebsocket: WebSocket} = require("websocket");

/**
 *
 * loads Romanian BET Index and your Tradeville portfolio
 *
 * Based on your input (nb of companies you want to replicate and the amount to invest)
 * it calculates the number of stocks of each company you have to buy or sell
 *
 */

//how many companies you want to replicate
var myBetSize = process.env.topCompanies;
var amountToInvest = process.env.amountToInvest;

var user = process.env.user;
var password = process.env.password;
var demo = false;

replicate();

function replicate() {

  if (!user || !password || !myBetSize || !amountToInvest) {
    throw new Error("You must provide the following input parameters: user password betSize amountToInvest");
  }

  Promise.all([tradeville.loadMyPortfolio(user, password, demo), bvbParser.loadIndexComposition()])
    .then(responses => {

      let portfolio = responses[0];
      let bet = responses[1];

      if (bet.length < myBetSize) {
        throw new Error("you are trying to replicate " + myBetSize + " companies while BET index has only " + bet.length);
      }

      //console.log("[START] Your Tradeville portfolio\n" + prettyPrint(portfolio) + "[END] Your Tradeville portfolio.\n\n");
      //console.log("[START] BET index\n" + prettyPrint(bet) + "[END] BET index\n\n");

      //all symbols from bet
      let betSymbols = bet.map(p => p.symbol);
      //console.log(betSymbols);

      //remove symbols from my portfolio that are not in BET
      let betPortfolio = portfolio.filter(item => betSymbols.includes(item.symbol))
      //console.log(betPortfolio);

      //estimate the number of symbols from BET that you want to replicate
      //find lowest symbol in bet
      let calculatedBetSize = 0;
      for (i = 0; i < betPortfolio.length; i++) {
        tmpBetSize = betSymbols.indexOf(betPortfolio[i].symbol);
        if (tmpBetSize > calculatedBetSize) {
          calculatedBetSize = tmpBetSize;
        }
      }
      if (calculatedBetSize > myBetSize) {
        console.log("WARNING!!! You are going to replicate less companies " + myBetSize + " that you currently have in your portfolio " + calculatedBetSize + ".\n");
      } else {
        console.log("You are going to replicate " + myBetSize + " companies and it seems you currently have in your portfolio " + calculatedBetSize + ".\n");
      }

      //extract top 'myBetSize' companies from BET;
      //these are the top companies you are replicating
      var myBet = bet.slice(0, myBetSize);
      //sum up the weight of the top 'myBetSize' companies
      var myBetWeight = myBet.map(p => p.weight).reduce((a, b) => a + b);

      console.log("The total weight of top " + myBetSize + " companies is " + myBetWeight + ".\n");

      //recalculate the weight of every stock for the reduced BET
      //and enrich myBetPortfolio with the new value
      myBet.forEach(item => item.myWeight = ((item.weight / (myBetWeight)) * 100));

      //this is for testing
      const oneHundred = myBet.map(p => p.myWeight).reduce((a, b) => a + b);
      if (Math.abs(oneHundred - 100) > 0.01) {
        throw new Error("wrong calculation of weight " + oneHundred);
      }

      console.log("[START] Your " + myBetSize + " Tradeville BET \n" + prettyPrint(myBet)
        + "[END] Your " + myBetSize + " Tradeville BET portfolio.\n\n");

      //calculate the value of your portfolio
      //add amountToInvest
      //then calculate how many stocks you can buy
      //make a difference with your existing portfolio

      //calculate the value of your portfolio
      const currentPortfolioValue = betPortfolio.map(item => {
        const symbolBet = bet.find(itemb => itemb.symbol === item.symbol);
        if (symbolBet) {
          return item.quantity * symbolBet.price;
        } else {
          throw new Error("could not find symbol " + item.symbol);
        }
      }).reduce((a, b) => a + b);
      //console.log("Your current Tradeville BET portfolio value is " + currentPortfolioValue);

      //add amountToInvest
      const totalAmount = currentPortfolioValue + amountToInvest;

      //then calculate how many stocks you can buy
      //make a difference with your existing portfolio
      const toBuy = myBet.map(item => {
        const finalQuantity = totalAmount * item.myWeight / 100 / item.price;
        //do I have the symbol in my portfolio ?
        const symbolPortfolio = betPortfolio.find(itemp => itemp.symbol === item.symbol);
        const currentQuantity = symbolPortfolio ? symbolPortfolio.quantity : 0;
        const delta = finalQuantity - currentQuantity;
        return {
          'symbol': item.symbol,
          'finalQuantity': finalQuantity,
          'currentQuantity': currentQuantity,
          'NB_OF_STOCKS_TO_BUY': delta,
          'price': item.price
        }
      });

      console.log("[START] Number of stocks to buy: \n" + prettyPrint(toBuy) + "\n[END] Number of stocks to buy. \n");
  });

}


function prettyPrint(o) {
  return JSON.stringify(o, null, 2);
}
