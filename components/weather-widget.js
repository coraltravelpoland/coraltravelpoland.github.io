<!-- Weather Widget - Start -->
<div id="weather-widget-container">
    <style>
        #weather-widget-container * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        #weather-widget-container .weather-widget {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            min-width: 280px;
            max-width: 350px;
            transition: opacity 0.3s ease, transform 0.3s ease;
        }

        #weather-widget-container .weather-widget.hidden {
            display: none !important;
        }

        #weather-widget-container .weather-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 16px;
        }

        #weather-widget-container .weather-city {
            font-size: 18px;
            font-weight: 500;
            color: #333;
        }

        #weather-widget-container .weather-date {
            font-size: 13px;
            color: #999;
            margin-left: auto;
        }

        #weather-widget-container .weather-main {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 16px;
        }

        #weather-widget-container .weather-temp-icon {
            display: flex;
            align-items: center;
            gap: 12px;
            flex: 1;
        }

        #weather-widget-container .weather-temp {
            font-size: 32px;
            font-weight: 600;
            color: #333;
        }

        #weather-widget-container .weather-icon-wrapper {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 48px;
            height: 48px;
        }

        #weather-widget-container .weather-icon {
            width: 48px;
            height: 48px;
        }

        #weather-widget-container .weather-night-temp {
            font-size: 20px;
            color: #666;
            white-space: nowrap;
        }

        #weather-widget-container .weather-footer {
            display: flex;
            align-items: center;
            gap: 6px;
            padding-top: 12px;
            border-top: 1px solid #f0f0f0;
        }

        #weather-widget-container .weather-footer-icon {
            width: 20px;
            height: 20px;
            color: #666;
        }

        #weather-widget-container .weather-footer-text {
            font-size: 14px;
            color: #666;
        }

        #weather-widget-container .weather-footer-temp {
            margin-left: 4px;
            color: #333;
        }

        /* Weather Icons */
        #weather-widget-container .icon-sun {
            width: 32px;
            height: 32px;
            background: #FFD700;
            border-radius: 50%;
            position: relative;
            box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.3);
        }

        #weather-widget-container .icon-cloud {
            width: 48px;
            height: 30px;
            background: #B0BEC5;
            border-radius: 15px;
            position: relative;
        }

        #weather-widget-container .icon-cloud::before {
            content: '';
            position: absolute;
            width: 25px;
            height: 25px;
            background: #B0BEC5;
            border-radius: 50%;
            top: -10px;
            left: 10px;
        }

        #weather-widget-container .icon-partly-cloudy {
            width: 48px;
            height: 30px;
            position: relative;
        }

        #weather-widget-container .icon-partly-cloudy .sun-part {
            width: 28px;
            height: 28px;
            background: #FFD700;
            border-radius: 50%;
            position: absolute;
            top: 0;
            right: 5px;
            box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.3);
        }

        #weather-widget-container .icon-partly-cloudy .cloud-part {
            width: 35px;
            height: 20px;
            background: #90A4AE;
            border-radius: 10px;
            position: absolute;
            bottom: 0;
            left: 0;
        }

        #weather-widget-container .icon-partly-cloudy .cloud-part::before {
            content: '';
            position: absolute;
            width: 18px;
            height: 18px;
            background: #90A4AE;
            border-radius: 50%;
            top: -8px;
            left: 8px;
        }
    </style>

    <div class="weather-widget" id="weatherWidget">
        <div class="weather-header">
            <span class="weather-city" id="ww-cityName">Ładowanie...</span>
            <span class="weather-date" id="ww-dateText"></span>
        </div>
        
        <div class="weather-main">
            <div class="weather-temp-icon">
                <span class="weather-temp" id="ww-temperature">--°C</span>
                <div class="weather-icon-wrapper" id="ww-weatherIconWrapper">
                    <div class="icon-cloud"></div>
                </div>
            </div>
            <span class="weather-night-temp" id="ww-nightTemp">--°C</span>
        </div>
        
        <div class="weather-footer">
            <svg class="weather-footer-icon" viewBox="0 0 20 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0.25 10.615V9.09598C0.825667 9.06382 1.26283 8.89548 1.5615 8.59098C1.86033 8.28665 2.4565 8.13448 3.35 8.13448C4.26283 8.13448 4.883 8.30115 5.2105 8.63449C5.53817 8.96782 6.02117 9.13449 6.6595 9.13449C7.3185 9.13449 7.81183 8.96782 8.1395 8.63449C8.467 8.30115 9.08717 8.13448 10 8.13448C10.8923 8.13448 11.5125 8.30115 11.8605 8.63449C12.2087 8.96782 12.702 9.13449 13.3405 9.13449C13.9993 9.13449 14.4874 8.96782 14.8048 8.63449C15.1221 8.30115 15.7372 8.13448 16.65 8.13448C17.5435 8.13448 18.1397 8.28665 18.4385 8.59098C18.7372 8.89548 19.1743 9.06382 19.75 9.09598V10.615C18.973 10.5767 18.4105 10.4036 18.0625 10.0957C17.7145 9.78807 17.2437 9.63423 16.65 9.63423C16.018 9.63423 15.5366 9.8009 15.2057 10.1342C14.8749 10.4676 14.2532 10.6342 13.3405 10.6342C12.4482 10.6342 11.8279 10.4676 11.4798 10.1342C11.1318 9.8009 10.6385 9.63423 10 9.63423C9.341 9.63423 8.84775 9.8009 8.52025 10.1342C8.19258 10.4676 7.57233 10.6342 6.6595 10.6342C5.74683 10.6342 5.13017 10.4676 4.8095 10.1342C4.489 9.8009 4.0025 9.63423 3.35 9.63423C2.7295 9.63423 2.26025 9.78807 1.94225 10.0957C1.62442 10.4036 1.06033 10.5767 0.25 10.615ZM0.25 6.73048V5.21123C0.825667 5.17923 1.26283 5.01098 1.5615 4.70648C1.86033 4.40198 2.4565 4.24973 3.35 4.24973C4.24233 4.24973 4.85742 4.4164 5.19525 4.74973C5.53308 5.08307 6.02117 5.24973 6.6595 5.24973C7.3185 5.24973 7.81183 5.08307 8.1395 4.74973C8.467 4.4164 9.08717 4.24973 10 4.24973C10.8923 4.24973 11.51 4.4164 11.853 4.74973C12.1958 5.08307 12.6813 5.24973 13.3095 5.24973C13.9685 5.24973 14.4618 5.08307 14.7895 4.74973C15.117 4.4164 15.7372 4.24973 16.65 4.24973C17.523 4.24973 18.1192 4.40198 18.4385 4.70648C18.7577 5.01098 19.1948 5.17923 19.75 5.21123V6.73048C18.9525 6.69199 18.3848 6.5189 18.047 6.21123C17.7093 5.90357 17.2437 5.74973 16.65 5.74973C16.018 5.74973 15.5366 5.9164 15.2057 6.24973C14.8749 6.58307 14.2532 6.74973 13.3405 6.74973C12.4482 6.74973 11.8279 6.58307 11.4798 6.24973C11.1318 5.9164 10.6385 5.74973 10 5.74973C9.341 5.74973 8.85283 5.9164 8.5355 6.24973C8.21817 6.58307 7.60317 6.74973 6.6905 6.74973C5.77767 6.74973 5.15067 6.58307 4.8095 6.24973C4.4685 5.9164 3.982 5.74973 3.35 5.74973C2.75 5.74973 2.28075 5.90357 1.94225 6.21123C1.60375 6.5189 1.03967 6.69199 0.25 6.73048ZM0.25 2.84598V1.32673C0.825667 1.29457 1.26283 1.12632 1.5615 0.821985C1.86033 0.517485 2.4565 0.365234 3.35 0.365234C4.24233 0.365234 4.85742 0.531901 5.19525 0.865234C5.53308 1.19857 6.02117 1.36523 6.6595 1.36523C7.3185 1.36523 7.81183 1.19857 8.1395 0.865234C8.467 0.531901 9.08717 0.365234 10 0.365234C10.8923 0.365234 11.51 0.531901 11.853 0.865234C12.1958 1.19857 12.6813 1.36523 13.3095 1.36523C13.9685 1.36523 14.4618 1.19857 14.7895 0.865234C15.117 0.531901 15.7372 0.365234 16.65 0.365234C17.523 0.365234 18.1192 0.517485 18.4385 0.821985C18.7577 1.12632 19.1948 1.29457 19.75 1.32673V2.84598C18.9525 2.80748 18.3848 2.6344 18.047 2.32673C17.7093 2.0189 17.2437 1.86498 16.65 1.86498C16.018 1.86498 15.5366 2.03165 15.2057 2.36498C14.8749 2.69832 14.2532 2.86498 13.3405 2.86498C12.4482 2.86498 11.8279 2.69832 11.4798 2.36498C11.1318 2.03165 10.6385 1.86498 10 1.86498C9.341 1.86498 8.85283 2.03165 8.5355 2.36498C8.21817 2.69832 7.60317 2.86498 6.6905 2.86498C5.77767 2.86498 5.15067 2.69832 4.8095 2.36498C4.4685 2.03165 3.982 1.86498 3.35 1.86498C2.75 1.86498 2.27758 2.0189 1.93275 2.32673C1.58792 2.6344 1.027 2.80748 0.25 2.84598Z" fill="currentColor" fill-opacity="0.8"/>
            </svg>
            <span class="weather-footer-text">średnia temperatura wody</span>
            <span class="weather-footer-temp" id="ww-avgTemp">--°C</span>
        </div>
    </div>

    <script>
        (function() {
            // ====== KONFIGURACJA - ZMIEŃ TE WARTOŚCI ======
            const WEATHER_CONFIG = {
                city: 'Warsaw,PL',           // Miasto (format: "Miasto,KOD_KRAJU" np. "Krakow,PL", "Berlin,DE")
                tempThreshold: 20,            // Próg temperatury w °C - widget ukryje się poniżej tej wartości
                apiKey: 'bd5e378503939ddaee76f12ad7a97608',  // Twój klucz API OpenWeatherMap
                updateInterval: 600000,       // Interwał aktualizacji w ms (600000 = 10 minut)
                language: 'pl'                // Język (pl, en, de, fr, es, it, etc.)
            };
            // ============================================

            async function fetchWeatherWidget() {
                try {
                    const response = await fetch(
                        `https://api.openweathermap.org/data/2.5/weather?q=${WEATHER_CONFIG.city}&appid=${WEATHER_CONFIG.apiKey}&units=metric&lang=${WEATHER_CONFIG.language}`
                    );
                    
                    if (!response.ok) throw new Error('Weather data fetch failed');
                    
                    const data = await response.json();
                    updateWeatherWidget(data);
                } catch (error) {
                    console.error('Weather widget error:', error);
                    document.getElementById('ww-cityName').textContent = 'Błąd połączenia';
                }
            }

            function updateWeatherWidget(data) {
                const widget = document.getElementById('weatherWidget');
                const temp = Math.round(data.main.temp);
                
                // Check temperature threshold
                if (temp < WEATHER_CONFIG.tempThreshold) {
                    widget.classList.add('hidden');
                    return;
                }
                
                widget.classList.remove('hidden');
                
                // Calculate night temperature (approximation: temp_min or temp - 5°C)
                const nightTemp = Math.round(Math.min(data.main.temp_min, temp - 5));
                
                // Update data
                document.getElementById('ww-cityName').textContent = data.name;
                document.getElementById('ww-temperature').textContent = `${temp}°C`;
                document.getElementById('ww-nightTemp').textContent = `${nightTemp}°C`;
                document.getElementById('ww-avgTemp').textContent = `${temp}°C`;
                
                // Update date
                const now = new Date();
                const months = {
                    pl: ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 
                         'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'],
                    en: ['January', 'February', 'March', 'April', 'May', 'June',
                         'July', 'August', 'September', 'October', 'November', 'December']
                };
                
                const monthNames = months[WEATHER_CONFIG.language] || months['en'];
                const dateText = `${now.getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;
                document.getElementById('ww-dateText').textContent = dateText;
                
                // Update weather icon
                updateWeatherIconWidget(data.weather[0].icon);
            }

            function updateWeatherIconWidget(iconCode) {
                const wrapper = document.getElementById('ww-weatherIconWrapper');
                let iconHtml = '';
                
                if (iconCode.includes('01')) {
                    // Clear sky
                    iconHtml = '<div class="icon-sun"></div>';
                } else if (iconCode.includes('02') || iconCode.includes('03')) {
                    // Partly cloudy
                    iconHtml = `
                        <div class="icon-partly-cloudy">
                            <div class="sun-part"></div>
                            <div class="cloud-part"></div>
                        </div>
                    `;
                } else {
                    // Cloudy / Rain / Snow
                    iconHtml = '<div class="icon-cloud"></div>';
                }
                
                wrapper.innerHTML = iconHtml;
            }

            // Initialize
            fetchWeatherWidget();
            
            // Auto update
            setInterval(fetchWeatherWidget, WEATHER_CONFIG.updateInterval);
        })();
    </script>
</div>
<!-- Weather Widget - End -->