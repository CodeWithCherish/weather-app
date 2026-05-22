# weather-app
Frontend Weather App with API Integration, real-time data fetching, and responsive UI built using vanilla JavaScript.
# 🌤️ Weather App (Vanilla JS)

A fast, lightweight web application that delivers real-time weather data. Built entirely with native web technologies, it features automated location persistence, a visual loading state, and direct API integration without framework overhead.

## ✨ Core Features

*   **WeatherAPI Integration**: Fetches comprehensive real-time weather metrics via the WeatherAPI service.
*   **Local Storage Persistence**: Automatically saves and loads the user's last searched city on app restart.
*   **UX Loading Spinner**: Visual state indicators toggle during asynchronous data fetching to improve perceived performance.
*   **Asynchronous JavaScript**: Uses modern `async/await` and the native Fetch API for smooth, non-blocking data retrieval.
*   **Error Handling**: Gracefully handles invalid city names, network failures, and empty search states.

## 🛠️ Built With

*   **HTML5** & **CSS3**: Semantic architecture, responsive layout workflows, and CSS animations for the loader.
*   **Vanilla JavaScript (ES6+)**: Core logic, DOM manipulation, and browser storage management.
*   **WeatherAPI**: Current Weather Data endpoint.

## ⚙️ How It Works: JavaScript Architecture

The application relies on three core native JavaScript systems to operate:

### 1. Loader Lifecycle & API Call Flow
The app uses the native `fetch` interface to request data asynchronously. The loading spinner is toggled visible immediately before the request flies out, and hidden immediately when the promise settles (whether it succeeds or fails).

```javascript
async function getWeatherData(city) {
    const url = `https://weatherapi.com{API_KEY}&q=${city}&aqi=no`;
    
    // Show spinner, clear previous errors/data
    spinner.classList.remove('hidden'); 
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('City not found or API error');
        
        const data = await response.json();
        updateUI(data);
        saveToLocalStorage(city);
    } catch (error) {
        showError(error.message);
    } finally {
        // Always hide spinner when the operation finishes
        spinner.classList.add('hidden');
    }
}
```

### 2. LocalStorage Caching Strategy
To minimize redundant API calls and improve user experience, the last successfully queried city is cached in the browser's storage subsystem.

*   **Saving State**: Triggered automatically only after a successful API response.
*   **Loading State**: Triggered during the window `DOMContentLoaded` lifecycle event.

```javascript
// Save state
localStorage.setItem('lastWeatherCity', city);

// Load state
const savedCity = localStorage.getItem('lastWeatherCity');
if (savedCity) {
    getWeatherData(savedCity);
} else {
    getWeatherData('London'); // Default fallback city
}
```

## 🚀 Getting Started

### Prerequisites
Get a free API key by signing up at [WeatherAPI](https://weatherapi.com).

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com
   ```
2. **Configure your environment key:**
   Open your main JavaScript file and insert your API token into the configuration block:
   ```javascript
   const API_KEY = 'YOUR_WEATHERAPI_KEY_HERE';
   ```
3. **Launch:**
   Open `index.html` directly in any modern web browser or use a local development server.

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.
