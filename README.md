# BitcoinHistoricalData

is a desktop website for retrieving some specific historical data for bitcoin.  

The user can input a date range of his or her choosing.    

The website will provide
* the amount of the longest downward continuum in days  
* the day with the highest trading volume in euro  
* the best day to buy and to sell the bought
bitcoin within the given date range.    

The data is provided by CoinGecko, https://www.coingecko.com/en/api/documentation  
The endpoint used: /coins/{id}/market_chart/range   
  
For now the data is not stored, but that could be
an option, to give the user the option to compare the results of multiple
searches from different date ranges.  
  
  Found on Netlify: https://awesome-edison-1833f9.netlify.app/



