# romanian-bet-replica
This program replicates Romanian Index BET. This is an alternative to indexes like ETF BET Patria-Tradeville https://www.patriafonduri.ro/fonduri/patria-etfbet


## Objective Statement:
The goal is to replicate the performance of the Bucharest Exchange Trading (BET) index by constructing a portfolio that mirrors the index composition and performance, thereby avoiding administration fees associated with existing ETFs such as ETF BET Patria-Tradeville.

More info about BET: https://m.bvb.ro/FinancialInstruments/Indices/IndicesProfiles.aspx?i=BET

More info about TVBETETF: https://www.patriafonduri.ro/fonduri/patria-etfbet


## Cost Analysis
By replicating the BET index manually, the primary costs incurred will be transaction fees for buying and selling stocks, potential taxes on dividends, and the opportunity cost of time spent managing the portfolio.

These costs are not compare with the fees charged by ETF BET Patria-Tradeville for the purpose of assessing the cost-effectiveness of the replication. A comparison between costs can be readily found on the internet.


## Performance Tracking
No performance tracking.

## Risk Management:
No potential risks and mitigation strategies.


## How does it work?

### Prerequisites
You already have an account on Tradeville: https://tradeville.ro/

You already have access to Tradeville API https://api.tradeville.ro/

### How to run:
> amountToInvest=7500 topCompanies=12 user=johndoe password=***** node replicate.js

where

amountToInvest = amount you want to invest, can be positive(buy), 0(re-balance) or negative (sell)

topCompanies = number of companies you want to replicate, BET have 20 but you can start with less

user = your username from Tradeville

password = your password from Tradeville


### Algorithm (under construction!!!):
1. Loads the latest BET values from https://m.bvb.ro/FinancialInstruments/Indices/IndicesProfiles.aspx?i=BET
   1. recalculates the weight based on the number of companies you want to replicate (topCompanies) 
2. Loads your portfolio from Tradeville
   1. Extracts all your stocks that are part of the BET index
   2. Calculates the lowest stock position the BET and warns you if you replicate less stocks
3. Calculates the total value of your existing BET portfolio + amountToInvest
4. Calculates how many stocks of each company you need to replicate BET index, based on the previous total amount
5. Prints the difference between nb of calculated stocks from previous point and your existing stocks

