# mesOffres - Agrégateur d'Offres Français

Un agrégateur d'offres moderne qui collecte automatiquement les meilleures promotions depuis Dealabs et HotUKDeals, avec une interface responsive et un système de catégorisation intelligent.

## 🌟 Fonctionnalités

- **Agrégation automatique** : Collecte en temps réel des offres depuis les flux RSS
- **Catégorisation intelligente** : Classification automatique par catégories (Électronique, Vêtements, Maison, etc.)
- **Interface moderne** : Design responsive avec thème sombre
- **Recherche et filtrage** : Recherche textuelle et filtrage par catégorie
- **Extraction de données** : Prix, images et informations détaillées automatiquement extraites
- **Cache intelligent** : Système de mise en cache pour optimiser les performances

## 🚀 Déploiement

Ce site est automatiquement déployé sur GitHub Pages via GitHub Actions.

### URL du site
Le site est accessible à l'adresse : `https://ahmedooo1.github.io/mesOffres/`

### Déploiement automatique
- **Déclencheur** : Push sur la branche `main`
- **Workflow** : `.github/workflows/deploy.yml`
- **Statut** : [![Deploy to GitHub Pages](https://github.com/ahmedooo1/mesOffres/actions/workflows/deploy.yml/badge.svg)](https://github.com/ahmedooo1/mesOffres/actions/workflows/deploy.yml)

## 🛠️ Technologies utilisées

- **Frontend** : HTML5, CSS3, JavaScript (Vanilla)
- **APIs** : RSS2JSON pour la conversion des flux RSS
- **Sources** : Dealabs, HotUKDeals
- **Déploiement** : GitHub Pages avec GitHub Actions

## 📱 Responsive

L'interface s'adapte automatiquement aux différentes tailles d'écran :
- Desktop
- Tablette  
- Mobile

## 🔧 Développement local

```bash
# Cloner le repository
git clone https://github.com/ahmedooo1/mesOffres.git

# Aller dans le dossier
cd mesOffres

# Servir localement (Python)
python3 -m http.server 8000

# Ou avec Node.js
npx serve .
```

Le site sera accessible sur `http://localhost:8000`

## 📋 Roadmap

Voir le fichier [TODO.md](TODO.md) pour la liste des fonctionnalités planifiées et implémentées.