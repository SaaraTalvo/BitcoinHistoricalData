//max date on the date input as today
var today = new Date();
var dd = today.getDate();
var mm = today.getMonth() + 1;
var yyyy = today.getFullYear();
if (dd < 10) {
  dd = "0" + dd;
}
if (mm < 10) {
  mm = "0" + mm;
}
today = yyyy + "-" + mm + "-" + dd;

document.getElementById("input2").setAttribute("max", today);
document.getElementById("input1").setAttribute("max", today);

document.getElementById("button").addEventListener("click", load);

//on click
function load() {
  //create ajax object
  var xhr = new XMLHttpRequest();

  var startDate = document.getElementById("input1").value;
  var endDate = document.getElementById("input2").value;

  //change input date values to UNIX timestaps
  var start = new Date(startDate).getTime() / 1000;
  var end = new Date(endDate).getTime() / 1000 + 3600;

  const url = new URL(
    "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range?vs_currency=eur&"
  );

  //append the unix times to URL
  url.searchParams.append("from", start);
  url.searchParams.append("to", end);

  //specify what to get
  xhr.open("GET", url, true);

  //when loaded, do function
  xhr.onload = function () {
    //if everything ok
    if (this.status == 200) {
      var allData = JSON.parse(this.responseText);
    }

    //if the dates are not given, or starting date is after ending date
    if (!start || !end || start > end) {
      document.getElementById("prices").innerHTML =
        "Please give a valid date range";
      document.getElementById("para").innerHTML = "";
      document.getElementById("para2").innerHTML = "";
      document.getElementById("para3").innerHTML = "";
      document.getElementById("input1").value = "";
      document.getElementById("input2").value = "";
      return;
    }

    //push all the prices to an array to be compared with each other
    allPrices = [];
    //collect the amount of checked days to compare later with decreasing days
    var days = 0;
    for (var i in allData.prices) {
      //push the price data in an array to be checked for downward trend
      allPrices.push(allData.prices[i][1]);
    }

    //A) function to check array: how many downward days
    const decreasingSequence = (allPrices = []) => {
      let longest = [];
      let curr = [];
      const setDefault = (newItem) => {
        if (curr.length > longest.length) {
          longest = curr;
        }
        curr = [newItem];
      };

      //had trouble with the data granularity given by coingecko. The data range was 90 days or more -> hourly data, not 90 days from the query date? Also it seems that before 24.5.2018 (1527120000) it gives hourly data. not sure what's going on, but these are the bases I acted upon.

      //90 days or more in the date range given OR the starting date input was before 24.5.2018
      if (end - start >= 7693200 || start < 1527120000) {
        for (var i = 0; i < allPrices.length; i++) {
          days++;
          if (curr.length && allPrices[i] > curr[curr.length - 1]) {
            setDefault(allPrices[i]);
          } else {
            curr.push(allPrices[i]);
          }
        }
      }
      //1 - 89 days query time = hourly data
      else if (end - start < 7693200) {
        for (var i = 0; i < allPrices.length; i += 24) {
          days++;
          if (curr.length && allPrices[i] > curr[curr.length - 1]) {
            setDefault(allPrices[i]);
          } else {
            curr.push(allPrices[i]);
          }
        }
      }

      setDefault();

      //return and put in answer variable, -1 = does not take the first day into account
      return longest.length - 1;
    };

    var answer = decreasingSequence(allPrices);

    //if every day the price of bitcoin decreased, do not buy nor sell
    //comparing the downward days with all of the checked days
    if (answer + 1 == days) {
      document.getElementById("buyAndSell").innerHTML =
        "In the given date range the price of bitcoin only decreased, therefore you should not buy nor sell.";
    }
    //if the prices only increased, else how many days of downward days
    if (answer == 0) {
      document.getElementById("prices").innerHTML =
        "The price only increased for the given date range.";
    } else {
      document.getElementById("prices").innerHTML =
        "Longest downward trend for the given dates was " + answer + " day(s).";
    }

    //B) TOTAL VOLUMES, Which date within a given date range had the highest trading volume?
    totalVolumes = [];

    //push the total volumes in an array
    for (var i in allData.total_volumes) {
      totalVolumes.push(allData.total_volumes[i][1]);
    }

    var max = totalVolumes[0];

    //find the max total volume between the given dates, 90 days or over daily data
    if (end - start >= 7693200 || start < 1527120000) {
      for (var i = 0; i < totalVolumes.length; i++) {
        var value = totalVolumes[i];
        max = value > max ? value : max;
      }
    } else if (end - start < 7693200) {
      //under 90 days query time = hourly data
      for (var i = 0; i < totalVolumes.length; i += 24) {
        var value = totalVolumes[i];
        max = value > max ? value : max;
      }
    }

    var indexOfMax = totalVolumes.indexOf(max);

    // get the date for the max total volume
    totalVolumeDates = [];

    //push the total volumes in an array
    for (var i in allData.total_volumes) {
      totalVolumeDates.push(allData.total_volumes[i][0]);
    }

    //output only two decimals for clarity's sake
    var maxDecimal = max.toFixed(2);

    //find the date with index and convert to normal date
    var unixDate = totalVolumeDates[indexOfMax];
    var normalDate = new Date(unixDate);
    var year = normalDate.getFullYear();
    var day = normalDate.getDate();
    var month = normalDate.getMonth() + 1;

    //if total volume does not yet give any data
    if (!max) {
      document.getElementById("highest").innerHTML =
        "There is no data to show for total volume from this time period.";
    } else {
      document.getElementById("highest").innerHTML =
        "Between the given date range the date with the highest trading volume: " +
        month +
        "/" +
        day +
        "/" +
        year +
        ". The trading volume was " +
        maxDecimal +
        "€. ";
    }

    //C) The best day to buy and the best day to sell
    //find the pair of days which have the biggest difference between prices, smaller first.
    //jump over maxDiff function if all the asked days are decreasing
    if (!(answer + 1 == days)) {
      maxDiff();
    }

    //90 days or over, daily data. Find the max price difference between two days
    //the granularity was different that was given by coingecko
    function maxDiff() {
      if (end - start >= 7693200 || start < 1527120000) {
        var max_diff = 0;
        for (let i = 0; i < allPrices.length; i++) {
          for (let j = i + 1; j < allPrices.length; j++) {
            if (allPrices[j] - allPrices[i] > max_diff) {
              max_diff = allPrices[j] - allPrices[i];
              var priceBig = allPrices[j];
              var priceLow = allPrices[i];
            }
          }
        }
      } else if (end - start < 7693200) {
        //under 90 days
        var max_diff = 0;
        for (let i = 0; i < allPrices.length; i += 24) {
          for (let j = i + 24; j < allPrices.length; j += 24) {
            if (allPrices[j] - allPrices[i] > max_diff) {
              max_diff = allPrices[j] - allPrices[i];
              var priceBig = allPrices[j];
              var priceLow = allPrices[i];
            }
          }
        }
      }
      //find the index to get the date to represent to the user
      var indexOfBig = allPrices.indexOf(priceBig);
      var indexOfLow = allPrices.indexOf(priceLow);

      //push the dates of the prices to an array
      pricesDates = [];
      for (var i in allData.prices) {
        pricesDates.push(allData.prices[i][0]);
      }

      //converting unix timestamp to dates to output for the user
      var unixDate = pricesDates[indexOfBig];
      var normalDateHigh = new Date(unixDate);
      var yearHigh = normalDateHigh.getFullYear();
      var dayHigh = normalDateHigh.getDate();
      var monthHigh = normalDateHigh.getMonth() + 1;

      var unixDate = pricesDates[indexOfLow];
      var normalDate = new Date(unixDate);
      var year = normalDate.getFullYear();
      var day = normalDate.getDate();
      var month = normalDate.getMonth() + 1;

      document.getElementById("buyAndSell").innerHTML =
        "The best day to buy bitcoin in the given date range was: " +
        month +
        "/" +
        day +
        "/" +
        year +
        " and the best day to sell the bought bitcoin was: " +
        monthHigh +
        "/" +
        dayHigh +
        "/" +
        yearHigh +
        ".";
    }

    // for testing purposes
    //console.log(max);
    // console.log("How many downward days: " + answer);
    // console.log("Days asked: " + days);
    // console.log("All prices : " + allPrices);
    // console.log(end);
    // console.log(start);
  };
  xhr.send();
}
