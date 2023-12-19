let isSidebarOpen = false;
let useCelsius = true;
let searchHistory = [];


function toggleMenu() {
    const container = document.getElementById('container');
    const sidebar = document.getElementById('sidebar');
    const hamburgerIcon = document.getElementById('hamburgerIcon');

    isSidebarOpen = !isSidebarOpen;

    if (isSidebarOpen) {
        container.classList.add('sidebar-open');
        sidebar.style.width = '200px';
        hamburgerIcon.style.left = '220px';
    } else {
        container.classList.remove('sidebar-open');
        sidebar.style.width = '0';
        hamburgerIcon.style.left = '20px';
    }
}


function initializeSidebar() {
    const container = document.getElementById('container');
    const sidebar = document.getElementById('sidebar');
    const hamburgerIcon = document.getElementById('hamburgerIcon');

    container.classList.remove('sidebar-open');
    sidebar.style.width = '0';
    hamburgerIcon.style.left = '20px';
}

initializeSidebar();

function kelvinToCelsius(kelvin) {
    return kelvin - 273.15;
}
// Function to handle user input and fetch weather data
async function getWeather() {
    const apiKey = '55979965f813836165c58d8ec358afcd'; // Replace with your API key
    const cityInput = document.getElementById('cityInput');
    let cityName = cityInput.value.trim(); // Trim to remove leading and trailing spaces

    try {
        if (!cityName) {
            throw new Error('Please enter a city name.');
        }

        // Capitalize the city name
        cityName = cityName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

        // Fetch current weather data
        const currentResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${apiKey}`);
        const currentData = await currentResponse.json();

        if (!currentResponse.ok) {
            throw new Error(`Unable to fetch current weather data. ${currentData.message}`);
        }

        // Fetch air quality data
        const airQualityResponse = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${currentData.coord.lat}&lon=${currentData.coord.lon}&appid=${apiKey}`);
        const airQualityData = await airQualityResponse.json();

        if (!airQualityResponse.ok) {
            throw new Error(`Unable to fetch air quality data. ${airQualityData.message}`);
        }

        // Fetch 5-day forecast data
        const forecastResponse = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=${apiKey}`);
        const forecastData = await forecastResponse.json();

        if (!forecastResponse.ok) {
            throw new Error(`Unable to fetch forecast data. ${forecastData.message}`);
        }

        // Update the selected city name and country
        const cityCountryElement = document.getElementById('selectedCity');
        cityCountryElement.innerHTML = `<h2>${currentData.name}, ${currentData.sys.country}</h2>`;

        // Display weather information
        displayWeather(currentData, airQualityData, forecastData);

        // Add the city to the search history
        addToSearchHistory(cityName);
        updateSearchHistoryUI();
    } catch (error) {
        console.error('Error fetching weather data:', error);
        alert(`Error: ${error.message}`);
    }
}


// Attach the getWeather function to the search button click event
const searchButton = document.getElementById('searchButton');
searchButton.addEventListener('click', getWeather);

// Attach the getWeather function to the Enter key press event in the input field
const cityInput = document.getElementById('cityInput');
cityInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        getWeather();
    }
});


function interpretAirQuality(aqi) {
    if (aqi >= 0 && aqi <= 50) {
        return 'Good';
    } else if (aqi > 50 && aqi <= 100) {
        return 'Moderate';
    } else if (aqi > 100 && aqi <= 150) {
        return 'Unhealthy for Sensitive Groups';
    } else if (aqi > 150 && aqi <= 200) {
        return 'Unhealthy';
    } else if (aqi > 200 && aqi <= 300) {
        return 'Very Unhealthy';
    } else {
        return 'Hazardous';
    }
}


function displayWeather(currentData, airQualityData, forecastData) {
    const weatherInfoContainer = document.getElementById('weather-info');
    const forecastContainer = document.getElementById('forecast');
    const sunriseTimestamp = currentData.sys.sunrise;
    const sunsetTimestamp = currentData.sys.sunset;
    const sunriseTime = new Date(sunriseTimestamp * 1000).toLocaleTimeString();
    const sunsetTime = new Date(sunsetTimestamp * 1000).toLocaleTimeString();

    // Clear previous content
    weatherInfoContainer.innerHTML = '';

// Display Temperature card
const temperatureIconCard = createInfoCardWithIcon(`${kelvinToCelsius(currentData.main.temp).toFixed(2)} °C`, 'bi bi-thermometer');
weatherInfoContainer.appendChild(temperatureIconCard);

// Display Humidity card with an icon
const humidityIconCard = createInfoCardWithIcon(`${currentData.main.humidity}%`, 'bi bi-droplet');
weatherInfoContainer.appendChild(humidityIconCard);

// Display Wind card
const windDirection = getWindDirection(currentData.wind.deg);
const windIconCard = createInfoCardWithIcon(`${currentData.wind.speed} m/s, ${windDirection}`, 'bi bi-wind');
weatherInfoContainer.appendChild(windIconCard);


    // Display Air Quality card
    const airQualityIndex = airQualityData.list[0].main.aqi;
    const airQualityLabel = interpretAirQuality(airQualityIndex);
    const airQualityIconCard = createInfoCardWithIcon(`${airQualityIndex} (${airQualityLabel})`, 'bi bi-cloud-haze');
    weatherInfoContainer.appendChild(airQualityIconCard);

// Display Sunrise and Sunset combined card
const sunriseSunsetCard = createCombinedCard(sunriseTime, sunsetTime);
weatherInfoContainer.appendChild(sunriseSunsetCard);


// Display 5-day forecast starting from the current day
const today = new Date().getDay();
forecastContainer.innerHTML = forecastData.list.slice(0, 5).map((entry, index) => {
    const dayIndex = (today + index) % 7; // Ensure the day index wraps around if it exceeds 6 (Sunday)
    const dayName = getDayName(dayIndex);

    // Convert forecast temperature from Kelvin to Celsius
    const forecastTemperatureCelsius = kelvinToCelsius(entry.main.temp);

    // Add icons to the forecast cards
    const weatherIconClass = getWeatherIconClass(entry.weather[0].icon);

    // Convert wind direction from degrees to cardinal directions
    const windDirection = getWindDirection(entry.wind.deg);

    return `
        <div class="forecast-card">
            <h3>${dayName}</h3>
            <p> ${forecastTemperatureCelsius.toFixed(2)} °C <i class="bi bi-thermometer"></i></p>
            <p>
                <span class="weather-icon" title="${entry.weather[0].description}">
                    <i class="${weatherIconClass} icon-large"></i>
                </span>
            </p>
            <p> ${entry.wind.speed} m/s, ${windDirection} <i class="bi bi-wind"></i></p>
        </div>
    `;
}).join('');
}

// Function to get wind direction in cardinal format
function getWindDirection(degrees) {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
}

// Helper function to create an info card
function createInfoCard(title, content) {
    const card = document.createElement('div');
    card.classList.add('info-card');
    card.innerHTML = `<h4>${title}</h4><p>${content}</p>`;
    return card;
}

// Helper function to get the Bootstrap Icons class based on OpenWeatherMap icon code
function getWeatherIconClass(iconCode) {
    // Map OpenWeatherMap icon codes to Bootstrap Icons class names
    const iconMappings = {
        '01d': 'bi-brightness-high', // Clear sky day
        '01n': 'bi-brightness-high', // Clear sky night
        '02d': 'bi-cloud-sun',       // Few clouds day
        '02n': 'bi-cloud-moon',      // Few clouds night
        '03d': 'bi-cloud',           // Scattered clouds day
        '03n': 'bi-cloud',           // Scattered clouds night
        '04d': 'bi-cloudy',          // Broken clouds day
        '04n': 'bi-cloudy',          // Broken clouds night
        '09d': 'bi-cloud-drizzle',   // Shower rain day
        '09n': 'bi-cloud-drizzle',   // Shower rain night
        '10d': 'bi-cloud-rain',      // Rain day
        '10n': 'bi-cloud-rain',      // Rain night
        '11d': 'bi-cloud-lightning', // Thunderstorm day
        '11n': 'bi-cloud-lightning', // Thunderstorm night
        '13d': 'bi-cloud-snow',      // Snow day
        '13n': 'bi-cloud-snow',      // Snow night
        '50d': 'bi-cloud-haze',      // Mist day
        '50n': 'bi-cloud-haze',      // Mist night
    };

    return iconMappings[iconCode] || 'bi-question-mark';
}



// Helper function to get the day name from the day index
function getDayName(dayIndex) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[dayIndex];
}




function addToSearchHistory(cityName) {
    // Check if the cityName is not already in the search history
    if (!searchHistory.includes(cityName)) {
        searchHistory.push(cityName);
        updateSearchHistoryUI();
    }
}

function removeCity(cityName) {
    const index = searchHistory.indexOf(cityName);
    if (index !== -1) {
        searchHistory.splice(index, 1);
        updateSearchHistoryUI(); // Update the UI after removing the city
    }
}

// Modify the updateSearchHistoryUI function to add an onclick event to each search history item
function updateSearchHistoryUI() {
    const searchHistoryContainer = document.getElementById('searchHistory');

    // Clear previous content
    searchHistoryContainer.innerHTML = '';

    // Add each search history item with an 'x' button
    searchHistory.forEach(cityName => {
        const searchHistoryItem = document.createElement('div');
        searchHistoryItem.classList.add('search-history-item');

        const cityNameElement = document.createElement('p');
        cityNameElement.textContent = cityName;
        cityNameElement.classList.add('city-name');

        const removeButton = document.createElement('button');
        removeButton.innerHTML = '&#10006;'; // '✖' is the 'x' character in HTML
        removeButton.classList.add('remove-btn');
        removeButton.onclick = () => removeCity(cityName);

        searchHistoryItem.appendChild(cityNameElement);
        searchHistoryItem.appendChild(removeButton);

        searchHistoryContainer.appendChild(searchHistoryItem);

        // Attach a click event to the city name
        cityNameElement.addEventListener('click', () => getWeatherForSearch(cityName));
    });
}

function capitalizeCityName(cityName) {
    // Capitalize the first letter of each word
    return cityName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}



async function getWeatherForSearch(cityName) {
    const apiKey = '55979965f813836165c58d8ec358afcd';

    try {
        // Fetch current weather data
        const currentResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${apiKey}`);
        const currentData = await currentResponse.json();

        if (!currentResponse.ok) {
            throw new Error(`Unable to fetch current weather data. ${currentData.message}`);
        }

        // Fetch air quality data
        const airQualityResponse = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${currentData.coord.lat}&lon=${currentData.coord.lon}&appid=${apiKey}`);
        const airQualityData = await airQualityResponse.json();

        if (!airQualityResponse.ok) {
            throw new Error(`Unable to fetch air quality data. ${airQualityData.message}`);
        }

        // Fetch 5-day forecast data
        const forecastResponse = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=${apiKey}`);
        const forecastData = await forecastResponse.json();

        if (!forecastResponse.ok) {
            throw new Error(`Unable to fetch forecast data. ${forecastData.message}`);
        }

        // Update the selected city name and country
        const cityCountryElement = document.getElementById('selectedCity');
        cityCountryElement.innerHTML = `<h2>${currentData.name}, ${currentData.sys.country}</h2>`;

        // Display weather information
        displayWeather(currentData, airQualityData, forecastData);

        // Add the city to the search history
        addToSearchHistory(cityName);
        updateSearchHistoryUI();
    } catch (error) {
        console.error('Error fetching weather data:', error);
        alert(`Error: ${error.message}`);
    }
}





// Helper function to create an info card with an icon and content
function createInfoCardWithIcon(content, iconClass) {
    const card = document.createElement('div');
    card.classList.add('info-card');
    card.innerHTML = `
        <div class="info-content">
            <div class="info-icon"><i class="${iconClass}"></i></div>
            <div class="info-text">${content}</div>
        </div>
    `;
    return card;
}

function createCombinedCard(sunriseTime, sunsetTime) {
    const card = document.createElement('div');
    card.classList.add('combined-card');

    card.innerHTML = `
        <div class="sunrise-section">
            <div class="semi-circle sunrise-semi-circle"></div>
            <div class="sunrise-sunset-text">
                <p>${sunriseTime}</p>
            </div>
        </div>
        <div class="sunset-section">
            <div class="semi-circle sunset-semi-circle"></div>
            <div class="sunrise-sunset-text">
                <p>${sunsetTime}</p>
            </div>
        </div>
    `;

    return card;
}

function displayAdditionalInfo(sunrise, sunset) {
    const additionalInfoContainer = document.getElementById('weather-info');

    // Ensure sunrise and sunset are valid timestamps
    if (!isNaN(sunrise) && !isNaN(sunset)) {
        const sunriseTime = new Date(sunrise * 1000).toLocaleTimeString();
        const sunsetTime = new Date(sunset * 1000).toLocaleTimeString();

        // Create a card element for sunrise and sunset
        const cardElement = createCombinedCard(sunriseTime, sunsetTime);

        // Clear the container and append the card
        additionalInfoContainer.innerHTML = '';
        additionalInfoContainer.appendChild(cardElement);
    } else {
        console.error("Invalid sunrise or sunset timestamps");
    }
}
