# Architecture

## En une phrase

Une application TanStack Start : le rendu est fait sur le serveur, les appels
au serveur sont des fonctions typées et non des routes REST, et rien de
sensible ne traverse jamais le bundle navigateur.

## Le trajet d’une requête

```
navigateur
   │
   ▼
__root.tsx  beforeLoad
   │  fetchSession()    → session lue depuis les cookies, côté serveur
   │  fetchAiStatus()   → l'instance a-t-elle une clé Claude utilisable
   ▼
_authed.tsx  beforeLoad            (routes protégées uniquement)
   │  pas de session → redirect /connexion?redirect=<chemin complet>
   ▼
route          composant + fonctions serveur
   │
   ├── #/lib/problems.ts   lecture et écriture des parcours
   ├── #/lib/board.ts      lecture et écriture du tableau
   ├── #/lib/profile.ts    profil et cadre personnel
   └── #/lib/ai/server.ts  moteur des cinq pourquoi
              │
              ▼
        Drizzle → Postgres        SDK Anthropic → api.anthropic.com
```

Le point important est que `beforeLoad` s’exécute **avant** le loader et avant
tout rendu. Une visite déconnectée sur `/mon-compte` est redirigée sans qu’une
seule ligne de markup ne soit produite. Le contrôle n’est pas un composant qui
décide de ne rien afficher.

## Frontières

### Ce qui vit uniquement sur le serveur

- La chaîne de connexion Postgres et toute requête SQL.
- La clé Anthropic et toute construction de client Anthropic.
- La résolution de session (`auth.api.getSession`).
- Les prompts, qui contiennent la personnalité de l’assistant.

Le mécanisme est `createServerFn` : le corps du handler est retiré du bundle
client à la compilation, et l’appel devient une requête HTTP typée. Ce n’est
pas une convention à respecter, c’est la compilation qui l’applique.

### Ce qui vit des deux côtés

Deux modules sont volontairement **sans imports**, pour pouvoir être lus par le
navigateur comme par le moteur sans traîner `env` ni le SDK derrière eux :

- `src/lib/ai/frame.ts` : le type du cadre personnel et sa valeur vide.
- `src/lib/ai/availability.ts` : l’état du credential et les messages en
  français qui vont avec.

C’est une contrainte réelle et pas de la coquetterie : deux fois pendant le
développement, un import ajouté au moteur a fait remonter `env` dans la suite
de tests, qui a échoué sur la validation d’environnement. Le commentaire en
tête de ces fichiers dit pourquoi ils sont vides d’imports.

## La machine à états d’un parcours

Un parcours vit entièrement dans l’état React de `/reflexion` jusqu’à son
enregistrement. Rien n’est écrit tant que la chaîne n’est pas complète.

```
setup ──► starting ──► waiting-for-answer ◄──┐
  │                          │               │
  │                          ▼               │
  │                       thinking ──────────┘   (mode assisté, 5 tours)
  │
  └──────► starting ──► synthesizing ──► saving ──► done
                            ▲                          (mode auto)
                            │
                        rewinding      (une réponse devinée a été corrigée)
```

Les états sont dans `src/components/reflexion/types.ts`. `synthesizing` est
distinct de `thinking` parce que c’est l’étape la plus lente et qu’elle mérite
son propre message plutôt qu’un indicateur générique.

`rewinding` mérite une explication. En mode auto, le modèle devine les réponses.
Si la personne en corrige une, tout ce qui suit a été raisonné à partir de
quelque chose qui n’est plus vrai : la queue de la chaîne est donc rejouée
depuis le préfixe corrigé, avec un schéma construit pour exactement le nombre
d’échanges manquants.

## Un parcours abandonné ne laisse rien

L’écriture se fait en une transaction, à la fin, dans `saveRun`. Une
conversation abandonnée au troisième pourquoi ne laisse aucune ligne derrière
elle. C’est ce qui autorise le reste du modèle de données à être strict : les
contraintes peuvent exiger cinq échanges et trois verbes parce qu’aucun
parcours partiel n’est jamais écrit.

## Routes

| Route                        | Protégée | Rôle                                                      |
| ---------------------------- | -------- | --------------------------------------------------------- |
| `/`                          | non      | La problématique se saisit ici, pas derrière un bouton    |
| `/connexion`, `/inscription` | non      | Redirigent vers `/mon-compte` si déjà connecté            |
| `/contact`                   | non      | Se désactive proprement sans clés Resend                  |
| `/reflexion`                 | oui      | Le parcours, les deux modes                               |
| `/mon-compte`                | oui      | Profil, cadre personnel, historique, fréquence des verbes |
| `/tableau/$problemId`        | oui      | Le canevas éditable                                       |
| `/api/auth/$`                | n/a      | Better Auth                                               |

`/reflexion` accepte `?probleme=…&mode=…`, validés par `validateSearch`. C’est
ce qui permet à la page d’accueil de porter la problématique jusqu’au parcours,
y compris à travers un détour par la connexion : la garde de `_authed` place le
chemin complet dans `?redirect=`, donc la problématique survit à l’aller-retour
et n’a pas à être retapée.

## Configuration

`src/env.ts` déclare le contrat d’environnement avec t3env. Ce qui est
réellement indispensable est requis et échoue au démarrage avec une erreur
nommée. Ce qui est optionnel est déclaré optionnel, et son absence est un état
que l’interface sait dire :

| Variable                     | Requise | Absente                                    |
| ---------------------------- | ------- | ------------------------------------------ |
| `DATABASE_URL`               | oui     | l’app ne démarre pas                       |
| `BETTER_AUTH_SECRET`         | oui     | l’app ne démarre pas                       |
| `BETTER_AUTH_URL`            | oui     | l’app ne démarre pas                       |
| `HOSE_ANTHROPIC_API_KEY`     | non     | l’assistant est désactivé, et le dit       |
| `RESEND_API_KEY` et consorts | non     | le formulaire de contact refuse proprement |

Voir [la décision sur le nom de cette variable](decisions/0006-nom-de-la-cle-api.md),
qui n’est pas un détail cosmétique.
