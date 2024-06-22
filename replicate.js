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
var reducedBetSize = process.env.topCompanies;
var amountToInvest = parseInt(process.env.amountToInvest);

var user = process.env.user;
var password = process.env.password;
var demo = false;

replicate();

function replicate() {

  if (!user || !password || !reducedBetSize || !amountToInvest) {
    throw new Error("You must provide the following input parameters: user password betSize amountToInvest");
  }

  console.log("You want to invest " + amountToInvest + " lei.\n");

  Promise.all([tradeville.loadMyPortfolio(user, password, demo), bvbParser.loadIndexComposition()])
    .then(responses => {

      let portfolio = responses[0];
      let bet = responses[1];

      if (bet.length < reducedBetSize) {
        throw new Error("you are trying to replicate " + reducedBetSize + " companies while BET index has only " + bet.length);
      }

      console.log("[START] Your Tradeville portfolio\n" + prettyPrint(portfolio) + "[END] Your Tradeville portfolio.\n");
      //console.log("[START] BET index\n" + prettyPrint(bet) + "[END] BET index\n\n");

      //all symbols from bet
      let betSymbols = bet.map(p => p.symbol);
      //console.log(betSymbols);

      //remove symbols from my portfolio that are not in BET
      let betPortfolio = portfolio.filter(item => betSymbols.includes(item.symbol));
      //console.log(betPortfolio);

      //estimate the number of symbols from BET that you want to replicate
      //find lowest symbol in bet
      let calculatedBetSize = 0;
      for (i = 0; i < betPortfolio.length; i++) {
        tmpBetSize = betSymbols.indexOf(betPortfolio[i].symbol);
        if (tmpBetSize > calculatedBetSize) {
          //console.log("a="+tmpBetSize);
          calculatedBetSize = tmpBetSize;
        }
      }
      if ((calculatedBetSize+1) > reducedBetSize) {
        console.log("WARNING!!! You are going to replicate companies " + reducedBetSize + " but the lowest position in your portfolio is " + (calculatedBetSize+1) + ".\n");
      } else {
        console.log("You are going to replicate " + reducedBetSize + " companies and the lowest position in your portfolio is " + (calculatedBetSize+1) + ".\n");
      }

      //extract top 'reducedBetSize' companies from BET;
      //these are the top companies you are replicating
      var reducedBet = bet.slice(0, reducedBetSize);
      //sum up the weight of the top 'reducedBetSize' companies
      var reducedBetWeight = reducedBet.map(p => p.weight).reduce((a, b) => a + b);

      let betPortfolioSymbols = betPortfolio.map(item => item.symbol);
      let reducedBetSymbols = reducedBet.map(item => item.symbol);
      if (betPortfolioSymbols.length < reducedBetSymbols.length) {
        let difference = reducedBetSymbols.filter(x => !betPortfolioSymbols.includes(x));
        console.log("The following symbols are missing from your portfolio: "+difference+" \n");
      }

      console.log("The total weight of top " + reducedBetSize + " companies is " + reducedBetWeight + ".\n");

      //recalculate the weight of every stock for the reduced BET
      //and enrich myBetPortfolio with the new value
      reducedBet.forEach(item => item.reducedWeight = ((item.weight / (reducedBetWeight)) * 100));

      //this is for testing
      const oneHundred = reducedBet.map(p => p.reducedWeight).reduce((a, b) => a + b);
      if (Math.abs(oneHundred - 100) > 0.01) {
        throw new Error("wrong calculation of weight " + oneHundred);
      }

      console.log("[START] Reduced " + reducedBetSize + " BET \n" + prettyPrint(reducedBet)
        + "[END] Reduced " + reducedBetSize + " BET.\n\n");

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
      console.log("Your current Tradeville BET portfolio value is " + currentPortfolioValue);

      //add amountToInvest
      const totalAmount = currentPortfolioValue + amountToInvest;

      //then calculate how many stocks you can buy
      //make a difference with your existing portfolio
      const toBuy = reducedBet.map(item => {
        const finalQuantity = totalAmount * item.reducedWeight / 100 / item.price;
        //do I have the symbol in my portfolio ?
        const symbolPortfolio = betPortfolio.find(itemp => itemp.symbol === item.symbol);
        const currentQuantity = symbolPortfolio ? symbolPortfolio.quantity : 0;
        const delta = finalQuantity - currentQuantity;
        return {
          'symbol': item.symbol,
          'finalQuantity': finalQuantity,
          'currentQuantity': currentQuantity,
          'currentValue': currentQuantity * item.price,
          'currentWeight': currentQuantity * item.price * 100 / currentPortfolioValue,
          'reducedWeight': item.reducedWeight,
          'NB_OF_STOCKS_TO_BUY': delta,
          'AMOUNT_TO_SPEND': delta * item.price ,
          'price': item.price
        }
      });

      console.log("[START] Number of stocks to buy: \n" + prettyPrint(toBuy) + "\n[END] Number of stocks to buy. \n");
  });

}


function prettyPrint(o) {
  return JSON.stringify(o, null, 2);
}
