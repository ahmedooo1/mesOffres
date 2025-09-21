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

// Mock data for demonstration when RSS feeds are blocked
const mockOffres = [
    {
        titre: "MacBook Air M2 13\" - 256GB SSD",
        description: "Ordinateur portable ultra-léger avec puce M2 d'Apple, 8GB RAM, écran Retina 13.6\"",
        prix: "€1,199.99",
        vendeur: "Apple Store",
        lien: "#",
        image: "https://via.placeholder.com/300x200/007bff/ffffff?text=MacBook+Air",
        source: "Dealabs",
        categorie: "Électronique",
        date: new Date(2024, 0, 15)
    },
    {
        titre: "Samsung Galaxy S24 Ultra - 512GB",
        description: "Smartphone Android avec S Pen, écran 6.8\" Dynamic AMOLED, caméra 200MP",
        prix: "€1,449.99",
        vendeur: "Samsung",
        lien: "#",
        image: "https://via.placeholder.com/300x200/28a745/ffffff?text=Galaxy+S24",
        source: "HotUKDeals",
        categorie: "Électronique",
        date: new Date(2024, 0, 20)
    },
    {
        titre: "Nike Air Jordan 1 Mid - 40% de réduction",
        description: "Baskets emblématiques en cuir, coloris Black/White/Red, tailles disponibles 38-46",
        prix: "€89.99",
        vendeur: "Nike",
        lien: "#",
        image: "https://via.placeholder.com/300x200/dc3545/ffffff?text=Air+Jordan",
        source: "Dealabs",
        categorie: "Vêtements",
        date: new Date(2024, 0, 18)
    },
    {
        titre: "Sony WH-1000XM5 - Casque sans fil",
        description: "Casque audio avec réduction de bruit active, autonomie 30h, qualité Hi-Res",
        prix: "€349.99",
        vendeur: "Sony",
        lien: "#",
        image: "https://via.placeholder.com/300x200/6f42c1/ffffff?text=Sony+Casque",
        source: "Dealabs",
        categorie: "Électronique",
        date: new Date(2024, 0, 22)
    },
    {
        titre: "Dyson V15 Detect - Aspirateur sans fil",
        description: "Aspirateur sans fil avec détection laser, jusqu'à 60min d'autonomie",
        prix: "€599.99",
        vendeur: "Dyson",
        lien: "#",
        image: "https://via.placeholder.com/300x200/fd7e14/ffffff?text=Dyson+V15",
        source: "HotUKDeals",
        categorie: "Maison",
        date: new Date(2024, 0, 19)
    },
    {
        titre: "PlayStation 5 + Spider-Man 2",
        description: "Console PS5 avec le jeu Spider-Man 2, manette DualSense incluse",
        prix: "€549.99",
        vendeur: "PlayStation",
        lien: "#",
        image: "https://via.placeholder.com/300x200/0d6efd/ffffff?text=PlayStation+5",
        source: "Dealabs",
        categorie: "Électronique",
        date: new Date(2024, 0, 21)
    },
    {
        titre: "Zara - Manteau d'hiver 50% off",
        description: "Manteau long en laine mélangée, coupe élégante, plusieurs coloris disponibles",
        prix: "€79.99",
        vendeur: "Zara",
        lien: "#",
        image: "https://via.placeholder.com/300x200/198754/ffffff?text=Manteau+Zara",
        source: "Dealabs",
        categorie: "Vêtements",
        date: new Date(2024, 0, 17)
    },
    {
        titre: "Nintendo Switch OLED",
        description: "Console portable avec écran OLED 7\", Joy-Con inclus, dock pour TV",
        prix: "€329.99",
        vendeur: "Nintendo",
        lien: "#",
        image: "https://via.placeholder.com/300x200/e01e37/ffffff?text=Switch+OLED",
        source: "HotUKDeals",
        categorie: "Électronique",
        date: new Date(2024, 0, 16)
    }
];

// Générer plus d'offres mock pour tester la pagination
function genererOffresMock() {
    const offresSupplementaires = [];
    const titres = [
        "iPhone 15 Pro Max", "Samsung TV 55\" QLED", "Adidas Ultraboost 22", "Kindle Oasis",
        "Apple Watch Series 9", "Bose QuietComfort 45", "IKEA Canapé KIVIK", "Instant Pot Duo",
        "GoPro Hero 12", "Microsoft Surface Pro 9", "Canon EOS R6", "Tesla Model 3 Accessories",
        "Lego Architecture", "Fitbit Charge 5", "Nespresso Vertuo", "Ring Video Doorbell",
        "AirPods Pro 2", "Dell XPS 13", "Nike Air Max 90", "KitchenAid Stand Mixer"
    ];
    
    const categories = ["Électronique", "Vêtements", "Maison", "Sports & Loisirs", "Divers"];
    const vendeurs = ["Amazon", "Apple", "Samsung", "Nike", "Adidas", "IKEA", "Best Buy", "Fnac"];
    
    for (let i = 0; i < 50; i++) {
        const titre = titres[i % titres.length];
        const categorie = categories[Math.floor(Math.random() * categories.length)];
        const vendeur = vendeurs[Math.floor(Math.random() * vendeurs.length)];
        const prix = `€${(Math.random() * 1000 + 50).toFixed(2)}`;
        
        offresSupplementaires.push({
            titre: `${titre} ${i + 1}`,
            description: `Description détaillée du produit ${titre} avec caractéristiques spéciales`,
            prix: prix,
            vendeur: vendeur,
            lien: "#",
            image: `https://via.placeholder.com/300x200/${Math.floor(Math.random()*16777215).toString(16)}/ffffff?text=${encodeURIComponent(titre)}`,
            source: Math.random() > 0.5 ? "Dealabs" : "HotUKDeals",
            categorie: categorie,
            date: new Date(2024, 0, Math.floor(Math.random() * 30) + 1)
        });
    }
    
    return [...mockOffres, ...offresSupplementaires];
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

    let totalOffresChargees = 0;

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
                    totalOffresChargees++;
                } else {
                    deal.categorie = "Divers";
                    deal.source = source.nom;
                    offresParCategorie["Divers"].push(deal);
                    totalOffresChargees++;
                }
            });
            
            sourceIndex++;
        } catch (error) {
            console.error(`Erreur chargement ${source.nom}:`, error);
        }
    }

    // Si aucune offre n'a été chargée depuis les RSS, utiliser les données mock
    if (totalOffresChargees === 0) {
        console.log("Aucune offre chargée depuis les RSS, utilisation des données de démonstration...");
        const offresMock = genererOffresMock();
        
        offresMock.forEach(offre => {
            const categorie = offre.categorie;
            if (offresParCategorie[categorie]) {
                offresParCategorie[categorie].push(offre);
            } else {
                offresParCategorie["Divers"].push(offre);
            }
        });
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
let trierPar = 'date';
let pageActuelle = 1;
let elementsParPage = 24;

// Enhanced loading state management
let isLoading = false;

// Performance monitoring
let loadStartTime = 0;
let offresAAfficher = [];

// Gestion du thème
function initialiserTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = themeToggle.querySelector('.theme-icon');
    const savedTheme = localStorage.getItem('theme') || 'dark';
    
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        themeIcon.textContent = '☀️';
    }
    
    themeToggle.addEventListener('click', () => {
        // Add loading animation to theme toggle
        themeToggle.style.transform = 'scale(0.9) rotate(180deg)';
        
        setTimeout(() => {
            document.body.classList.toggle('light-theme');
            const isLight = document.body.classList.contains('light-theme');
            themeIcon.textContent = isLight ? '☀️' : '🌙';
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
            
            // Add subtle transition effect
            document.body.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
            
            // Reset theme toggle animation
            themeToggle.style.transform = 'scale(1) rotate(0deg)';
            
            // Reset body transition after animation
            setTimeout(() => {
                document.body.style.transition = '';
            }, 500);
        }, 200);
    });
    
    // Add pulse effect on hover
    themeToggle.addEventListener('mouseenter', () => {
        themeIcon.style.animation = 'pulse 0.6s infinite';
    });
    
    themeToggle.addEventListener('mouseleave', () => {
        themeIcon.style.animation = '';
    });
}

// Fonction pour trier les offres
function trierOffres(offres, critere) {
    const offresCopie = [...offres];
    
    switch (critere) {
        case 'date':
            return offresCopie.sort((a, b) => (b.date || new Date()) - (a.date || new Date()));
        case 'discount':
            return offresCopie.sort((a, b) => {
                const discountA = extrairePourcentageReduction(a.titre + ' ' + a.description + ' ' + a.prix);
                const discountB = extrairePourcentageReduction(b.titre + ' ' + b.description + ' ' + b.prix);
                return discountB - discountA;
            });
        case 'price-low':
            return offresCopie.sort((a, b) => {
                const priceA = extrairePrixNumerique(a.prix);
                const priceB = extrairePrixNumerique(b.prix);
                return priceA - priceB;
            });
        case 'price-high':
            return offresCopie.sort((a, b) => {
                const priceA = extrairePrixNumerique(a.prix);
                const priceB = extrairePrixNumerique(b.prix);
                return priceB - priceA;
            });
        default:
            return offresCopie;
    }
}

// Fonction pour extraire le prix numérique
function extrairePrixNumerique(prixTexte) {
    if (!prixTexte) return 0;
    const match = prixTexte.match(/[\d,]+(?:\.\d{2})?/);
    if (match) {
        return parseFloat(match[0].replace(',', '.'));
    }
    return 0;
}

// Fonction pour créer la pagination
function creerPagination(totalOffres, pageActuelle, elementsParPage) {
    const totalPages = Math.ceil(totalOffres / elementsParPage);
    const paginationContainer = document.getElementById('pagination');
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Bouton précédent
    paginationHTML += `<button class="pagination-btn" ${pageActuelle === 1 ? 'disabled' : ''} onclick="changerPage(${pageActuelle - 1})">‹</button>`;
    
    // Numéros de page
    let debutPage = Math.max(1, pageActuelle - 2);
    let finPage = Math.min(totalPages, pageActuelle + 2);
    
    if (debutPage > 1) {
        paginationHTML += `<button class="pagination-btn" onclick="changerPage(1)">1</button>`;
        if (debutPage > 2) {
            paginationHTML += `<span class="pagination-info">...</span>`;
        }
    }
    
    for (let i = debutPage; i <= finPage; i++) {
        paginationHTML += `<button class="pagination-btn ${i === pageActuelle ? 'active' : ''}" onclick="changerPage(${i})">${i}</button>`;
    }
    
    if (finPage < totalPages) {
        if (finPage < totalPages - 1) {
            paginationHTML += `<span class="pagination-info">...</span>`;
        }
        paginationHTML += `<button class="pagination-btn" onclick="changerPage(${totalPages})">${totalPages}</button>`;
    }
    
    // Bouton suivant
    paginationHTML += `<button class="pagination-btn" ${pageActuelle === totalPages ? 'disabled' : ''} onclick="changerPage(${pageActuelle + 1})">›</button>`;
    
    // Info de pagination
    const debut = (pageActuelle - 1) * elementsParPage + 1;
    const fin = Math.min(pageActuelle * elementsParPage, totalOffres);
    paginationHTML += `<span class="pagination-info">${debut}-${fin} sur ${totalOffres}</span>`;
    
    paginationContainer.innerHTML = paginationHTML;
}

// Fonction pour changer de page avec effets visuels améliorés
function changerPage(nouvellePage) {
    if (nouvellePage === pageActuelle || isLoading) return;
    
    const offresContainer = document.getElementById('offres-container');
    const paginationBtns = document.querySelectorAll('.pagination-btn');
    
    // Ajouter feedback visuel
    paginationBtns.forEach(btn => {
        if (btn.textContent == nouvellePage) {
            btn.style.transform = 'scale(1.1)';
            btn.style.background = 'linear-gradient(135deg, #ff3d92 0%, #9b51e0 100%)';
        }
    });
    
    // Animation de sortie
    offresContainer.style.transform = 'translateY(20px)';
    offresContainer.style.opacity = '0.5';
    
    setTimeout(() => {
        pageActuelle = nouvellePage;
        afficherOffres();
        
        // Scroll fluide vers le haut
        const header = document.querySelector('.header');
        header.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
        
        // Réinitialiser les styles des boutons
        paginationBtns.forEach(btn => {
            btn.style.transform = '';
            btn.style.background = '';
        });
    }, 300);
}

// Enhanced function to initialize controls with visual feedback
function initialiserControles() {
    // Enhanced sort control
    const sortSelect = document.getElementById('sort-select');
    sortSelect.addEventListener('change', (e) => {
        trierPar = e.target.value;
        pageActuelle = 1;
        
        // Visual feedback
        sortSelect.style.transform = 'scale(1.05)';
        sortSelect.style.borderColor = 'rgba(155,81,224,0.8)';
        
        setTimeout(() => {
            sortSelect.style.transform = 'scale(1)';
            sortSelect.style.borderColor = '';
            afficherOffres();
        }, 200);
    });
    
    // Enhanced items per page control
    const itemsPerPageSelect = document.getElementById('items-per-page');
    itemsPerPageSelect.addEventListener('change', (e) => {
        elementsParPage = parseInt(e.target.value);
        pageActuelle = 1;
        
        // Visual feedback
        itemsPerPageSelect.style.transform = 'scale(1.05)';
        itemsPerPageSelect.style.borderColor = 'rgba(155,81,224,0.8)';
        
        setTimeout(() => {
            itemsPerPageSelect.style.transform = 'scale(1)';
            itemsPerPageSelect.style.borderColor = '';
            afficherOffres();
        }, 200);
    });
    
    // Add hover effects for all selects
    [sortSelect, itemsPerPageSelect].forEach(select => {
        select.addEventListener('mouseenter', () => {
            if (!isLoading) {
                select.style.transform = 'translateY(-1px)';
                select.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }
        });
        
        select.addEventListener('mouseleave', () => {
            select.style.transform = 'translateY(0)';
            select.style.boxShadow = '';
        });
    });
}

// Enhanced function to initialize dropdown categories with visual feedback
function initialiserDropdownCategories() {
    const categorySelect = document.getElementById('category-select');
    
    // Vider les options existantes (sauf "Toutes les catégories")
    categorySelect.innerHTML = '<option value="">Toutes les catégories</option>';
    
    // Ajouter les catégories disponibles avec compte d'éléments
    Object.keys(offresData).forEach(categorie => {
        if (offresData[categorie] && offresData[categorie].length > 0) {
            const option = document.createElement('option');
            option.value = categorie;
            option.textContent = `${categorie} (${offresData[categorie].length})`;
            categorySelect.appendChild(option);
        }
    });
    
    // Enhanced category change event with visual feedback
    categorySelect.addEventListener('change', (e) => {
        const oldCategory = categorieActuelle;
        categorieActuelle = e.target.value || null;
        pageActuelle = 1; // Reset à la première page
        
        // Visual feedback for category change
        categorySelect.style.transform = 'scale(1.05)';
        categorySelect.style.borderColor = 'rgba(0,246,255,0.8)';
        
        // Add category indicator
        if (categorieActuelle) {
            categorySelect.classList.add('filter-active');
        } else {
            categorySelect.classList.remove('filter-active');
        }
        
        setTimeout(() => {
            categorySelect.style.transform = 'scale(1)';
            categorySelect.style.borderColor = '';
            afficherOffres();
        }, 200);
    });
    
    // Enhanced hover effects
    categorySelect.addEventListener('mouseenter', () => {
        if (!isLoading) {
            categorySelect.style.transform = 'translateY(-1px)';
            categorySelect.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        }
    });
    
    categorySelect.addEventListener('mouseleave', () => {
        categorySelect.style.transform = 'translateY(0)';
        categorySelect.style.boxShadow = '';
    });
}

// Enhanced function to initialize search with better UX
function initialiserRecherche() {
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const clearButton = document.getElementById('clear-search');
    
    // Add visual feedback for typing
    let typingTimer;
    
    function effectuerRecherche() {
        motRecherche = searchInput.value.toLowerCase().trim();
        pageActuelle = 1; // Reset à la première page
        
        // Show/hide clear button
        if (motRecherche) {
            clearButton.classList.add('visible');
        } else {
            clearButton.classList.remove('visible');
        }
        
        // Add loading indicator to search box
        searchButton.innerHTML = '⏳';
        searchInput.style.borderColor = 'rgba(0,246,255,0.5)';
        
        setTimeout(() => {
            afficherOffres();
            searchButton.innerHTML = '🔍';
            searchInput.style.borderColor = '';
        }, 500);
    }
    
    function effacerRecherche() {
        searchInput.value = '';
        motRecherche = '';
        pageActuelle = 1;
        clearButton.classList.remove('visible');
        
        // Animation d'effacement
        searchInput.style.transform = 'scale(0.98)';
        clearButton.style.transform = 'translateY(-50%) scale(0.8)';
        
        setTimeout(() => {
            searchInput.style.transform = 'scale(1)';
            clearButton.style.transform = 'translateY(-50%) scale(1)';
            afficherOffres();
            searchInput.focus();
        }, 200);
    }
    
    // Enhanced real-time search with debouncing
    searchInput.addEventListener('input', () => {
        clearTimeout(typingTimer);
        
        // Visual feedback while typing
        searchInput.style.borderColor = 'rgba(255,61,146,0.3)';
        
        typingTimer = setTimeout(() => {
            effectuerRecherche();
        }, 300); // Debounce for 300ms
    });
    
    // Clear search button
    clearButton.addEventListener('click', effacerRecherche);
    
    // Enhanced click handler
    searchButton.addEventListener('click', () => {
        searchButton.style.transform = 'scale(0.9)';
        setTimeout(() => {
            searchButton.style.transform = 'scale(1)';
            effectuerRecherche();
        }, 100);
    });
    
    // Enhanced keyboard interaction
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchInput.style.transform = 'scale(0.98)';
            setTimeout(() => {
                searchInput.style.transform = 'scale(1)';
                effectuerRecherche();
            }, 100);
        }
    });
    
    // Focus and blur effects
    searchInput.addEventListener('focus', () => {
        searchInput.style.transform = 'scale(1.02)';
        searchInput.style.boxShadow = '0 0 0 2px rgba(0,246,255,0.2)';
    });
    
    searchInput.addEventListener('blur', () => {
        searchInput.style.transform = 'scale(1)';
        searchInput.style.boxShadow = '';
        searchInput.style.borderColor = '';
    });
}

// Enhanced function to display offers with better performance monitoring
async function afficherOffres() {
    const offresContainer = document.getElementById('offres-container');
    const offersCountElement = document.getElementById('offers-count') || document.querySelector('.offers-count');
    
    // Start performance monitoring
    loadStartTime = performance.now();
    isLoading = true;
    
    // Enhanced loading with progress indication
    offresContainer.innerHTML = creerSkeletonScreen();
    if (offersCountElement) {
        offersCountElement.innerHTML = '<span style="opacity: 0.6">🔄 Chargement...</span>';
    }

    try {
        // Charger les offres si nécessaire
        if (Object.keys(offresData).length === 0) {
            offresData = await chargerToutesLesOffres();
            initialiserDropdownCategories(); // Initialiser le dropdown après le chargement
        }

        offresContainer.innerHTML = '';

        let toutesLesOffres = [];

        // Filtrer par catégorie
        if (categorieActuelle) {
            toutesLesOffres = offresData[categorieActuelle] || [];
        } else {
            // Afficher toutes les offres
            Object.values(offresData).forEach(offres => {
                toutesLesOffres = toutesLesOffres.concat(offres);
            });
        }

        // Filtrer par recherche
        if (motRecherche) {
            toutesLesOffres = toutesLesOffres.filter(offre => {
                return offre.titre.toLowerCase().includes(motRecherche) ||
                       offre.description.toLowerCase().includes(motRecherche) ||
                       offre.vendeur.toLowerCase().includes(motRecherche) ||
                       offre.prix.toLowerCase().includes(motRecherche);
            });
        }

        // Filtre spécial : Prioriser les offres avec plus de 25% de réduction
        const offresForteReduction = filtrerParReduction(toutesLesOffres, 25);
        const autresOffres = toutesLesOffres.filter(offre => {
            const reduction = extrairePourcentageReduction(offre.titre + ' ' + offre.description + ' ' + offre.prix);
            return reduction < 25;
        });

        // Combiner : d'abord les fortes réductions, puis les autres
        toutesLesOffres = [...offresForteReduction, ...autresOffres];

        // Trier les offres
        toutesLesOffres = trierOffres(toutesLesOffres, trierPar);

        if (toutesLesOffres.length === 0) {
            const messageVide = motRecherche ? 
                `Aucune offre trouvée pour "${motRecherche}"` : 
                'Aucune offre trouvée dans cette catégorie.';
            offresContainer.innerHTML = `
                <div class="loading" style="padding: 4rem;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
                    <div style="font-size: 1.2rem; margin-bottom: 0.5rem;">${messageVide}</div>
                    <div style="font-size: 0.9rem; opacity: 0.6;">Essayez de modifier vos critères de recherche</div>
                </div>
            `;
            if (offersCountElement) {
                offersCountElement.textContent = '';
            }
            document.getElementById('pagination').innerHTML = '';
            isLoading = false;
            return;
        }

        // Pagination
        const totalOffres = toutesLesOffres.length;
        const debutIndex = (pageActuelle - 1) * elementsParPage;
        const finIndex = debutIndex + elementsParPage;
        const offresAAfficher = toutesLesOffres.slice(debutIndex, finIndex);

        // Calculate and display performance metrics
        const loadTime = performance.now() - loadStartTime;
        
        // Enhanced results display with performance info
        if (offersCountElement) {
            const hotDeals = offresForteReduction.length;
            offersCountElement.innerHTML = `
                <span style="color: #00f6ff; font-weight: 600;">${totalOffres}</span> offre(s) trouvée(s)
                ${hotDeals > 0 ? `<span style="color: #ff3d92; margin-left: 1rem;">🔥 ${hotDeals} promotions</span>` : ''}
                <span style="opacity: 0.5; font-size: 0.8rem; margin-left: 1rem;">⚡ ${Math.round(loadTime)}ms</span>
            `;
        }

        // Créer la pagination
        creerPagination(totalOffres, pageActuelle, elementsParPage);

        // Enhanced staggered animation
        offresContainer.style.opacity = '0';
        
        offresAAfficher.forEach((offre, index) => {
            const offreElement = creerElementOffre(offre);
            offreElement.style.animationDelay = `${index * 0.05}s`;
            offreElement.classList.add('offer-enter');
            offresContainer.appendChild(offreElement);
        });

        // Smooth appearance animation
        setTimeout(() => {
            offresContainer.style.opacity = '1';
            isLoading = false;
            
            // Add success feedback
            if (offersCountElement && totalOffres > 0) {
                offersCountElement.style.transform = 'scale(1.05)';
                setTimeout(() => {
                    offersCountElement.style.transform = 'scale(1)';
                }, 200);
            }
        }, 100);

    } catch (error) {
        console.error('Erreur lors de l\'affichage des offres:', error);
        offresContainer.innerHTML = `
            <div class="loading" style="color: #ff3d92;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
                <div>Erreur lors du chargement des offres</div>
                <button onclick="afficherOffres()" style="
                    margin-top: 1rem; 
                    padding: 0.5rem 1rem; 
                    background: linear-gradient(135deg, #ff3d92, #9b51e0); 
                    border: none; 
                    border-radius: 8px; 
                    color: white; 
                    cursor: pointer;
                    transition: transform 0.2s ease;
                " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    🔄 Réessayer
                </button>
            </div>
        `;
        if (offersCountElement) {
            offersCountElement.textContent = '';
        }
        document.getElementById('pagination').innerHTML = '';
        isLoading = false;
    }
}

// Function to create enhanced skeleton loading screen
function creerSkeletonScreen() {
    const skeletonCards = Array(6).fill().map((_, index) => `
        <div class="skeleton-card" style="animation-delay: ${index * 0.1}s;">
            <div class="skeleton-image skeleton"></div>
            <div class="skeleton-content">
                <div class="skeleton-title skeleton" style="height: 24px; margin-bottom: 12px; border-radius: 6px; width: 85%;"></div>
                <div class="skeleton-title skeleton" style="height: 20px; margin-bottom: 16px; border-radius: 6px; width: 60%;"></div>
                <div class="skeleton-description skeleton" style="height: 16px; margin-bottom: 8px; border-radius: 4px; width: 100%;"></div>
                <div class="skeleton-description skeleton" style="height: 16px; margin-bottom: 8px; border-radius: 4px; width: 90%;"></div>
                <div class="skeleton-description skeleton" style="height: 16px; margin-bottom: 20px; border-radius: 4px; width: 70%;"></div>
                <div class="skeleton-price skeleton" style="height: 28px; width: 40%; margin-bottom: 16px; border-radius: 6px;"></div>
                <div class="skeleton-meta skeleton" style="height: 14px; width: 80%; margin-bottom: 8px; border-radius: 4px;"></div>
                <div class="skeleton-meta skeleton" style="height: 14px; width: 60%; margin-bottom: 20px; border-radius: 4px;"></div>
                <div class="skeleton-button skeleton" style="height: 48px; width: 140px; border-radius: 16px;"></div>
            </div>
        </div>
    `).join('');
    
    return `<div class="loading-skeleton">${skeletonCards}</div>`;
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
            <a href="${offre.lien}" target="_blank" class="offer-link">
                <span>Voir l'offre</span>
                <span class="offer-link-icon">→</span>
            </a>
        </div>
    `;

    // Enhanced hover effects with magnetic attraction
    div.addEventListener('mouseenter', function(e) {
        this.style.transform = 'translateY(-12px) scale(1.02)';
        this.style.boxShadow = '0 25px 50px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1), 0 0 80px rgba(0,246,255,0.1)';
        
        // Add magnetic effect to the link button
        const link = this.querySelector('.offer-link');
        if (link) {
            link.style.transform = 'translateY(-2px) scale(1.05)';
        }
    });

    div.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
        this.style.boxShadow = '';
        
        // Reset link button
        const link = this.querySelector('.offer-link');
        if (link) {
            link.style.transform = 'translateY(0) scale(1)';
        }
    });

    // Add click ripple effect
    div.addEventListener('click', function(e) {
        if (!e.target.closest('.offer-link')) {
            const ripple = document.createElement('div');
            ripple.style.cssText = `
                position: absolute;
                border-radius: 50%;
                background: rgba(0,246,255,0.3);
                transform: scale(0);
                animation: ripple 0.6s linear;
                pointer-events: none;
                width: 50px;
                height: 50px;
                left: ${e.offsetX - 25}px;
                top: ${e.offsetY - 25}px;
            `;
            
            this.style.position = 'relative';
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        }
    });

    return div;
}

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', function() {
    initialiserTheme();
    initialiserRecherche();
    initialiserControles();
    initialiserScrollToTop();
    afficherOffres();
});

// Fonction pour initialiser le bouton scroll to top
function initialiserScrollToTop() {
    const scrollBtn = document.getElementById('scroll-to-top');
    
    // Afficher/masquer le bouton selon la position de scroll
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > 300) {
            scrollBtn.classList.add('visible');
            
            // Ajouter animation pulse si l'utilisateur a scrollé beaucoup
            if (scrollTop > 1000) {
                scrollBtn.classList.add('pulse');
            }
        } else {
            scrollBtn.classList.remove('visible', 'pulse');
        }
    });
    
    // Gérer le clic sur le bouton
    scrollBtn.addEventListener('click', () => {
        // Animation du bouton
        scrollBtn.style.transform = 'translateY(-3px) scale(0.9)';
        
        // Scroll fluide vers le haut
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        
        // Réinitialiser l'animation du bouton
        setTimeout(() => {
            scrollBtn.style.transform = '';
        }, 200);
    });
}
