const CACHE_NAME = "weather-app-shell-v2";
const ASSETS_TO_CACHE = [
    "/",
    "/index.html",
    "/style.css",
    "/script.js",
    "/manifest.json",
    "/favicon.svg",
    "/logo.svg",
    "/icon-sunny.svg",
    "/icon-cloudy.svg",
    "/icon-rain.svg",
    "/icon-snow.svg",
    "/icon-thunderstorm.svg",
    "/icon-fog.svg",
    "/icon-overcast.svg"
];

self.addEventListener("install", (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE)).catch(() => { })
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (event) => {
    if (event.request.url.includes("api.weatherapi.com")) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || fetch(event.request);
        })
    );
});
