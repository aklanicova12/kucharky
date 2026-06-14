// Client-side Application Logic for Digitální Kuchařky

// Utility: Remove Czech diacritics and convert to lowercase for fuzzy matching
function removeDiacritics(str) {
    if (!str) return '';
    return str.toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // remove accents
        .replace(/[^a-z0-9]/g, ' ') // replace punctuation with spaces
        .replace(/\s+/g, ' ') // collapse spaces
        .trim();
}

// Global state
const App = {
    currentView: 'home',
    activeBook: null,
    activeRecipe: null,
    activeRecipePageIndex: 0,
    searchQuery: '',
    cookingMode: false,
    
    // Checked ingredients cache
    getCheckedIngredients(recipeId) {
        try {
            const data = localStorage.getItem(`checked_ing_${recipeId}`);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    },
    
    saveCheckedIngredient(recipeId, ingredientText, isChecked) {
        try {
            let checked = this.getCheckedIngredients(recipeId);
            if (isChecked) {
                if (!checked.includes(ingredientText)) {
                    checked.push(ingredientText);
                }
            } else {
                checked = checked.filter(i => i !== ingredientText);
            }
            localStorage.setItem(`checked_ing_${recipeId}`, JSON.stringify(checked));
        } catch (e) {
            console.error('Failed to save to localStorage', e);
        }
    }
};

// Router mapping hashes to pages
function handleRoute() {
    const hash = window.location.hash || '#home';
    const container = document.getElementById('page-content');
    
    // Smooth transition: fade out current page
    container.classList.add('fade-out');
    
    setTimeout(() => {
        // Reset state between routes
        App.cookingMode = false;
        document.body.classList.remove('cooking-mode-active');
        
        if (hash === '#home' || hash === '') {
            App.currentView = 'home';
            renderHome(container);
        } else if (hash.startsWith('#book/')) {
            const bookKey = hash.split('/')[1];
            App.currentView = 'book';
            App.activeBook = bookKey;
            renderBook(container, bookKey);
        } else if (hash.startsWith('#recipe/')) {
            const recipeId = hash.split('/')[1];
            App.currentView = 'recipe';
            App.activeRecipe = recipeId;
            renderRecipe(container, recipeId);
        } else if (hash.startsWith('#search/')) {
            const query = decodeURIComponent(hash.split('/')[1] || '');
            App.currentView = 'search';
            App.searchQuery = query;
            renderSearchResults(container, query);
        } else {
            // Fallback to home
            App.currentView = 'home';
            renderHome(container);
        }
        
        // Scroll to top on page load
        window.scrollTo({ top: 0, behavior: 'instant' });
        
        // Fade in new page
        container.classList.remove('fade-out');
    }, 200);
}

// ----------------------------------------------------
// VIEW RENDERING FUNCTIONS
// ----------------------------------------------------

// 1. DOMOVSKÁ STRÁNKA (HOMEPAGE)
function renderHome(container) {
    // Books counts mapping
    const bookCounts = {
        mamincina: RECIPES.filter(r => r.bookKey === 'mamincina').length,
        sladke: RECIPES.filter(r => r.bookKey === 'sladke').length,
        vanocni: RECIPES.filter(r => r.bookKey === 'vanocni').length
    };
    
    container.innerHTML = `
        <div class="page home-page">
            <header class="hero">
                <h1 class="hero-title">Rodinné Kuchařky</h1>
                <p class="hero-subtitle">Digitální podoba rodinného kulinářského dědictví. Vyhledejte si svůj oblíbený recept napříč všemi knihami.</p>
                
                <div class="search-container">
                    <span class="search-icon">🔍</span>
                    <input type="text" id="main-search-input" class="search-input" placeholder="Vyhledat recept podle názvu nebo ingrediencí (např. tvaroh, čokoláda...)" value="${App.searchQuery}">
                </div>
                
                <div class="quick-tags">
                    <button class="tag-btn" onclick="triggerTagSearch('tvaroh')">Tvaroh</button>
                    <button class="tag-btn" onclick="triggerTagSearch('čokoláda')">Čokoláda</button>
                    <button class="tag-btn" onclick="triggerTagSearch('jablka')">Jablka</button>
                    <button class="tag-btn" onclick="triggerTagSearch('polévka')">Polévky</button>
                    <button class="tag-btn" onclick="triggerTagSearch('kuře')">Kuřecí maso</button>
                    <button class="tag-btn" onclick="triggerTagSearch('kokos')">Kokos</button>
                    <button class="tag-btn" onclick="triggerTagSearch('ořechy')">Ořechy</button>
                </div>
            </header>
            
            <main class="books-showcase">
                <!-- Book Card 1: Maminčina -->
                <div class="book-card" onclick="navigateTo('#book/mamincina')">
                    <div class="book-card-cover-wrapper">
                        <img src="images/mamincina/1.png" class="book-card-cover-img" alt="Maminčina kuchařka">
                    </div>
                    <div class="book-card-body">
                        <h2 class="book-card-title">Maminčina kuchařka</h2>
                        <p class="book-card-desc">Slané recepty, poctivé domácí polévky, omáčky, vepřové maso, kuře a tradiční bezmasá jídla.</p>
                        <div class="book-card-footer">
                            <span class="book-recipe-count">${bookCounts.mamincina} receptů ➜</span>
                        </div>
                    </div>
                </div>
                
                <!-- Book Card 2: Sladké -->
                <div class="book-card" onclick="navigateTo('#book/sladke')">
                    <div class="book-card-cover-wrapper">
                        <img src="images/sladke/1.png" class="book-card-cover-img" alt="Kousek sladkého štěstí">
                    </div>
                    <div class="book-card-body">
                        <h2 class="book-card-title">Kousek sladkého štěstí</h2>
                        <p class="book-card-desc">Bábovky, nadýchané řezy, šátečky, rolády, křehké koláče a lahodné dorty pro každou sváteční chvíli.</p>
                        <div class="book-card-footer">
                            <span class="book-recipe-count">${bookCounts.sladke} receptů ➜</span>
                        </div>
                    </div>
                </div>
                
                <!-- Book Card 3: Vánoční -->
                <div class="book-card" onclick="navigateTo('#book/vanocni')">
                    <div class="book-card-cover-wrapper">
                        <img src="images/vanocni/vanocniprofil.png" class="book-card-cover-img" alt="Tajemství vánočního stolu">
                    </div>
                    <div class="book-card-body">
                        <h2 class="book-card-title">Tajemství vánočního stolu</h2>
                        <p class="book-card-desc">Voňavé cukroví, vánočky, štoly a tradiční rodinné recepty pro nejkrásnější svátky v roce.</p>
                        <div class="book-card-footer">
                            <span class="book-recipe-count">${bookCounts.vanocni} receptů ➜</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    `;
    
    // Bind search input events
    const searchInput = document.getElementById('main-search-input');
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) {
                navigateTo(`#search/${encodeURIComponent(query)}`);
            }
        }
    });
}

function triggerTagSearch(tag) {
    navigateTo(`#search/${encodeURIComponent(tag)}`);
}

// 2. PŘEHLED RECEPTŮ KUCHAŘKY (BOOK PAGE)
function renderBook(container, bookKey) {
    const bookTitleMapping = {
        mamincina: "Maminčina kuchařka",
        sladke: "Kousek sladkého štěstí",
        vanocni: "Tajemství vánočního stolu"
    };
    
    const bookSubtitles = {
        mamincina: "Slané dobroty, polévky a omáčky z rodinného stolu",
        sladke: "Bábovky, pečení a sladké chvíle radosti",
        vanocni: "Tradiční vánoční cukroví, vánočky a sváteční atmosféra"
    };
    
    const bookRecipes = RECIPES.filter(r => r.bookKey === bookKey);
    
    // Get unique categories for filters
    const categories = ['Vše', ...new Set(bookRecipes.map(r => r.category))];
    
    container.innerHTML = `
        <div class="page book-page">
            <header class="book-header">
                <button class="back-btn" onclick="navigateTo('#home')">➜ Zpět na domů</button>
                <h1 class="book-title-main" style="margin-top: 1.5rem;">${bookTitleMapping[bookKey]}</h1>
                <p class="book-subtitle-main">${bookSubtitles[bookKey]}</p>
                
                <div class="categories-filter-bar" id="category-tabs-container">
                    ${categories.map((cat, idx) => {
                        const catIcons = {
                            'Polévky': 'polevky.png',
                            'Kuře': 'kure.png',
                            'Játra': 'jatra.png',
                            'Saláty': 'salaty.png',
                            'Vepřové maso': 'veprovemaso.png',
                            'Těstoviny a rizota': 'testovinyarizota.png',
                            'Bezmasé': 'bezmase.png',
                            'Pečivo': 'pecivo.png',
                            'Omáčky': 'omacky.png',
                            'Bábovky': 'babovky.png',
                            'Řezy': 'rezy.png',
                            'Šátečky, koblížky, dortíky': 'sateckykoblizkydorticky.png',
                            'Rolády': 'rolady.png',
                            'Buchty': 'buchty.png',
                            'Jablíčka': 'jablicka.png',
                            'Mák, tvaroh, kokos': 'maktvarohkokos.png',
                            'Dorty': 'dorty.png',
                            'Cukroví': 'cukroví.png',
                            'Vánočka': 'vanocka.png',
                            'Tradiční jídla': 'tradicnijidla.png'
                        };
                        const iconPath = catIcons[cat] ? `icons/${catIcons[cat]}` : null;
                        return `
                        <button class="category-tab ${idx === 0 ? 'active' : ''}" onclick="filterCategory('${cat}', this)">
                            ${iconPath ? `<img src="${iconPath}" class="category-tab-icon" alt="${cat}" style="width: 24px; height: 24px; vertical-align: middle; margin-right: 8px;">` : ''}
                            ${cat}
                        </button>
                    `}).join('')}
                </div>
            </header>
            
            <main class="recipes-grid-container">
                <div class="recipes-grid" id="recipes-grid">
                    ${renderRecipeCards(bookRecipes)}
                </div>
            </main>
        </div>
    `;
}

function renderRecipeCards(recipesList) {
    if (recipesList.length === 0) {
        return `
            <div class="no-results" style="grid-column: 1 / -1;">
                <p class="no-results-desc">V této kategorii nejsou žádné recepty.</p>
            </div>
        `;
    }
    
    return recipesList.map(recipe => `
        <article class="recipe-card text-only-card" onclick="navigateTo('#recipe/${recipe.id}')">
            <div class="recipe-card-body">
                <h3 class="recipe-card-title">${recipe.title}</h3>
                <hr class="recipe-card-divider">
                <div class="recipe-card-footer">
                    <span>${recipe.category.toUpperCase()}</span>
                    <span class="dot-separator">•</span>
                    <span>${recipe.ingredients.length} surovin</span>
                    <span class="dot-separator">•</span>
                    <span>str. ${recipe.startPage}</span>
                </div>
            </div>
        </article>
    `).join('');
}

// Category filter logic
window.filterCategory = function(category, tabElement) {
    // Toggle active state in tabs
    const tabs = document.querySelectorAll('.category-tab');
    tabs.forEach(t => t.classList.remove('active'));
    tabElement.classList.add('active');
    
    const bookRecipes = RECIPES.filter(r => r.bookKey === App.activeBook);
    const filtered = category === 'Vše' 
        ? bookRecipes 
        : bookRecipes.filter(r => r.category === category);
        
    const grid = document.getElementById('recipes-grid');
    grid.innerHTML = renderRecipeCards(filtered);
};

// 3. DETAIL RECEPTU (SIDE-BY-SIDE VIEW)
function renderRecipe(container, recipeId) {
    const recipe = RECIPES.find(r => r.id === recipeId);
    if (!recipe) {
        container.innerHTML = `<div class="page no-results"><h1 class="no-results-title">Recept nenalezen</h1><button class="back-btn" onclick="navigateTo('#home')">Domů</button></div>`;
        return;
    }
    
    App.activeRecipePageIndex = 0; // Reset canvas index
    const checkedIngredients = App.getCheckedIngredients(recipeId);
    
    container.innerHTML = `
        <div class="page recipe-detail-page">
            <nav class="navbar">
                <button class="back-btn" onclick="navigateTo('#book/${recipe.bookKey}')">➜ Zpět na kuchařku</button>
                <div class="navbar-brand">
                    ${recipe.title} <span>${recipe.bookTitle}</span>
                </div>
                <div></div>
            </nav>
            
            <div class="recipe-detail-container">
                <!-- LEVÝ SLOUPEC: Zobrazení stránky knihy -->
                <div class="recipe-image-side" id="recipe-image-side">
                    <div class="recipe-canvas-viewer">
                        <img id="recipe-page-image" class="recipe-canvas-image" src="${getRecipePageImagePath(recipe, 0)}" alt="Stránka ${recipe.pages[0]}">
                    </div>
                    
                    ${recipe.pages.length > 1 ? `
                        <div class="viewer-controls">
                            <button id="viewer-prev-btn" class="viewer-page-btn" onclick="changeRecipePage(-1)" disabled>◀</button>
                            <span class="viewer-page-indicator" id="viewer-page-indicator">Strana ${recipe.pages[0]} (${1} z ${recipe.pages.length})</span>
                            <button id="viewer-next-btn" class="viewer-page-btn" onclick="changeRecipePage(1)">▶</button>
                        </div>
                    ` : `
                        <div class="viewer-controls" style="justify-content: center;">
                            <span class="viewer-page-indicator">Originální stránka ${recipe.startPage}</span>
                        </div>
                    `}
                </div>
                
                <!-- PRAVÝ SLOUPEC: Interaktivní textový obsah -->
                <div class="recipe-content-side">
                    <!-- Floating decorations for secondary matched icons -->
                    ${recipe.icons && recipe.icons.length > 1 ? `
                        <div class="recipe-floating-decorations">
                            ${recipe.icons.slice(1).map((iconPath, idx) => `
                                <img src="${iconPath}" class="recipe-floating-icon decoration-${idx + 1}" alt="Dekorace receptu">
                            `).join('')}
                        </div>
                    ` : ''}

                    <div class="cooking-controls">
                        <button class="btn-cooking-mode" onclick="toggleCookingMode()">
                            🍳 Kuchařský mód (Velké písmo)
                        </button>
                    </div>
                    
                    <div class="recipe-meta-top">
                        <span class="recipe-book-tag">${recipe.bookTitle}</span>
                        <span>•</span>
                        <span>Kategorie: ${recipe.category}</span>
                        <span>•</span>
                        <span>Strana: ${recipe.pages.join(', ')}</span>
                    </div>
                    
                    <div class="recipe-title-container">
                        <h1 class="recipe-title-detail">${recipe.title}</h1>
                        ${recipe.icons && recipe.icons.length > 0 ? `
                            <div class="recipe-detail-badge-icons">
                                <img src="${recipe.icons[0]}" class="recipe-detail-badge-icon" alt="Ikona receptu">
                            </div>
                        ` : ''}
                    </div>
                    
                    <h2 class="recipe-section-title">Suroviny</h2>
                    <ul class="ingredients-list">
                        ${renderIngredients(recipe.ingredients, checkedIngredients, recipeId)}
                    </ul>
                    
                    <h2 class="recipe-section-title" style="margin-top: 2.5rem;">Postup přípravy</h2>
                    <div class="recipe-instructions">
                        ${renderInstructions(recipe.instructions)}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Return image path for specific sub-page of the recipe
function getRecipePageImagePath(recipe, idx) {
    const pageNum = recipe.pages[idx];
    return `images/${recipe.bookKey}/${pageNum}.png`;
}

// Logic for switching recipe original pages
window.changeRecipePage = function(direction) {
    const recipe = RECIPES.find(r => r.id === App.activeRecipe);
    if (!recipe || recipe.pages.length <= 1) return;
    
    let newIdx = App.activeRecipePageIndex + direction;
    if (newIdx < 0 || newIdx >= recipe.pages.length) return;
    
    App.activeRecipePageIndex = newIdx;
    
    // Update Image Source
    const imgEl = document.getElementById('recipe-page-image');
    imgEl.src = getRecipePageImagePath(recipe, newIdx);
    imgEl.alt = `Stránka ${recipe.pages[newIdx]}`;
    
    // Update page indicator text
    const indicator = document.getElementById('viewer-page-indicator');
    indicator.textContent = `Strana ${recipe.pages[newIdx]} (${newIdx + 1} z ${recipe.pages.length})`;
    
    // Update navigation button states
    document.getElementById('viewer-prev-btn').disabled = (newIdx === 0);
    document.getElementById('viewer-next-btn').disabled = (newIdx === recipe.pages.length - 1);
};

// Render ingredients list with checkboxes and headings
function renderIngredients(ingredients, checkedList, recipeId) {
    return ingredients.map((ingText, index) => {
        // Identify subheadings (like "Na těsto", "Krém", "Sub")
        const cleanIng = ingText.trim();
        const isSubheading = cleanIng.startsWith('[SUB]');
        
        if (isSubheading) {
            const headingText = cleanIng.substring(5).trim();
            return `<li class="ingredients-subheading">${headingText}</li>`;
        }
        
        const isChecked = checkedList.includes(ingText);
        const checkboxId = `ing_${recipeId}_${index}`;
        
        return `
            <li>
                <label class="ingredient-item" for="${checkboxId}">
                    <input type="checkbox" id="${checkboxId}" ${isChecked ? 'checked' : ''} onchange="onIngredientCheckChange('${recipeId}', '${ingText.replace(/'/g, "\\'")}', this)">
                    <span class="checkbox-custom"></span>
                    <span class="ingredient-text">${ingText}</span>
                </label>
            </li>
        `;
    }).join('');
}

// Handle checkbox change event
window.onIngredientCheckChange = function(recipeId, ingredientText, checkboxEl) {
    App.saveCheckedIngredient(recipeId, ingredientText, checkboxEl.checked);
};

// Format instructions markdown/paragraphs
function renderInstructions(instructionsText) {
    if (!instructionsText) return '<p>Postup přípravy nebyl zadán.</p>';
    
    const paragraphs = instructionsText.split('\n\n');
    return paragraphs.map(p => {
        const cleanP = p.trim();
        const lowerP = cleanP.toLowerCase();
        
        const isSpecialNote = (
            lowerP.startsWith('tip:') || 
            lowerP.startsWith('poznámka:') || 
            lowerP.startsWith('poznamka:') || 
            lowerP.startsWith('inspirace:') || 
            lowerP.startsWith('rady:') || 
            lowerP.startsWith('rady ptáka loskutáka:') || 
            lowerP.startsWith('rady ptaka loskutaka:') ||
            lowerP.startsWith('doporučení:') ||
            lowerP.startsWith('doporuceni:') ||
            lowerP.startsWith('pozn.:')
        );
        
        if (isSpecialNote) {
            return `<p class="recipe-tip">${cleanP}</p>`;
        }
        return `<p>${cleanP}</p>`;
    }).join('');
}

// Cooking Mode toggle
window.toggleCookingMode = function() {
    App.cookingMode = !App.cookingMode;
    const body = document.body;
    
    if (App.cookingMode) {
        body.classList.add('cooking-mode-active');
        const btn = document.querySelector('.btn-cooking-mode');
        if (btn) btn.textContent = '🍳 Vypnout kuchařský mód';
    } else {
        body.classList.remove('cooking-mode-active');
        const btn = document.querySelector('.btn-cooking-mode');
        if (btn) btn.textContent = '🍳 Kuchařský mód (Velké písmo)';
    }
};

// 4. VYHLEDÁVÁNÍ (SEARCH RESULTS VIEW)
function renderSearchResults(container, query) {
    const cleanedQuery = removeDiacritics(query);
    
    // Fuzzy filter recipes
    const matches = RECIPES.filter(recipe => {
        const cleanTitle = removeDiacritics(recipe.title);
        const cleanCategory = removeDiacritics(recipe.category);
        const cleanBook = removeDiacritics(recipe.bookTitle);
        
        // Search in title, book title, category
        if (cleanTitle.includes(cleanedQuery) || cleanCategory.includes(cleanedQuery) || cleanBook.includes(cleanedQuery)) {
            return true;
        }
        
        // Search in ingredients list
        const ingredientsMatch = recipe.ingredients.some(ing => {
            return removeDiacritics(ing).includes(cleanedQuery);
        });
        if (ingredientsMatch) return true;
        
        return false;
    });
    
    container.innerHTML = `
        <div class="page search-results-page">
            <header class="search-results-header">
                <button class="back-btn" onclick="navigateTo('#home')">➜ Zpět na domů</button>
                <h1 class="search-results-title" style="margin-top: 1.5rem;">Výsledky vyhledávání pro: <span class="search-results-query">"${query}"</span></h1>
                <p class="book-subtitle-main">Nalezeno celkem ${matches.length} receptů napříč všemi kuchařkami</p>
                
                <div class="search-container" style="max-width: 500px; margin: 1.5rem auto 0 auto; box-shadow: none;">
                    <span class="search-icon">🔍</span>
                    <input type="text" id="navbar-search-input" class="search-input" placeholder="Hledat jiný recept..." value="${query}">
                </div>
            </header>
            
            <main class="recipes-grid-container">
                ${matches.length > 0 ? `
                    <div class="recipes-grid">
                        ${matches.map(recipe => `
                            <article class="recipe-card text-only-card" onclick="navigateTo('#recipe/${recipe.id}')">
                                <div class="recipe-card-body">
                                    <h3 class="recipe-card-title">${recipe.title}</h3>
                                    <hr class="recipe-card-divider">
                                    <div class="recipe-card-footer">
                                        <span>${recipe.bookTitle.toUpperCase()} - ${recipe.category.toUpperCase()}</span>
                                        <span class="dot-separator">•</span>
                                        <span>${recipe.ingredients.length} surovin</span>
                                        <span class="dot-separator">•</span>
                                        <span>str. ${recipe.startPage}</span>
                                    </div>
                                </div>
                            </article>
                        `).join('')}
                    </div>
                ` : `
                    <div class="no-results">
                        <div class="no-results-icon">🤷</div>
                        <h2 class="no-results-title">Nebylo nic nalezeno</h2>
                        <p class="no-results-desc">Zkuste zadat jednodušší výraz (např. tvaroh, cibule, bábovka, kuře) nebo zkontrolujte pravopis.</p>
                    </div>
                `}
            </main>
        </div>
    `;
    
    // Bind input handler for new searches
    const searchInput = document.getElementById('navbar-search-input');
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const newQuery = searchInput.value.trim();
            if (newQuery) {
                navigateTo(`#search/${encodeURIComponent(newQuery)}`);
            }
        }
    });
}

// ----------------------------------------------------
// NAVIGATION AND EVENT HANDLERS
// ----------------------------------------------------
function navigateTo(hash) {
    window.location.hash = hash;
}

// Listen to Hash Changes
window.addEventListener('hashchange', handleRoute);

// Listen to Initial Page Load
window.addEventListener('DOMContentLoaded', () => {
    // Run router initial check
    handleRoute();
});
