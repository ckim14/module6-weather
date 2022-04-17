/**
 * CRITERIA
 */

//  GIVEN a weather dashboard with form inputs
//  WHEN I search for a city
//  THEN I am presented with current and future conditions for that city and that city is added to the search history
//  WHEN I view current weather conditions for that city
//  THEN I am presented with the city name, the date, an icon representation of weather conditions, the temperature, the humidity, the wind speed, and the UV index
//  WHEN I view the UV index
//  THEN I am presented with a color that indicates whether the conditions are favorable, moderate, or severe
//  WHEN I view future weather conditions for that city
//  THEN I am presented with a 5-day forecast that displays the date, an icon representation of weather conditions, the temperature, the wind speed, and the humidity
//  WHEN I click on a city in the search history
//  THEN I am again presented with current and future conditions for that city

var APIkey = "292e6070d235318ea7390bf31d0f6f9e";
var todaysDate = moment().format("LL");
var searchHistory = JSON.parse(localStorage.getItem("search-history")) || [];

function renderSearchHistory() {
  // Clear current list
  $("#searchHistory").html("");

  searchHistory.forEach((element) => {
    $("#searchHistory").html(
      $("#searchHistory").html() +
        `<li class="search-history-item">${element}</li>`
    );
  });

  $("li.search-history-item").click((event) => {
    $("#enterCity").val(event.target.innerText);
    getWeather(false);
  });
}

async function getWeather(addToHistory = true) {
  var cityData = await getCityData(addToHistory);
  if (!cityData) {
    return;
  }
  var currentWeather = await getCurrentWeather(cityData);

  var currentChunk = generateWeatherChunk(cityData, currentWeather);
  $("#cityDetail").html(currentChunk);
  // Clear current weather
  $("#fiveDay").html("");
  var fiveDay = await getFiveDayWeather(cityData);

  // Read every 8th item since the response is 5 days in 3 hour steps
  for (var i = 0; i < fiveDay.list.length; i += 8) {
    var weatherData = fiveDay.list[i];
    var dayChunk = generateForecastChunk(cityData, weatherData);
    $("#fiveDay").html($("#fiveDay").html() + dayChunk);
  }

  renderSearchHistory();
}

async function getCurrentWeather(cityData) {
  var response = await fetch(
    `https://api.openweathermap.org/data/2.5/onecall?lat=${cityData.lat}&lon=${cityData.lon}&units=imperial&appid=${APIkey}`
  );
  if (response.ok) {
    var weatherData = await response.json();
    return weatherData;
  }

  alert("couldnt get weather");
}
//   WHEN I view current weather conditions for that city
// THEN I am presented with the
// city name
// the date
//  an icon representation of weather conditions
// the temperature
// the humidity
//  the wind speed
// and the UV index

async function getCityData(addToHistory) {
  var city = $("#enterCity").val();
  var getLatLong = await fetch(
    `http://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${APIkey}`
  );
  if (getLatLong.ok) {
    var latLong = await getLatLong.json();
    if (latLong) {
      var cityData = latLong[0];
      if (addToHistory) {
        searchHistory.unshift(cityData.name);
        // Only keep the last 5 search history items
        if (searchHistory.length > 5) {
          searchHistory.length = 5;
        }
        localStorage.setItem("search-history", JSON.stringify(searchHistory));
      }
      return cityData;
    }
  }

  alert("bad city");
}

function generateWeatherChunk(cityData, currentWeather) {
  var uviClass = "uvi-ok";
  if (currentWeather.current.uvi > 5) {
    uviClass = "uvi-severe";
  } else if (currentWeather.current.uvi > 2) {
    uviClass = "uvi-moderate";
  }

  return `
  <div class="weather-chunk">
        <h2 id="cityDetail">
            ${cityData.name} ${todaysDate}
        </h2>
        <img src="http://openweathermap.org/img/wn/${currentWeather.current.weather[0].icon}@2x.png" />
        <p>Temperature: ${currentWeather.current.temp} °F</p>
        <p>Humidity: ${currentWeather.current.humidity}\%</p>
        <p>Wind Speed: ${currentWeather.current.wind_speed} MPH</p>
        <p class="${uviClass}">UVI: ${currentWeather.current.uvi} </p>
</div>
        `;
}

// WHEN I view future weather conditions for that city
//  THEN I am presented with a 5-day forecast that displays the date, an icon representation of weather conditions, the temperature, the wind speed, and the humidity

function generateForecastChunk(cityData, forecastWeather) {
  return `<div class="forecast-day pl-3 pt-3 mb-3 col-2">
    <p> ${moment.unix(forecastWeather.dt).format("dddd")}</p>
    <img src="http://openweathermap.org/img/wn/${
      forecastWeather.weather[0].icon
    }@2x.png" />
    <p>Temperature: ${forecastWeather.main.temp} °F</p>
    <p>Humidity: ${forecastWeather.main.humidity}\%</p>
    <p>Windspeed: ${forecastWeather.wind.speed} MPH </p>

    </div>
    `;

  //var dateString = moment.unix(forecastWeather.dt).format("MM/DD/YYYY");
}
// write a generate forecastChunk
/*
        // <p>Date: ${forecastWeather.list.dt} </p>
                <p>Wind Speed: ${forecastWeather.current.wind_speed} MPH</p>
        <img src="http://openweathermap.org/img/wn/${forecastWeather.list.weather[0].icon}@2x.png" />
                        
clouds: {all: 75}
dt: 1650153600
dt_txt: "2022-04-17 00:00:00"
main: {temp: 286.16, feels_like: 285, temp_min: 285.19, temp_max: 286.16, pressure: 1020, sea_level: 1020,…}
pop: 0
sys: {pod: "d"}
visibility: 10000
weather: [{id: 803, main: "Clouds", description: "broken clouds", icon: "04d"}]
0: {id: 803, main: "Clouds", description: "broken clouds", icon: "04d"}
description: "broken clouds"
icon: "04d"
id: 803
main: "Clouds"
}
*/

// var dateString = moment.unix(value).format("MM/DD/YYYY");

async function getFiveDayWeather(cityData) {
  var lat = cityData.lat;
  var lon = cityData.lon;
  var getfiveDayWeather = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${APIkey}`
  );
  if (getfiveDayWeather.ok) {
    var weatherData = await getfiveDayWeather.json();
    return weatherData;
  }
  alert("bad city");
}

$("#searchBtn").click(getWeather);
$("#enterCity").keypress(function (event) {
  if (event.which == 13) {
    event.preventDefault();
  } else {
    return;
  }
  getWeather();
});
renderSearchHistory();
