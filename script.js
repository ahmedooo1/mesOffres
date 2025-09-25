// Configuration des sources de deals (optimisée pour rapidité avec plus de sites français)
const sourcesDeals = {
    // Sources prioritaires (chargées immédiatement - seulement les plus importantes)
    "dealabs_hot": {
        nom: "Dealabs (Hot)",
        rss: "https://www.dealabs.com/rss/hot",
        categorie: "Divers",
        priorite: 1
    },
    "dealabs_informatique": {
        nom: "Dealabs (Informatique)",
        rss: "https://www.dealabs.com/rss/groupe/informatique",
        categorie: "Électronique",
        priorite: 1
    },
    "dealabs_telephonie": {
        nom: "Dealabs (Téléphonie)",
        rss: "https://www.dealabs.com/rss/groupe/telephonie",
        categorie: "Électronique",
        priorite: 1
    },
    "dealabs_electronique": {
        nom: "Dealabs (Électronique)",
        rss: "https://www.dealabs.com/rss/groupe/electronique",
        categorie: "Électronique",
        priorite: 1
    },

    // Sources secondaires diverses (chargées rapidement)
    "dealabs_jeux": {
        nom: "Dealabs (Jeux)",
        rss: "https://www.dealabs.com/rss/groupe/jeux-video",
        categorie: "Électronique",
        priorite: 2
    },
    "dealabs_voyage": {
        nom: "Dealabs (Voyages)",
        rss: "https://www.dealabs.com/rss/groupe/voyages",
        categorie: "Voyages",
        priorite: 2
    },
    "dealabs_mode": {
        nom: "Dealabs (Mode)",
        rss: "https://www.dealabs.com/rss/groupe/mode",
        categorie: "Vêtements",
        priorite: 2
    },
    "dealabs_maison": {
        nom: "Dealabs (Maison)",
        rss: "https://www.dealabs.com/rss/groupe/maison",
        categorie: "Maison",
        priorite: 2
    },
    "clubic_bons_plans": {
        nom: "Clubic Bons Plans",
        rss: "https://www.clubic.com/rss/bons-plans.xml",
        categorie: "Électronique",
        priorite: 2
    },
    "lesbonsplans": {
        nom: "Les Bons Plans",
        rss: "https://www.lesbonsplans.fr/rss.xml",
        categorie: "Divers",
        priorite: 2
    },
    "radins": {
        nom: "Radins",
        rss: "https://www.radins.com/rss.xml",
        categorie: "Divers",
        priorite: 2
    },
    "poulpeo": {
        nom: "Poulpeo Offres",
        rss: "https://www.poulpeo.com/rss/offres.xml",
        categorie: "Divers",
        priorite: 2
    },
    "frandroid_bons_plans": {
        nom: "FrAndroid Bons Plans",
        rss: "https://www.frandroid.com/bons-plans/feed",
        categorie: "Électronique",
        priorite: 2
    },
    "lesnumeriques_bons_plans": {
        nom: "Les Numériques Bons Plans",
        rss: "https://www.lesnumeriques.com/bons-plans/rss.xml",
        categorie: "Électronique",
        priorite: 2
    },
    "generation_nt_bons_plans": {
        nom: "Generation NT Bons Plans",
        rss: "https://www.generation-nt.com/rss.xml",
        categorie: "Électronique",
        priorite: 2
    },
    "journaldugeek_bons_plans": {
        nom: "Journal du Geek Bons Plans",
        rss: "https://www.journaldugeek.com/feed/",
        categorie: "Électronique",
        priorite: 2
    }

};

// Cache pour les offres
let offresCache = {};
let dernierChargement = null;

// Fonction pour ajouter un délai entre les requêtes
function delai(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

    // Fonction pour scraper le contenu complet d'un article Les Numériques
    async function scraperArticleLesNumeriques(url) {
        try {
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
            const response = await fetch(proxyUrl);
            if (!response.ok) return '';

            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // Extraire le texte principal de l'article (balises <p> dans <article> ou <main>)
            const article = doc.querySelector('article') || doc.querySelector('main') || doc.body;
            const paragraphs = article.querySelectorAll('p');
            let fullText = '';
            paragraphs.forEach(p => {
                fullText += p.textContent + ' ';
            });

            return fullText.trim();
        } catch (error) {
            console.warn(`Erreur lors du scraping de ${url}:`, error);
            return '';
        }
    }

    // Fonction pour charger les deals depuis RSS avec retry et gestion des erreurs améliorée
    async function chargerDealsDepuisRSS(url, sourceName = '', tentativeMax = 3) {
        for (let tentative = 1; tentative <= tentativeMax; tentative++) {
            try {
                // Utilisation d'un proxy CORS pour éviter les problèmes de cross-origin
                const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`;
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
                const response = await fetch(proxyUrl, { signal: controller.signal });
                clearTimeout(timeoutId);
                
                // Gérer les erreurs de limite de taux avec retry plus rapide
                if (response.status === 429) {
                    console.warn(`Limite de taux atteinte pour: ${url} (tentative ${tentative}/${tentativeMax})`);
                    if (tentative < tentativeMax) {
                        const delaiRetry = tentative * 500; // Plus rapide : 0.5s, 1s, 1.5s
                        console.log(`Retry dans ${delaiRetry/1000}s...`);
                        await delai(delaiRetry);
                        continue;
                    } else {
                        return [];
                    }
                }
                
                if (response.status === 500) {
                    console.warn(`Erreur serveur 500 pour: ${url} (tentative ${tentative}/${tentativeMax})`);
                    if (tentative < tentativeMax) {
                        await delai(500 * tentative); // Délai plus rapide
                        continue;
                    } else {
                        return [];
                    }
                }
                
                if (!response.ok) {
                    console.warn(`Erreur HTTP ${response.status} pour: ${url}`);
                    return [];
                }
                
                const data = await response.json();

                if (data.status === 'ok' && data.items) {
                    const items = data.items.slice(0, 50);
                    const deals = [];
                    for (let i = 0; i < items.length; i++) {
                        const item = items[i];
                        let fullContent = item.content || item.description || '';

                        // Scraping pour Les Numériques (limité aux 5 premiers items)
                        if (sourceName.includes('Les Numériques') && i < 5) {
                            console.log(`Scraping article Les Numériques: ${item.title}`);
                            const articleText = await scraperArticleLesNumeriques(item.link);
                            if (articleText) {
                                fullContent += ' ' + articleText;
                            }
                            await delai(1000); // Délai entre scrapings pour éviter les limites
                        }

                        const description = fullContent.replace(/<[^>]*>/g, '').substring(0, 150) + '...';
                        const priceText = (item.title || '') + ' ' + fullContent;
                        deals.push({
                            titre: item.title || 'Titre non disponible',
                            description: description,
                            prix: extrairePrix(priceText) || "Prix non spécifié",
                            image: item.thumbnail || extraireImage(fullContent) || "https://via.placeholder.com/300x200?text=Deal",
                            lien: item.link || '#',
                            vendeur: item.author || "Marchand",
                            date: new Date(item.pubDate || Date.now()),
                            categorie: determinerCategorie((item.title || '') + ' ' + fullContent)
                        });
                    }
                    return deals;
                }
                return [];
                
            } catch (error) {
                if (error.name === 'AbortError') {
                    console.warn(`Timeout pour: ${url} (tentative ${tentative}/${tentativeMax})`);
                    if (tentative < tentativeMax) {
                        await delai(500 * tentative);
                        continue;
                    } else {
                        return [];
                    }
                }
                console.error(`Erreur lors du chargement des deals depuis: ${url} (tentative ${tentative}/${tentativeMax})`, error);
                if (tentative < tentativeMax) {
                    await delai(500 * tentative);
                }
            }
        }
        
        return []; // Retourner un tableau vide si toutes les tentatives échouent
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
        // Pattern spécial pour les offres avec réduction fidélité (ex: "103,90€ (via 20,1€ sur carte fidélité)")
        const regexFidelite = /(\d+[.,]?\d*)\s*€.*?(?:via|avec)\s+(\d+[.,]?\d*)[.,]?\d*\s*€.*?(?:fidélité|carte)/gi;
        
        // Pattern pour format Dealabs/Carrefour standard (ex: "103,90€ 134€ -22%")
        const regexDealabsFormat = /(\d+[.,]?\d*)\s*€\s+(\d+[.,]?\d*)\s*€\s*-(\d+)%/gi;
        
        // Pattern spécifique pour les titres Dealabs (ex: dans le titre même)
        const regexTitreDealabs = /(\d+[.,]?\d*)\s*€.*?(\d+[.,]?\d*)\s*€/gi;
        
        // Patterns pour prix avant/après : "1499€ -> 949€" ou "de 1499€ à 949€"
        const regexPrixComparaison = /(\d+[.,]?\d*)\s*€?\s*(?:->|à)\s*(\d+[.,]?\d*)\s*€?/gi;
        const regexPrixBarre = /~~(\d+[.,]?\d*)~~\s*(\d+[.,]?\d*)/gi; // Prix barré
        // Pattern pour prix space-separated (e.g., "199,99 € 349,99 €" - premier est le prix promo)
        const regexPrixSpace = /(\d+[.,]?\d*)\s*€\s+(\d+[.,]?\d*)\s*€/gi;
        // Pattern pour prix avec "à X €" (e.g., "à 189,99 €")
        const regexPrixA = /à\s+(\d+[.,]?\d*)\s*€/gi;
        // Nouveau pattern pour prix space-separated suivis de % (e.g., "405€ 567€ -29%")
        const regexPrixSpacePourcent = /(\d+[.,]?\d*)\s*€\s+(\d+[.,]?\d*)\s*€\s*-?(\d+)%?/gi;
        // Patterns français : "avant X€ maintenant Y€" ou "was X€ now Y€"
        const regexAvantMaintenant = /(?:avant|was|était)\s+(\d+[.,]?\d*)\s*€?\s+(?:maintenant|now|est|à)\s+(\d+[.,]?\d*)\s*€?/gi;
        // Pattern pour "de X€ à Y€" (assumant que Y est le prix final)
        const regexDeAX = /de\s+(\d+[.,]?\d*)\s*€?\s+à\s+(\d+[.,]?\d*)\s*€?/gi;
        
        // Gérer le format Dealabs/Carrefour en priorité (ex: "103,90€ 134€ -22%")
        let matchDealabs = texte.match(regexDealabsFormat);
        if (matchDealabs) {
            const prixMatch = matchDealabs[0].match(/(\d+[.,]?\d*)/g);
            if (prixMatch && prixMatch.length >= 3) {
                const prixPromo = parseFloat(prixMatch[0].replace(',', '.'));
                const prixOriginal = parseFloat(prixMatch[1].replace(',', '.'));
                const pourcentage = prixMatch[2];
                return `${prixPromo.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}€ (était ${prixOriginal.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}€) -${pourcentage}%`;
            }
        }
        
        // Gérer les offres avec réduction fidélité
        let matchFidelite = texte.match(regexFidelite);
        if (matchFidelite) {
            const prixMatch = matchFidelite[0].match(/(\d+[.,]?\d*)/g);
            if (prixMatch && prixMatch.length >= 2) {
                const prixPrincipal = parseFloat(prixMatch[0].replace(',', '.'));
                const reductionFidelite = parseFloat(prixMatch[1].replace(',', '.'));
                return `${prixPrincipal.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}€ (${reductionFidelite.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}€ de réduction fidélité)`;
            }
        }

        let match = texte.match(regexPrixComparaison);
        if (match) {
            const prixMatch = match[0].match(/(\d+[.,]?\d*)/g);
            if (prixMatch && prixMatch.length >= 2) {
                const avant = Math.max(parseFloat(prixMatch[0].replace(',', '.')), parseFloat(prixMatch[1].replace(',', '.')));
                const apres = Math.min(parseFloat(prixMatch[0].replace(',', '.')), parseFloat(prixMatch[1].replace(',', '.')));
                return `${apres.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}€ (était ${avant.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}€)`;
            }
        }

        match = texte.match(regexPrixBarre);
        if (match) {
            const prixMatch = match[0].match(/(\d+[.,]?\d*)/g);
            if (prixMatch && prixMatch.length >= 2) {
                const avant = parseFloat(prixMatch[0].replace(',', '.'));
                const apres = parseFloat(prixMatch[1].replace(',', '.'));
                return `${apres.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}€ (était ${avant.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}€)`;
            }
        }

        // Prix space-separated sans %
        match = texte.match(regexPrixSpace);
        if (match) {
            const prixMatch = match[0].match(/(\d+[.,]?\d*)/g);
            if (prixMatch && prixMatch.length >= 2) {
                const p1 = parseFloat(prixMatch[0].replace(',', '.'));
                const p2 = parseFloat(prixMatch[1].replace(',', '.'));
                const apres = Math.min(p1, p2);
                const avant = Math.max(p1, p2);
                return `${apres.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}€ (était ${avant.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}€)`;
            }
        }

        // Prix avec "à X €"
        match = texte.match(regexPrixA);
        if (match) {
            const prix = match[0].match(/(\d+[.,]?\d*)/g)[0];
            return `${parseFloat(prix.replace(',', '.')).toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}€`;
        }

        // Nouveau: Prix space-separated avec %
        match = texte.match(regexPrixSpacePourcent);
        if (match) {
            const prixMatch = match[0].match(/(\d+[.,]?\d*)/g);
            if (prixMatch && prixMatch.length >= 2) {
                const p1 = parseFloat(prixMatch[0].replace(',', '.'));
                const p2 = parseFloat(prixMatch[1].replace(',', '.'));
                const apres = Math.min(p1, p2);
                const avant = Math.max(p1, p2);
                return `${apres.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}€ (était ${avant.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}€)`;
            }
        }

        // Avant/maintenant patterns (updated to include "est" or "à")
        match = texte.match(regexAvantMaintenant);
        if (match) {
            const prixMatch = match[0].match(/(\d+[.,]?\d*)/g);
            if (prixMatch && prixMatch.length >= 2) {
                const avant = parseFloat(prixMatch[0].replace(',', '.'));
                const apres = parseFloat(prixMatch[1].replace(',', '.'));
                return `${apres.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}€ (était ${avant.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}€)`;
            }
        }

        // De X€ à Y€ pattern
        match = texte.match(regexDeAX);
        if (match) {
            const prixMatch = match[0].match(/(\d+[.,]?\d*)/g);
            if (prixMatch && prixMatch.length >= 2) {
                const avant = parseFloat(prixMatch[0].replace(',', '.'));
                const apres = parseFloat(prixMatch[1].replace(',', '.'));
                return `${apres.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}€ (était ${avant.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}€)`;
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
    // Debug: Afficher le texte pour les offres Apple AirPods
    if (texte.toLowerCase().includes('airpods')) {
        console.log('DEBUG AirPods - Texte à analyser:', texte);
        
        // Correction spéciale pour les AirPods avec le pattern connu
        const airpodsMatch = texte.match(/103[.,]?90\s*€/gi);
        if (airpodsMatch) {
            console.log('DEBUG AirPods - Pattern 103,90€ détecté, force ce prix');
            return '103,90€';
        }
    }
    
    // D'abord chercher dans data-offer JSON (pour Affilizz et similaires)
    const dataOfferMatch = texte.match(/data-offer\s*=\s*["'](\{[^"']*\})["']/i);
    if (dataOfferMatch) {
        try {
            const dataOffer = JSON.parse(dataOfferMatch[1]);
            if (dataOffer.price && dataOffer.crossedPrice) {
                const price = parseFloat(dataOffer.price);
                const crossed = parseFloat(dataOffer.crossedPrice);
                if (!isNaN(price) && !isNaN(crossed) && crossed > price) {
                    return `${price.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}€ (était ${crossed.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}€)`;
                }
            } else if (dataOffer.price) {
                const price = parseFloat(dataOffer.price);
                if (!isNaN(price)) {
                    return `${price.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}€`;
                }
            }
        } catch (e) {
            console.warn('Erreur lors du parsing du JSON data-offer:', e);
        }
    }

    // D'abord chercher les prix avant/après
    const prixComparaison = extrairePrixAvantApres(texte);
    if (prixComparaison) {
        if (texte.toLowerCase().includes('airpods')) {
            console.log('DEBUG AirPods - Prix comparaison trouvé:', prixComparaison);
        }
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
    
    // Sinon chercher les prix normaux (logique complètement révisée)
    const regexPrix = /\b(\d{1,3}(?:\s\d{3})*(?:[.,]\d{1,2})?)\s*[€£$]|\b[€£$]\s*(\d{1,3}(?:\s\d{3})*(?:[.,]\d{1,2})?)|\b(\d{1,3}(?:\s\d{3})*(?:[.,]\d{1,2})?)\s*(?:euros?|eur|€)/gi;
    const matches = texte.match(regexPrix);
    if (matches && matches.length > 0) {
        let prixTrouves = [];
        
        matches.forEach(match => {
            const originalMatch = match.replace(/\s+/g, ' ').trim();
            const clean = originalMatch.replace(/[€£$]|euros?|eur/gi, '').replace(/\s/g, '').replace(',', '.');
            const num = parseFloat(clean);
            if (num > 0) {
                prixTrouves.push({ 
                    original: originalMatch, 
                    valeur: num,
                    position: texte.indexOf(match)
                });
            }
        });
        
        if (prixTrouves.length > 0) {
            // Debug pour AirPods
            if (texte.toLowerCase().includes('airpods')) {
                console.log('DEBUG AirPods - Prix trouvés:', prixTrouves);
            }
            
            // Nouvelle logique : pour les deals, prioriser les prix moyens (ni trop petits ni trop gros)
            if (prixTrouves.length > 1) {
                // Séparer les prix par catégories
                const petitsPrix = prixTrouves.filter(p => p.valeur < 10);    // Réductions, frais, etc.
                const prixMoyens = prixTrouves.filter(p => p.valeur >= 10 && p.valeur <= 1000);  // Prix produits normaux
                const grosPrix = prixTrouves.filter(p => p.valeur > 1000);   // Prix très élevés
                
                // Prioriser les prix moyens (c'est généralement le prix du produit)
                if (prixMoyens.length > 0) {
                    // Si plusieurs prix moyens, prendre le premier qui apparaît dans le texte
                    prixMoyens.sort((a, b) => a.position - b.position);
                    return prixMoyens[0].original;
                }
                // Sinon prendre les gros prix
                else if (grosPrix.length > 0) {
                    grosPrix.sort((a, b) => a.position - b.position);
                    return grosPrix[0].original;
                }
                // En dernier recours, les petits prix
                else {
                    petitsPrix.sort((a, b) => b.valeur - a.valeur); // Le plus grand des petits
                    return petitsPrix[0].original;
                }
            } else {
                return prixTrouves[0].original;
            }
        }
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

// Fonction pour charger toutes les offres avec gestion des limites de taux
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

    // Charger depuis toutes les sources RSS par priorité avec délais plus longs
    let sourceIndex = 0;
    const sources = Object.entries(sourcesDeals);
    
    // Séparer les sources par priorité
    const sourcesPriorite1 = sources.filter(([id, source]) => source.priorite === 1);
    const sourcesPriorite2 = sources.filter(([id, source]) => source.priorite === 2);
    
    // Charger d'abord les sources prioritaires en parallèle avec stagger (500ms entre chaque)
    const promessesPriorite = sourcesPriorite1.map(async ([sourceId, source], index) => {
        try {
            if (index > 0) {
                await delai(500); // Stagger de 500ms
            }
            console.log(`🔥 Chargement prioritaire: ${source.nom}... (${index + 1}/${sourcesPriorite1.length})`);

            const deals = await chargerDealsDepuisRSS(source.rss, source.nom);

            deals.forEach(deal => {
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

            return deals;
        } catch (error) {
            console.error(`❌ Erreur lors du chargement de ${source.nom}:`, error);
            return [];
        }
    });

    await Promise.all(promessesPriorite);
    sourceIndex = sourcesPriorite1.length;

    // Pause courte avant les sources secondaires
    if (sourcesPriorite2.length > 0) {
        console.log('⏳ Pause de 1 seconde avant sources secondaires...');
        await delai(1000);
    }

    // Charger ensuite les sources secondaires rapidement (séquentiel pour éviter les limites)
    for (const [sourceId, source] of sourcesPriorite2) {
        try {
            console.log(`⭐ Chargement secondaire: ${source.nom}... (${sourceIndex + 1}/${sources.length})`);

            await delai(1000); // Réduit à 1 seconde entre sources secondaires

            const deals = await chargerDealsDepuisRSS(source.rss, source.nom);

            deals.forEach(deal => {
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
            console.warn(`⚠️ Source secondaire échouée ${source.nom}:`, error);
            sourceIndex++;
        }
    }

    // Trier par date (plus récent en premier) et augmenter la limite par catégorie
    Object.keys(offresParCategorie).forEach(categorie => {
        offresParCategorie[categorie] = offresParCategorie[categorie]
            .sort((a, b) => (b.date || new Date()) - (a.date || new Date()))
            .slice(0, 500); // Augmenté à 500 offres par catégorie pour garder plus d'offres
    });

    // Mettre en cache et retourner les données
    offresCache = offresParCategorie;
    dernierChargement = maintenant;

    // Calculer et afficher le total des offres chargées
    const totalOffres = Object.values(offresParCategorie).reduce((total, cat) => total + cat.length, 0);
    console.log(`🎯 TOTAL: ${totalOffres} offres chargées!`);
    
    // Détail par catégorie
    Object.entries(offresParCategorie).forEach(([categorie, offres]) => {
        if (offres.length > 0) {
            console.log(`📊 ${categorie}: ${offres.length} offres`);
        }
    });

    console.log('✅ Chargement terminé avec succès!');
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
    
    // Vérifier que offresData existe et n'est pas null/undefined
    if (!offresData || typeof offresData !== 'object') {
        console.warn('offresData n\'est pas encore initialisé');
        return;
    }
    
    // Ajouter les catégories disponibles
    Object.keys(offresData).forEach(categorie => {
        if (offresData[categorie] && offresData[categorie].length > 0) {
            const option = document.createElement('option');
            option.value = categorie;
            option.textContent = categorie;
            categorySelect.appendChild(option);
        }
    });
    
    // Événement de changement de catégorie (uniquement si pas déjà attaché)
    if (!categorySelect.hasAttribute('data-listener-attached')) {
        categorySelect.addEventListener('change', (e) => {
            categorieActuelle = e.target.value || null;
            pageActuelle = 1; // Retour à la première page lors du changement de catégorie
            afficherOffres();
        });
        categorySelect.setAttribute('data-listener-attached', 'true');
    }
}

// Fonction pour initialiser la recherche
function initialiserRecherche() {
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const refreshButton = document.getElementById('refresh-button');

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

    // Actualisation des offres
    refreshButton.addEventListener('click', actualiserOffres);
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
        if (!offresData || Object.keys(offresData).length === 0) {
            offresData = await chargerToutesLesOffres();
            
            // Vérifier que les données ont bien été chargées
            if (!offresData || typeof offresData !== 'object') {
                console.error('Échec du chargement des données');
                offresContainer.innerHTML = '<div class="loading">Erreur : Impossible de charger les offres</div>';
                return;
            }
            
            initialiserDropdownCategories(); // Initialiser le dropdown après le chargement
        }

        offresContainer.innerHTML = '';

        let offresAAfficher = [];

        // Filtrer par catégorie
        if (categorieActuelle) {
            offresAAfficher = offresData[categorieActuelle] || [];
        } else {
            // Afficher toutes les offres - vérifier que offresData existe
            if (offresData && typeof offresData === 'object') {
                Object.values(offresData).forEach(offres => {
                    if (Array.isArray(offres)) {
                        offresAAfficher = offresAAfficher.concat(offres);
                    }
                });
            }
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

// Fonction pour actualiser les offres
async function actualiserOffres() {
    offresCache = {};
    dernierChargement = null;
    offresData = {};
    categorieActuelle = null;
    motRecherche = '';
    pageActuelle = 1;
    document.getElementById('search-input').value = '';
    document.getElementById('category-select').value = '';
    await afficherOffres();
}

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', function() {
    initialiserRecherche();
    initialiserPagination();
    afficherOffres();
});
