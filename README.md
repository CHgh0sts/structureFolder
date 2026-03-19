# File Organizer

Organisateur automatique de fichiers — application Next.js PWA installable sur votre PC personnel.

## Fonctionnalités

- **Surveillance de dossiers** : détecte les nouveaux fichiers en temps réel (chokidar)
- **Règles hiérarchiques** : définissez des règles de tri avec priorité et filtres (extension, nom, regex...)
- **Multi-plateforme** : Windows, macOS, Linux
- **PWA installable** : fonctionne comme une vraie application de bureau
- **Démarrage automatique** : scripts pour lancer l'app au démarrage du PC sans console

## Pré-requis

- **Node.js** v18+
- **PostgreSQL** 14+ (local ou cloud)

## Installation

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer l'environnement
cp .env.local.example .env.local
# Éditez .env.local :
#   - DATABASE_URL  → votre connection string PostgreSQL
#   - JWT_SECRET    → une clé aléatoire (openssl rand -base64 32)

# 3. Créer les tables dans la base de données
npm run db:setup
# ou manuellement :
# npm run db:push

# 4. Compiler
npm run build

# 5. Démarrer
npm start
```

Puis ouvrez **http://localhost:1830** dans votre navigateur.

### PostgreSQL en local (rapide avec Docker)

```bash
docker run -d \
  --name file-organizer-db \
  -e POSTGRES_DB=file_organizer \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  postgres:16

# DATABASE_URL="postgresql://postgres:password@localhost:5432/file_organizer"
```

## Commandes base de données

| Commande | Description |
|---|---|
| `npm run db:setup` | Crée les tables (premier lancement) |
| `npm run db:push` | Synchronise le schéma Prisma → DB |
| `npm run db:studio` | Interface graphique Prisma Studio |
| `npm run db:generate` | Régénère le client Prisma |
| `npm run db:reset` | Réinitialise la BDD (⚠ supprime tout) |

## Premier lancement

Au premier accès, vous serez redirigé vers la page de configuration initiale `/setup` :
1. Entrez un mot de passe administrateur
2. Choisissez les dossiers à surveiller
3. Définissez la destination par défaut
4. (Optionnel) Installez l'application PWA

## Démarrage automatique

Pour lancer File Organizer automatiquement au démarrage du PC **sans fenêtre de console** :

```bash
# Activer le démarrage automatique
npm run enable-startup

# Désactiver
npm run disable-startup
```

| OS | Méthode |
|---|---|
| Windows | Tâche planifiée (nécessite droits admin) |
| macOS | LaunchAgent (`~/Library/LaunchAgents/`) |
| Linux | systemd user service (ou XDG autostart) |

## Structure du projet

```
src/
├── app/
│   ├── page.js              # Redirection selon état (setup/login/dashboard)
│   ├── setup/page.js        # Configuration initiale + PWA
│   ├── login/page.js        # Connexion
│   ├── dashboard/           # Tableau de bord principal
│   └── api/
│       ├── config/          # Gestion de la configuration
│       ├── rules/           # CRUD des règles
│       ├── watcher/         # Contrôle du watcher
│       ├── logs/            # Journal d'activité
│       ├── system/          # Info OS + navigateur de dossiers
│       └── startup/         # Démarrage automatique
├── lib/
│   ├── config.js            # Lecture/écriture config (data/config.json)
│   ├── rules-engine.js      # Moteur de règles hiérarchiques
│   ├── watcher.js           # Service chokidar
│   └── auth.js              # JWT + sessions
└── components/
    ├── FolderBrowser.jsx    # Navigateur de dossiers
    ├── RuleModal.jsx        # Formulaire de règle
    └── Navbar.jsx
data/
├── config.json              # Configuration persistante (créé automatiquement)
└── logs.json                # Journal d'activité
scripts/
├── enable-startup.mjs       # Active le démarrage automatique
└── disable-startup.mjs      # Désactive le démarrage automatique
public/
├── manifest.json            # Manifest PWA
└── sw.js                    # Service Worker
```

## Format des règles

Les règles sont évaluées par **ordre de priorité** (1 = la plus haute). La **première règle qui correspond** est appliquée.

### Filtres disponibles
- `filenameStartsWith` : le nom commence par une valeur
- `filenameEndsWith` : le nom se termine par une valeur
- `filenameContains` : le nom contient une valeur
- `filenameRegex` : expression régulière sur le nom complet
- `extension` : extension exacte

### Exemple
```json
[
  {
    "priority": 1,
    "name": "Séries S01",
    "extensions": [".mp4", ".mkv"],
    "filters": [{ "type": "filenameStartsWith", "value": "S01" }],
    "destination": "/Media/Series/Saison1"
  },
  {
    "priority": 2,
    "name": "Toutes les vidéos",
    "extensions": [".mp4", ".mkv", ".avi"],
    "filters": [],
    "destination": "/Media/Videos"
  }
]
```

## Accès au système de fichiers

L'application tourne en Node.js local, elle a accès à tous les disques.

**macOS** : si vous surveillez des dossiers protégés (Bureau, Documents, disques externes), accordez l'accès dans :
`Préférences Système > Sécurité et confidentialité > Accès complet au disque > Terminal/Node`
