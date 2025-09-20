// Configuration des sources de deals (sources étendues + nouvelles catégories)
const sourcesDeals = {
    // Sources principales très fiables
    "dealabs_top": {
        nom: "Dealabs (Top)",
        rss: "https://www.dealabs.com/rss/top",
        categorie: "Divers"
    },
    "dealabs_hot": {
        nom: "Dealabs (Hot)",
        rss: "https://www.dealabs.com/rss/hot",
        categorie: "Divers"
    },
    "hotukdeals_hot": {
        nom: "HotUKDeals (Hot)",
        rss: "https://www.hotukdeals.com/rss/hot",
        categorie: "Divers"
    },
    "hotukdeals_deals": {
        nom: "HotUKDeals (Deals)",
        rss: "https://www.hotukdeals.com/rss/deals",
        categorie: "Divers"
    },
    
    // Électronique et Tech
    "dealabs_informatique": {
        nom: "Dealabs (Informatique)",
        rss: "https://www.dealabs.com/rss/groupe/informatique",
        categorie: "Électronique"
    },
    "dealabs_telephonie": {
        nom: "Dealabs (Téléphonie)",
        rss: "https://www.dealabs.com/rss/groupe/telephonie",
        categorie: "Électronique"
    },
    "dealabs_jeux": {
        nom: "Dealabs (Jeux Vidéo)",
        rss: "https://www.dealabs.com/rss/groupe/jeux-video",
        categorie: "Électronique"
    },
    "dealabs_photo": {
        nom: "Dealabs (Photo & Vidéo)",
        rss: "https://www.dealabs.com/rss/groupe/photo-et-video",
        categorie: "Électronique"
    },
    
    // Mode et Beauté
    "dealabs_mode": {
        nom: "Dealabs (Mode)",
        rss: "https://www.dealabs.com/rss/groupe/vetements-et-accessoires",
        categorie: "Vêtements"
    },
    "dealabs_chaussures": {
        nom: "Dealabs (Chaussures)",
        rss: "https://www.dealabs.com/rss/groupe/chaussures",
        categorie: "Vêtements"
    },
    "dealabs_beaute": {
        nom: "Dealabs (Beauté & Santé)",
        rss: "https://www.dealabs.com/rss/groupe/beaute-et-sante",
        categorie: "Beauté & Santé"
    },
    
    // Maison et Jardin
    "dealabs_maison": {
        nom: "Dealabs (Maison)",
        rss: "https://www.dealabs.com/rss/groupe/maison-et-jardin",
        categorie: "Maison"
    },
    "dealabs_bricolage": {
        nom: "Dealabs (Bricolage)",
        rss: "https://www.dealabs.com/rss/groupe/bricolage-et-jardinage",
        categorie: "Maison"
    },
    "dealabs_electromenager": {
        nom: "Dealabs (Électroménager)",
        rss: "https://www.dealabs.com/rss/groupe/electromenager",
        categorie: "Maison"
    },
    
    // Sports et Loisirs
    "dealabs_sport": {
        nom: "Dealabs (Sports)",
        rss: "https://www.dealabs.com/rss/groupe/sports-et-loisirs",
        categorie: "Sports & Loisirs"
    },
    "dealabs_voyage": {
        nom: "Dealabs (Voyages)",
        rss: "https://www.dealabs.com/rss/groupe/voyages",
        categorie: "Voyages"
    },
    "dealabs_auto": {
        nom: "Dealabs (Auto & Moto)",
        rss: "https://www.dealabs.com/rss/groupe/auto-et-moto",
        categorie: "Auto & Moto"
    },
    
    // TV, Vidéo et Télécoms
    "dealabs_tv": {
        nom: "Dealabs (TV & Vidéo)",
        rss: "https://www.dealabs.com/rss/groupe/tv-video",
        categorie: "TV & Vidéo"
    },
    "dealabs_telecom": {
        nom: "Dealabs (Télécoms)",
        rss: "https://www.dealabs.com/rss/groupe/telecommunications",
        categorie: "Téléphonie/Mobile"
    },
    
    // Alimentation et Courses
    "dealabs_alimentation": {
        nom: "Dealabs (Alimentation)",
        rss: "https://www.dealabs.com/rss/groupe/alimentation-et-boissons",
        categorie: "Alimentation"
    },
    "dealabs_epicerie": {
        nom: "Dealabs (Courses)",
        rss: "https://www.dealabs.com/rss/groupe/courses-et-supermarches",
        categorie: "Alimentation"
    },
    
    // Livres, Culture et Enfants
    "dealabs_livres": {
        nom: "Dealabs (Livres & Culture)",
        rss: "https://www.dealabs.com/rss/groupe/livres-et-culture",
        categorie: "Culture & Livres"
    },
    "dealabs_enfants": {
        nom: "Dealabs (Enfants & Bébé)",
        rss: "https://www.dealabs.com/rss/groupe/enfants-et-bebe",
        categorie: "Enfants & Bébé"
    }
};

// Cache pour les offres
let offresCache = {};
let dernierChargement = null;

// Fonction pour ajouter un délai entre les requêtes
function delai(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Fonction pour charger les deals depuis RSS avec gestion des erreurs améliorée
async function chargerDealsDepuisRSS(url) {
    try {
        // Utilisation d'un proxy CORS pour éviter les problèmes de cross-origin
        const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        
        // Gérer les erreurs de limite de taux
        if (response.status === 429) {
            console.warn('Limite de taux atteinte pour:', url);
            return [];
        }
        
        if (!response.ok) {
            console.warn(`Erreur HTTP ${response.status} pour:`, url);
            return [];
        }
        
        const data = await response.json();

        if (data.status === 'ok' && data.items) {
            return data.items.map(item => ({
                titre: item.title || 'Titre non disponible',
                description: (item.description || '').replace(/<[^>]*>/g, '').substring(0, 150) + '...',
                prix: extrairePrix(item.description) || "Prix non spécifié",
                image: extraireImage(item.description) || "https://via.placeholder.com/300x200?text=Deal",
                lien: item.link || '#',
                vendeur: item.author || "Marchand",
                date: new Date(item.pubDate || Date.now()),
                categorie: determinerCategorie((item.title || '') + ' ' + (item.description || ''))
            }));
        }
        return [];
    } catch (error) {
        console.error('Erreur lors du chargement des deals depuis:', url, error);
        return [];
    }
}

// Fonction pour extraire le pourcentage de réduction (améliorée)
function extrairePourcentageReduction(texte) {
    // Patterns pour différents formats de réduction
    const patterns = [
        /-(\d+)%/gi,                    // -37%
        /(\d+)%\s*de\s*réduction/gi,    // 37% de réduction
        /(\d+)%\s*off/gi,               // 37% off
        /réduction\s*de\s*(\d+)%/gi,    // réduction de 37%
        /économisez\s*(\d+)%/gi,        // économisez 37%
        /promo\s*-(\d+)%/gi             // promo -37%
    ];
    
    for (const pattern of patterns) {
        const matches = texte.match(pattern);
        if (matches && matches.length > 0) {
            const numbers = matches[0].match(/\d+/g);
            if (numbers && numbers.length > 0) {
                return parseInt(numbers[0]);
            }
        }
    }
    return 0;
}

// Fonction pour extraire les prix avant/après (comme sur Amazon)
function extrairePrixAvantApres(texte) {
    // Patterns pour prix avant/après : "1499€ -> 949€" ou "de 1499€ à 949€"
    const regexPrixComparaison = /(\d+[.,]?\d*)\s*€?\s*(?:->|à)\s*(\d+[.,]?\d*)\s*€?/gi;
    const regexPrixBarre = /~~(\d+[.,]?\d*)~~\s*(\d+[.,]?\d*)/gi; // Prix barré
    
    let match = texte.match(regexPrixComparaison);
    if (match) {
        const prixAvant = match[0].match(/(\d+[.,]?\d*)/g);
        if (prixAvant && prixAvant.length >= 2) {
            return `${prixAvant[1]}€ (était ${prixAvant[0]}€)`;
        }
    }
    
    match = texte.match(regexPrixBarre);
    if (match) {
        const prixAvant = match[0].match(/(\d+[.,]?\d*)/g);
        if (prixAvant && prixAvant.length >= 2) {
            return `${prixAvant[1]}€ (était ${prixAvant[0]}€)`;
        }
    }
    
    return null;
}

// Fonction pour filtrer les offres par pourcentage de réduction
function filtrerParReduction(offres, pourcentageMin = 50) {
    return offres.filter(offre => {
        const reduction = extrairePourcentageReduction(offre.titre + ' ' + offre.description + ' ' + offre.prix);
        return reduction >= pourcentageMin;
    });
}

// Fonction pour extraire le prix du texte (optimisée pour les réductions Amazon)
function extrairePrix(texte) {
    // D'abord chercher les prix avant/après
    const prixComparaison = extrairePrixAvantApres(texte);
    if (prixComparaison) {
        return prixComparaison;
    }
    
    // Chercher les pourcentages de réduction avec icône
    const regexPrixReduc = /(\d+%\s*de\s*réduction|\d+%\s*off|-\d+%)/gi;
    const matchesReduc = texte.match(regexPrixReduc);
    if (matchesReduc && matchesReduc.length > 0) {
        const pourcentage = extrairePourcentageReduction(matchesReduc[0]);
        if (pourcentage >= 25) { // Seulement si réduction significative
            return `🔥 ${matchesReduc[0]}`;
        }
    }
    
    // Sinon chercher les prix normaux
    const regexPrix = /[£€$]\s*\d+(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?\s*[£€$]/gi;
    const matches = texte.match(regexPrix);
    if (matches && matches.length > 0) {
        let prix = matches[0].replace(/\s+/g, '').trim();
        return prix;
    }
    return "Prix non spécifié";
}

// Fonction pour extraire l'image du texte
function extraireImage(texte) {
    const regexImage = /<img[^>]+src="([^">]+)"/i;
    const match = texte.match(regexImage);
    return match ? match[1] : null;
}

// Fonction pour déterminer la catégorie d'un deal (corrigée et plus précise)
function determinerCategorie(texte) {
    const texteMin = texte.toLowerCase();
    
    // Amazon - priorité maximale
    if (/amazon|amzn|prime\s*day|black\s*friday|cyber\s*monday/i.test(texte)) {
        return "Amazon";
    }
    
    // Électronique - très spécifique
    if (/ordinateur|pc\s|laptop|portable|gaming|rtx|radeon|intel|amd|ryzen|processeur|carte\s*graphique|ssd|ram|go\s|to\s|motherboard|gpu|cpu/i.test(texte)) {
        return "Électronique";
    }
    
    // Jeux vidéo (sous-catégorie d'électronique)
    if (/jeu\s|game|gta|playstation|xbox|nintendo|steam|epic\s*games|console|manette/i.test(texte)) {
        return "Électronique";
    }
    
    // Téléphonie/Mobile
    if (/iphone|samsung\s*galaxy|smartphone|mobile|forfait|appel|sms|data|4g|5g|orange|sfr|free|bouygues|téléphone/i.test(texte)) {
        return "Téléphonie/Mobile";
    }
    
    // TV & Vidéo
    if (/tv\s|télé|écran|moniteur|projecteur|home\s*cinema|netflix|disney|streaming|vidéo|blu.?ray|dvd|fire\s*stick/i.test(texte)) {
        return "TV & Vidéo";
    }
    
    // Montres et bijoux (souvent mal catégorisées)
    if (/montre|tudor|rolex|omega|casio|bijou|bracelet|collier|bague/i.test(texte)) {
        return "Vêtements";
    }
    
    // Vêtements
    if (/vêtement|chaussure|jean|pantalon|pull|t.?shirt|robe|jupe|manteau|chapeau|nike|adidas|mode|fashion|clothing/i.test(texte)) {
        return "Vêtements";
    }
    
    // Beauté & Santé
    if (/beauté|cosmétique|parfum|soin|santé|maquillage|shampooing|crème|dentifrice|vitamines/i.test(texte)) {
        return "Beauté & Santé";
    }
    
    // Maison
    if (/meuble|décoration|ustensile|cuisine|literie|linge|jardin|bricolage|électroménager|aspirateur|frigo|lave/i.test(texte)) {
        return "Maison";
    }
    
    // Sports & Loisirs (plus précis)
    if (/sport|vélo|fitness|muscu|course|natation|tennis|golf|camping|randonnée|running|marathon/i.test(texte)) {
        return "Sports & Loisirs";
    }
    
    // Voyages
    if (/voyage|vacances|hôtel|vol|avion|train|séjour|location|airbnb|booking/i.test(texte)) {
        return "Voyages";
    }
    
    // Auto & Moto (plus précis - éviter confusion avec jeux)
    if (/voiture|auto|moto|pneu|essence|garage|assurance|permis|carburant|véhicule|bmw|mercedes|audi|volkswagen/i.test(texte) && !/jeu|game|gta/i.test(texte)) {
        return "Auto & Moto";
    }
    
    // Alimentation
    if (/alimentation|nourriture|boisson|restaurant|épicerie|supermarché|courses|bio|vin|café|chocolat|pizza/i.test(texte)) {
        return "Alimentation";
    }
    
    // Culture & Livres
    if (/livre|bd|manga|cinéma|théâtre|concert|musique|culture|lecture|roman/i.test(texte)) {
        return "Culture & Livres";
    }
    
    // Enfants & Bébé
    if (/enfant|bébé|jouet|poussette|biberon|couche|lait|puériculture|école|cartable/i.test(texte)) {
        return "Enfants & Bébé";
    }
    
    return "Divers";
}

// Fonction pour charger toutes les offres
async function chargerToutesLesOffres() {
    const maintenant = new Date();

    // Vérifier si on a des données en cache récentes (moins de 30 minutes)
    if (dernierChargement && (maintenant - dernierChargement) < 30 * 60 * 1000) {
        return offresCache;
    }

    const offresParCategorie = {
        "Électronique": [],
        "Vêtements": [],
        "Beauté & Santé": [],
        "Maison": [],
        "Sports & Loisirs": [],
        "Voyages": [],
        "Auto & Moto": [],
        "Téléphonie/Mobile": [],
        "TV & Vidéo": [],
        "Alimentation": [],
        "Culture & Livres": [],
        "Enfants & Bébé": [],
        "Amazon": [],
        "Divers": []
    };

    // Charger depuis toutes les sources RSS avec délais
    let sourceIndex = 0;
    for (const [sourceId, source] of Object.entries(sourcesDeals)) {
        try {
            console.log(`Chargement de ${source.nom}...`);
            
            // Ajouter un délai entre chaque requête (sauf pour la première)
            if (sourceIndex > 0) {
                await delai(500); // Réduire le délai à 0.5 secondes
            }
            
            const deals = await chargerDealsDepuisRSS(source.rss);
            
            deals.forEach(deal => {
                // Utiliser la catégorie définie dans la source, ou déterminer automatiquement
                const categorie = source.categorie !== "Divers" ? source.categorie : determinerCategorie(deal.titre + ' ' + deal.description);
                
                if (offresParCategorie[categorie]) {
                    deal.categorie = categorie;
                    deal.source = source.nom;
                    offresParCategorie[categorie].push(deal);
                } else {
                    deal.categorie = "Divers";
                    deal.source = source.nom;
                    offresParCategorie["Divers"].push(deal);
                }
            });
            
            sourceIndex++;
        } catch (error) {
            console.error(`Erreur chargement ${source.nom}:`, error);
        }
    }

    // Trier par date (plus récent en premier) et limiter à 75 par catégorie
    Object.keys(offresParCategorie).forEach(categorie => {
        offresParCategorie[categorie] = offresParCategorie[categorie]
            .sort((a, b) => (b.date || new Date()) - (a.date || new Date()))
            .slice(0, 75);
    });

    offresCache = offresParCategorie;
    dernierChargement = maintenant;

    return offresParCategorie;
}

// État de l'application
let categorieActuelle = null;
let offresData = {};
let motRecherche = '';
let pageActuelle = 1;
let itemsParPage = 24;
let offresFiltrees = []; // Stocke toutes les offres filtrées (recherche + catégorie)

// Fonction pour initialiser le dropdown des catégories
function initialiserDropdownCategories() {
    const categorySelect = document.getElementById('category-select');
    
    // Vider les options existantes (sauf "Toutes les catégories")
    categorySelect.innerHTML = '<option value="">Toutes les catégories</option>';
    
    // Ajouter les catégories disponibles
    Object.keys(offresData).forEach(categorie => {
        if (offresData[categorie] && offresData[categorie].length > 0) {
            const option = document.createElement('option');
            option.value = categorie;
            option.textContent = categorie;
            categorySelect.appendChild(option);
        }
    });
    
    // Événement de changement de catégorie
    categorySelect.addEventListener('change', (e) => {
        categorieActuelle = e.target.value || null;
        pageActuelle = 1; // Retour à la première page lors du changement de catégorie
        afficherOffres();
    });
}

// Fonction pour initialiser la recherche
function initialiserRecherche() {
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    
    function effectuerRecherche() {
        motRecherche = searchInput.value.toLowerCase().trim();
        pageActuelle = 1; // Retour à la première page lors d'une nouvelle recherche
        afficherOffres();
    }
    
    // Recherche en temps réel
    searchInput.addEventListener('input', effectuerRecherche);
    
    // Recherche au clic
    searchButton.addEventListener('click', effectuerRecherche);
    
    // Recherche avec la touche Entrée
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            effectuerRecherche();
        }
    });
}

// Fonction pour initialiser la pagination
function initialiserPagination() {
    const itemsSelect = document.getElementById('items-select');
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');
    
    // Gestion du changement du nombre d'éléments par page
    itemsSelect.addEventListener('change', (e) => {
        itemsParPage = parseInt(e.target.value);
        pageActuelle = 1; // Retour à la première page
        afficherOffres();
    });
    
    // Gestion des boutons précédent/suivant
    prevButton.addEventListener('click', () => {
        if (pageActuelle > 1) {
            pageActuelle--;
            afficherOffres();
            // Scroll vers le haut des offres
            document.getElementById('offres-container').scrollIntoView({ behavior: 'smooth' });
        }
    });
    
    nextButton.addEventListener('click', () => {
        const totalPages = Math.ceil(offresFiltrees.length / itemsParPage);
        if (pageActuelle < totalPages) {
            pageActuelle++;
            afficherOffres();
            // Scroll vers le haut des offres
            document.getElementById('offres-container').scrollIntoView({ behavior: 'smooth' });
        }
    });
}

// Fonction pour créer les numéros de page
function creerNumerosPagination(pageActuelle, totalPages) {
    const pageNumbers = document.getElementById('page-numbers');
    pageNumbers.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    const maxPagesVisibles = 7;
    let startPage = Math.max(1, pageActuelle - Math.floor(maxPagesVisibles / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesVisibles - 1);
    
    // Ajuster le début si on est près de la fin
    if (endPage - startPage < maxPagesVisibles - 1) {
        startPage = Math.max(1, endPage - maxPagesVisibles + 1);
    }
    
    // Première page et ellipses si nécessaire
    if (startPage > 1) {
        ajouterBoutonPage(1, pageActuelle);
        if (startPage > 2) {
            ajouterEllipses();
        }
    }
    
    // Pages visibles
    for (let i = startPage; i <= endPage; i++) {
        ajouterBoutonPage(i, pageActuelle);
    }
    
    // Ellipses et dernière page si nécessaire
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            ajouterEllipses();
        }
        ajouterBoutonPage(totalPages, pageActuelle);
    }
}

// Fonction pour ajouter un bouton de page
function ajouterBoutonPage(numeroPage, pageActuelle) {
    const pageNumbers = document.getElementById('page-numbers');
    const button = document.createElement('div');
    button.className = `page-number ${numeroPage === pageActuelle ? 'active' : ''}`;
    button.textContent = numeroPage;
    button.addEventListener('click', () => {
        if (numeroPage !== pageActuelle) {
            pageActuelle = numeroPage;
            window.pageActuelle = pageActuelle; // Mettre à jour la variable globale
            afficherOffres();
            // Scroll vers le haut des offres
            document.getElementById('offres-container').scrollIntoView({ behavior: 'smooth' });
        }
    });
    pageNumbers.appendChild(button);
}

// Fonction pour ajouter des ellipses
function ajouterEllipses() {
    const pageNumbers = document.getElementById('page-numbers');
    const ellipses = document.createElement('div');
    ellipses.className = 'page-ellipsis';
    ellipses.textContent = '...';
    pageNumbers.appendChild(ellipses);
}

// Fonction pour mettre à jour les contrôles de pagination
function mettreAJourControllesPagination() {
    const totalPages = Math.ceil(offresFiltrees.length / itemsParPage);
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');
    const paginationInfo = document.getElementById('pagination-info');
    
    // Mettre à jour les boutons
    prevButton.disabled = pageActuelle <= 1;
    nextButton.disabled = pageActuelle >= totalPages;
    
    // Mettre à jour les informations
    if (offresFiltrees.length > 0) {
        const debut = (pageActuelle - 1) * itemsParPage + 1;
        const fin = Math.min(pageActuelle * itemsParPage, offresFiltrees.length);
        paginationInfo.textContent = `Affichage de ${debut} à ${fin} sur ${offresFiltrees.length} offres`;
    } else {
        paginationInfo.textContent = 'Aucune offre à afficher';
    }
    
    // Créer les numéros de page
    creerNumerosPagination(pageActuelle, totalPages);
}

// Fonction pour afficher les offres avec recherche, filtrage et pagination
async function afficherOffres() {
    const offresContainer = document.getElementById('offres-container');
    const offersCountElement = document.getElementById('offers-count') || document.querySelector('.offers-count');
    
    offresContainer.innerHTML = '<div class="loading">Chargement des offres...</div>';

    try {
        // Charger les offres si nécessaire
        if (Object.keys(offresData).length === 0) {
            offresData = await chargerToutesLesOffres();
            initialiserDropdownCategories(); // Initialiser le dropdown après le chargement
        }

        offresContainer.innerHTML = '';

        let offresAAfficher = [];

        // Filtrer par catégorie
        if (categorieActuelle) {
            offresAAfficher = offresData[categorieActuelle] || [];
        } else {
            // Afficher toutes les offres
            Object.values(offresData).forEach(offres => {
                offresAAfficher = offresAAfficher.concat(offres);
            });
        }

        // Filtrer par recherche
        if (motRecherche) {
            offresAAfficher = offresAAfficher.filter(offre => {
                return offre.titre.toLowerCase().includes(motRecherche) ||
                       offre.description.toLowerCase().includes(motRecherche) ||
                       offre.vendeur.toLowerCase().includes(motRecherche) ||
                       offre.prix.toLowerCase().includes(motRecherche);
            });
        }

        // Filtre spécial : Prioriser les offres avec plus de 25% de réduction
        const offresForteReduction = filtrerParReduction(offresAAfficher, 25);
        const autresOffres = offresAAfficher.filter(offre => {
            const reduction = extrairePourcentageReduction(offre.titre + ' ' + offre.description + ' ' + offre.prix);
            return reduction < 25;
        });

        // Combiner : d'abord les fortes réductions, puis les autres
        offresFiltrees = [...offresForteReduction, ...autresOffres];

        if (offresFiltrees.length === 0) {
            const messageVide = motRecherche ? 
                `Aucune offre trouvée pour "${motRecherche}"` : 
                'Aucune offre trouvée dans cette catégorie.';
            offresContainer.innerHTML = `<div class="loading">${messageVide}</div>`;
            if (offersCountElement) {
                offersCountElement.textContent = '';
            }
            // Cacher les contrôles de pagination
            document.querySelector('.pagination-container').style.display = 'none';
            return;
        }

        // Afficher les contrôles de pagination
        document.querySelector('.pagination-container').style.display = 'flex';

        // Calculer la pagination
        const totalPages = Math.ceil(offresFiltrees.length / itemsParPage);
        const debut = (pageActuelle - 1) * itemsParPage;
        const fin = debut + itemsParPage;
        const offresPage = offresFiltrees.slice(debut, fin);

        // Vérifier que la page actuelle est valide
        if (pageActuelle > totalPages && totalPages > 0) {
            pageActuelle = 1;
            return afficherOffres(); // Réafficher avec la première page
        }

        // Afficher le nombre de résultats
        if (offersCountElement) {
            offersCountElement.textContent = `${offresFiltrees.length} offre(s) trouvée(s)`;
        }

        // Afficher les offres de la page actuelle
        offresPage.forEach(offre => {
            const offreElement = creerElementOffre(offre);
            offresContainer.appendChild(offreElement);
        });

        // Mettre à jour les contrôles de pagination
        mettreAJourControllesPagination();

    } catch (error) {
        console.error('Erreur lors de l\'affichage des offres:', error);
        offresContainer.innerHTML = '<div class="loading">Erreur lors du chargement des offres.</div>';
        if (offersCountElement) {
            offersCountElement.textContent = '';
        }
        // Cacher les contrôles de pagination en cas d'erreur
        document.querySelector('.pagination-container').style.display = 'none';
    }
}

// Fonction pour créer un élément d'offre
function creerElementOffre(offre) {
    const div = document.createElement('div');
    div.className = 'offer-card';

    // Calculer et afficher le pourcentage de réduction si disponible
    const pourcentageReduction = extrairePourcentageReduction(offre.titre + ' ' + offre.description + ' ' + offre.prix);
    const reductionBadge = pourcentageReduction >= 25 ? 
        `<div class="reduction-badge">🔥 RÉDUCTION ${pourcentageReduction}%</div>` : '';

    // Vérifier si l'offre a une date d'expiration
    let expirationHTML = '';
    if (offre.dateExpiration) {
        const dateExpiration = new Date(offre.dateExpiration);
        const maintenant = new Date();
        const joursRestants = Math.ceil((dateExpiration - maintenant) / (1000 * 60 * 60 * 24));

        let classeExpiration = 'expiration-normal';
        if (joursRestants <= 7) {
            classeExpiration = 'expiration-urgent';
        } else if (joursRestants <= 30) {
            classeExpiration = 'expiration-bientot';
        }

        expirationHTML = `<div class="expiration ${classeExpiration}">Expire le: ${dateExpiration.toLocaleDateString('fr-FR')} (${joursRestants} jours)</div>`;
    }

    // Affichage de la source
    const sourceHTML = offre.source ? `<div class="offer-source">Source: ${offre.source}</div>` : '';

    div.innerHTML = `
        ${reductionBadge}
        <img src="${offre.image}" alt="${offre.titre}" class="offer-image" onerror="this.src='https://via.placeholder.com/300x200?text=Offre'">
        <div class="offer-content">
            <h3 class="offer-title">${offre.titre}</h3>
            <p class="offer-description">${offre.description}</p>
            <div class="offer-price">${offre.prix}</div>
            <div class="offer-meta">
                Vendu par: ${offre.vendeur}
                ${sourceHTML}
                ${expirationHTML}
            </div>
            <a href="${offre.lien}" target="_blank" class="offer-link">Voir l'offre</a>
        </div>
    `;

    return div;
}

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', function() {
    initialiserRecherche();
    initialiserPagination();
    afficherOffres();
});
