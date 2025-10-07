
const API_URL = 'https://restcountries.com/v3.1/all?fields=name,capital,population,flags';
const LS_KEY = 'favoriteCountries_v1';

// Элементы DOM //

const getCountryBtn = document.getElementById('getCountryBtn');
const countryBlock = document.getElementById('countryBlock');
const favoritesList = document.getElementById('favoritesList');
const messageEl = document.getElementById('message');

// Состояние в памяти //

let allCountries = [];  
let currentCountry = null; 
let favorites = [];      


document.addEventListener('DOMContentLoaded', init);
getCountryBtn.addEventListener('click', handleGetCountry);

function init() {
  loadFavoritesFromLocalStorage();
  renderFavoritesList();
  showMessage('Готово. Нажмите "Получить страну".', false);
  fetchAllCountries().catch(err => {
    console.warn('Не удалось заранее загрузить список стран:', err);
  });
}

/* --- Работа.API--- */

async function fetchAllCountries() {
  if (allCountries.length) return allCountries;
  showMessage('Загрузка данных стран...', false);
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('Network response not ok');
    const data = await res.json();
    allCountries = data;
    showMessage('', false);
    return allCountries;
  } catch (err) {
    showMessage('Не удалось загрузить страну. Проверьте соединение.', true);
    throw err;
  }
}

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* ---------- Обработка событий ---------- */

async function handleGetCountry() {
  try {
    await fetchAllCountries();
    const random = getRandomElement(allCountries);
    const name = random?.name?.common ?? 'Нет названия';
    const capital = Array.isArray(random?.capital) && random.capital.length ? random.capital[0] : 'Нет столицы';
    const population = typeof random?.population === 'number' ? random.population : null;
    const flag = random?.flags?.png ?? random?.flags?.svg ?? '';
    currentCountry = { name, capital, population, flag };
    renderCountry(currentCountry);
  } catch (err) {
    console.error(err);
  }
}

function handleAddToFavorites() {
  if (!currentCountry) return;
  if (favorites.some(f => f.name === currentCountry.name)) {
    showMessage('Эта страна уже в избранном.', true);
    return;
  }
  const item = { name: currentCountry.name, date: new Date().toISOString() };
  favorites.unshift(item);
  saveFavoritesToLocalStorage();
  renderFavoritesList();
  showMessage(`Добавлено в избранное: ${currentCountry.name}`, false);
}

/* ----------горизонтальныи---------- */
function renderCountry(country) {
  countryBlock.innerHTML = ''; // очистка
  
  // Основной контейнер 
  const countryContent = document.createElement('div');
  countryContent.className = 'country-content';
  
  // Левая часть
  const countryInfo = document.createElement('div');
  countryInfo.className = 'country-info';
  
  const nameEl = document.createElement('strong');
  nameEl.className = 'name';
  nameEl.textContent = country.name;
  
  const detailsEl = document.createElement('div');
  detailsEl.className = 'country-details';
  
  const capitalEl = document.createElement('p');
  capitalEl.textContent = `Столица: ${country.capital}`;
  
  const popEl = document.createElement('p');
  popEl.textContent = country.population ? `Население: ${formatNumber(country.population)}` : 'Население: неизвестно';
  
  const actionsEl = document.createElement('div');
  actionsEl.className = 'actions';
  
  const favBtn = document.createElement('button');
  favBtn.textContent = 'Добавить в избранное';
  favBtn.addEventListener('click', handleAddToFavorites);
  
  // флаг
  const flagContainer = document.createElement('div');
  flagContainer.className = 'country-flag';
  
  const flagImg = document.createElement('img');
  flagImg.alt = `Флаг ${country.name}`;
  flagImg.src = country.flag;
  flagImg.loading = 'lazy';
  
  // Собираем структуру

  detailsEl.appendChild(capitalEl);
  detailsEl.appendChild(popEl);
  
  actionsEl.appendChild(favBtn);
  
  countryInfo.appendChild(nameEl);
  countryInfo.appendChild(detailsEl);
  countryInfo.appendChild(actionsEl);
  
  flagContainer.appendChild(flagImg);
  
  countryContent.appendChild(countryInfo);
  if (country.flag) countryContent.appendChild(flagContainer);
  
  countryBlock.appendChild(countryContent);
}

/* ----------LocalStorage---------- */

function loadFavoritesFromLocalStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    favorites = raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('Ошибка чтения localStorage', err);
    favorites = [];
  }
}

function saveFavoritesToLocalStorage() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(favorites));
  } catch (err) {
    console.warn('Ошибка записи localStorage', err);
  }
}

function renderFavoritesList() {
  favoritesList.innerHTML = '';
  if (!favorites.length) {
    const li = document.createElement('li');
    li.textContent = 'Пусто';
    favoritesList.appendChild(li);
    return;
  }

  favorites.forEach(item => {
    const li = document.createElement('li');
    
    const favoriteInfo = document.createElement('div');
    favoriteInfo.className = 'favorite-info';
    favoriteInfo.innerHTML = `<strong>${item.name}</strong><div class="small">Добавлено: ${formatDate(item.date)}</div>`;
    
    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'Удалить';
    removeBtn.addEventListener('click', () => {
      favorites = favorites.filter(f => f.name !== item.name);
      saveFavoritesToLocalStorage();
      renderFavoritesList();
      showMessage(`Удалено из избранного: ${item.name}`, false);
    });
    
    li.appendChild(favoriteInfo);
    li.appendChild(removeBtn);
    favoritesList.appendChild(li);
  });
}



function formatNumber(n) {
  return n.toLocaleString('ru-RU');
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString();
}

function showMessage(text, isError = false) {
  messageEl.textContent = text;
  messageEl.style.background = isError ? '#ffe6e6' : '#e6ffe6';
  messageEl.style.color = isError ? '#b00' : '#060';
  messageEl.style.border = isError ? '1px solid #b00' : '1px solid #060';
}