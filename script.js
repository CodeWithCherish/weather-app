const apiKey = "a8266ed5e7484c9585612717262304";
const searchHistoryKey = "weatherSearchHistory";
const unitStorageKey = "weatherUnit";

const temperatureField = document.querySelector(".temp");
const locationField = document.querySelector(".time_location p");
const dateandTimeField = document.querySelector(".time_location span");
const conditionField = document.querySelector(".condition_text");
const searchField = document.querySelector(".search_area");
const iconField = document.querySelector(".weather_icon");
const loader = document.querySelector(".loader");
const form = document.querySelector("form");
const unitToggle = document.querySelector("#unitToggle");
const windField = document.querySelector("#windValue");
const humidityField = document.querySelector("#humidityValue");
const forecastStrip = document.querySelector("#forecastStrip");
const historyDropdown = document.querySelector("#historyDropdown");
const toast = document.querySelector("#toast");
const skeleton = document.querySelector("#skeleton");
const clearHistoryButton = document.querySelector("#clearHistoryButton");
const useLocationButton = document.querySelector("#useLocationButton");
const installPrompt = document.querySelector("#installPrompt");
const installButton = document.querySelector("#installButton");
const installCloseButton = document.querySelector("#installCloseButton");

let deferredInstallPrompt = null;
let currentUnit = localStorage.getItem(unitStorageKey) || "C";
let latestWeatherData = null;
let searchHistory = loadSearchHistory();

function showLoading() {
    loader.classList.remove("hidden");
    skeleton.classList.remove("hidden");
    forecastStrip.classList.add("hidden");
}

function hideLoading() {
    loader.classList.add("hidden");
    skeleton.classList.add("hidden");
    forecastStrip.classList.remove("hidden");
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.remove("hidden");
    setTimeout(() => toast.classList.add("hidden"), 4200);
}

function isCoordinateQuery(query) {
    return /^\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*$/.test(query);
}

function loadSearchHistory() {
    try {
        const stored = JSON.parse(localStorage.getItem(searchHistoryKey) || "[]");
        return Array.isArray(stored) ? stored : [];
    } catch {
        return [];
    }
}

function saveSearchHistory() {
    localStorage.setItem(searchHistoryKey, JSON.stringify(searchHistory.slice(0, 5)));
}

function getLocalWeatherIcon(condition) {
    const normalized = condition.toLowerCase();

    if (normalized.includes("thunder") || normalized.includes("storm")) {
        return "icon-thunderstorm.svg";
    }
    if (normalized.includes("snow") || normalized.includes("sleet") || normalized.includes("ice")) {
        return "icon-snow.svg";
    }
    if (normalized.includes("rain") || normalized.includes("drizzle") || normalized.includes("shower")) {
        return "icon-rain.svg";
    }
    if (normalized.includes("fog") || normalized.includes("mist") || normalized.includes("haze") || normalized.includes("smoke")) {
        return "icon-fog.svg";
    }
    if (normalized.includes("overcast")) {
        return "icon-overcast.svg";
    }
    if (normalized.includes("cloud")) {
        return "icon-cloudy.svg";
    }
    return "icon-sunny.svg";
}

function updateHistoryUI() {
    historyDropdown.innerHTML = "";

    if (!searchHistory.length) {
        historyDropdown.classList.add("hidden");
        return;
    }

    searchHistory.forEach((city) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "history_item";
        button.textContent = city;
        button.addEventListener("click", () => {
            searchField.value = city;
            fetchResults(city);
        });
        historyDropdown.appendChild(button);
    });

    historyDropdown.classList.remove("hidden");
}

function clearSearchHistory() {
    searchHistory = [];
    saveSearchHistory();
    updateHistoryUI();
    showToast("Search history cleared.");
}

function updateSearchHistory(city) {
    if (!city || isCoordinateQuery(city)) {
        return;
    }

    const normalized = city.trim();
    searchHistory = searchHistory.filter((item) => item.toLowerCase() !== normalized.toLowerCase());
    searchHistory.unshift(normalized);
    searchHistory = searchHistory.slice(0, 5);
    saveSearchHistory();
    updateHistoryUI();
}

async function fetchResults(targetLocation) {
    showLoading();

    const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(targetLocation)}&days=4&aqi=no&alerts=no`;

    try {
        const response = await fetch(url);
        const data = await response.json().catch(() => null);

        if (!response.ok) {
            const message = data?.error?.message || `Unable to fetch weather (${response.status})`;
            throw new Error(message);
        }

        if (data?.error) {
            throw new Error(data.error.message || "Unable to load weather");
        }

        latestWeatherData = data;
        updateAllWeather(data);

        if (!isCoordinateQuery(targetLocation)) {
            const resolvedLocation = `${data.location.name}, ${data.location.country}`;
            localStorage.removeItem("lastCoords");
            localStorage.setItem("lastCity", resolvedLocation);
            updateSearchHistory(resolvedLocation);
        }

        hideLoading();
    } catch (error) {
        hideLoading();
        showToast(error.message || "Network error ⚠️");
        displayErrorState(error.message || "Unable to load weather");
    }
}

function updateAllWeather(data) {
    const locationName = `${data.location.name}, ${data.location.country}`;
    updateDetails(locationName, data.location.localtime, data.current);
    updateForecast(data.forecast.forecastday);
    setWeatherTheme(data.current.condition.text, data.location.localtime);
    updateUnitToggle();
}

function updateDetails(locationName, localtime, current) {
    const [datePart, timePart] = localtime.split(" ");
    const currentDay = getDayName(new Date(datePart).getDay());

    locationField.innerText = locationName;
    dateandTimeField.innerText = `${datePart} • ${currentDay} • ${timePart}`;
    conditionField.innerText = current.condition.text;
    iconField.src = getLocalWeatherIcon(current.condition.text);
    iconField.alt = current.condition.text;
    windField.innerText = `${current.wind_kph.toFixed(1)} km/h`;
    humidityField.innerText = `${current.humidity}%`;

    animateTemp(current);
}

function animateTemp(current) {
    const targetTemp = currentUnit === "F" ? Math.round(current.temp_f) : Math.round(current.temp_c);
    const unitText = currentUnit === "F" ? "°F" : "°C";

    // FIX #2: removed dead ternary `targetTemp >= 0 ? 0 : 0` — always 0 either way
    let value = 0;
    const step = targetTemp >= 0 ? 1 : -1;

    if (targetTemp === 0) {
        temperatureField.innerText = `0${unitText}`;
        return;
    }

    temperatureField.innerText = `${value}${unitText}`;

    const interval = setInterval(() => {
        if (value === targetTemp) {
            clearInterval(interval);
            return;
        }
        value += step;
        temperatureField.innerText = `${value}${unitText}`;
    }, 18);
}

function updateForecast(forecastDays) {
    if (!Array.isArray(forecastDays) || forecastDays.length < 2) {
        forecastStrip.innerHTML = "";
        forecastStrip.classList.add("hidden");
        return;
    }

    const forecastItems = forecastDays.slice(1, 4);
    forecastStrip.innerHTML = forecastItems
        .map((day) => {
            // FIX #3: parse date parts manually to avoid UTC offset shifting the day name
            // e.g. new Date("2025-05-21") is UTC midnight — in negative-offset zones it
            // rolls back to the previous calendar day, giving the wrong getDayName result.
            const [y, m, d] = day.date.split("-").map(Number);
            const dayName = getDayName(new Date(y, m - 1, d).getDay());

            const iconUrl = getLocalWeatherIcon(day.day.condition.text);
            const maxTemp = currentUnit === "F" ? Math.round(day.day.maxtemp_f) : Math.round(day.day.maxtemp_c);
            const minTemp = currentUnit === "F" ? Math.round(day.day.mintemp_f) : Math.round(day.day.mintemp_c);

            return `
        <article class="forecast_card">
          <span class="forecast_day">${dayName}</span>
          <img src="${iconUrl}" alt="${day.day.condition.text}" />
          <span class="forecast_temp">${maxTemp}° / ${minTemp}°</span>
          <small>${day.day.condition.text}</small>
        </article>
      `;
        })
        .join("");

    forecastStrip.classList.remove("hidden");
}

function setWeatherTheme(condition, localtime) {
    const body = document.body;
    document.querySelectorAll(".rain-effect, .snow-effect").forEach((el) => el.remove());
    body.className = "";

    const normalized = condition.toLowerCase();

    if (normalized.includes("thunder") || normalized.includes("storm")) {
        body.classList.add("thunderstorm");
    } else if (normalized.includes("fog") || normalized.includes("mist") || normalized.includes("haze") || normalized.includes("smoke")) {
        body.classList.add("foggy");
    } else if (normalized.includes("overcast")) {
        body.classList.add("overcast");
    } else if (normalized.includes("rain") || normalized.includes("drizzle") || normalized.includes("shower")) {
        body.classList.add("rainy");
        startRain();
    } else if (normalized.includes("snow") || normalized.includes("sleet") || normalized.includes("ice")) {
        body.classList.add("snowy");
        startSnow();
    } else if (normalized.includes("cloud")) {
        body.classList.add("cloudy");
    } else {
        body.classList.add("sunny");
    }

    const hour = parseInt(localtime.split(" ")[1].split(":")[0], 10);
    if (!Number.isNaN(hour) && (hour >= 18 || hour < 6)) {
        body.classList.add("night");
    }
}

function startRain() {
    const rainContainer = document.createElement("div");
    rainContainer.classList.add("rain-effect");
    document.body.appendChild(rainContainer);

    for (let i = 0; i < 80; i += 1) {
        const drop = document.createElement("span");
        drop.style.left = `${Math.random() * 100}vw`;
        drop.style.animationDuration = `${Math.random() * 1 + 0.8}s`;
        rainContainer.appendChild(drop);
    }
}

function startSnow() {
    const snowContainer = document.createElement("div");
    snowContainer.classList.add("snow-effect");
    document.body.appendChild(snowContainer);

    for (let i = 0; i < 60; i += 1) {
        const flake = document.createElement("span");
        flake.style.left = `${Math.random() * 100}vw`;
        flake.style.animationDuration = `${Math.random() * 3 + 2}s`;
        snowContainer.appendChild(flake);
    }
}

function displayErrorState(message) {
    locationField.innerText = "Unable to load weather";
    dateandTimeField.innerText = message;
    conditionField.innerText = "";
    temperatureField.innerText = "--";
    iconField.src = "";
    windField.innerText = "--";
    humidityField.innerText = "--";
    forecastStrip.classList.add("hidden");
}

function toggleUnits() {
    currentUnit = currentUnit === "C" ? "F" : "C";
    localStorage.setItem(unitStorageKey, currentUnit);
    updateUnitToggle();

    if (latestWeatherData) {
        updateDetails(`${latestWeatherData.location.name}, ${latestWeatherData.location.country}`, latestWeatherData.location.localtime, latestWeatherData.current);
        updateForecast(latestWeatherData.forecast.forecastday);
    }
}

function updateUnitToggle() {
    unitToggle.textContent = currentUnit === "C" ? "°C" : "°F";
}

form.addEventListener("submit", searchForLocation);
searchField.addEventListener("focus", updateHistoryUI);
unitToggle.addEventListener("click", toggleUnits);
clearHistoryButton?.addEventListener("click", clearSearchHistory);
useLocationButton?.addEventListener("click", handleUseLocationWeather);
installButton?.addEventListener("click", async () => {
    if (!deferredInstallPrompt) {
        return;
    }
    deferredInstallPrompt.prompt();
    const choiceResult = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    installPrompt?.classList.add("hidden");
});
installCloseButton?.addEventListener("click", () => {
    installPrompt?.classList.add("hidden");
});

window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    installPrompt?.classList.remove("hidden");
});

window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    installPrompt?.classList.add("hidden");
});

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/service-worker.js").catch(() => {
            console.warn("Service worker registration failed.");
        });
    });
}

function handleUseLocationWeather() {
    showToast("Resolving your location...");
    showLoading();
    getUserLocationWeather();
}

function searchForLocation(event) {
    event.preventDefault();

    const query = searchField.value.trim();
    if (!query) {
        showToast("Enter a city or location to search.");
        return;
    }

    fetchResults(query);
}

window.addEventListener("load", () => {
    updateUnitToggle();
    updateHistoryUI();

    const lastCity = localStorage.getItem("lastCity");
    const lastCoords = localStorage.getItem("lastCoords");

    if (lastCity) {
        fetchResults(lastCity);
    } else if (lastCoords) {
        fetchResults(lastCoords);
    } else {
        getUserLocationWeather();
    }

    // Show data-disclaimer modal for both web and PWA if not yet accepted
    try {
        const accepted = localStorage.getItem('disclaimerAccepted');
        const modal = document.getElementById('disclaimerModal');
        const agreeBtn = document.getElementById('agreeDisclaimer');
        const closeBtn = document.getElementById('closeDisclaimer');
        // FIX #1: openDisclaimerLink now exists in index.html — this handler is active
        const openLink = document.getElementById('openDisclaimerLink');

        function openModal() {
            if (!modal) return;
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            agreeBtn?.focus();
        }

        function closeModal() {
            if (!modal) return;
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }

        if (!accepted) {
            openModal();
        }

        agreeBtn?.addEventListener('click', () => {
            localStorage.setItem('disclaimerAccepted', '1');
            closeModal();
        });

        closeBtn?.addEventListener('click', () => {
            closeModal();
        });

        openLink?.addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });

        // allow ESC to close modal
        window.addEventListener('keydown', (ev) => {
            if (ev.key === 'Escape') {
                closeModal();
            }
        });
    } catch (e) {
        // ignore modal errors
    }
});

function getUserLocationWeather() {
    if (!navigator.geolocation) {
        fetchResults("Lagos");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            localStorage.setItem("lastCoords", `${lat},${lon}`);
            localStorage.removeItem("lastCity");
            fetchResults(`${lat},${lon}`);
        },
        () => {
            showToast("Location access denied. Showing Lagos instead.");
            localStorage.setItem("lastCity", "Lagos");
            fetchResults("Lagos");
        },
        { timeout: 8000 }
    );
}

function getDayName(number) {
    switch (number) {
        case 0:
            return "Sunday";
        case 1:
            return "Monday";
        case 2:
            return "Tuesday";
        case 3:
            return "Wednesday";
        case 4:
            return "Thursday";
        case 5:
            return "Friday";
        case 6:
            return "Saturday";
        default:
            return "Today";
    }
}