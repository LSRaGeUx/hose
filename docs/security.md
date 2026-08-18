# Sécurité

Le projet n’est pas déployé et ne traite aucune donnée réelle. Les décisions
ci-dessous sont quand même prises comme si c’était le cas, parce que c’est
l’intérêt de l’exercice, et parce que la version 2024 offre un contre-exemple
pour chacune.

## Sessions

Better Auth, e-mail et mot de passe, avec l’adaptateur Drizzle. Les sessions
sont des cookies signés par `BETTER_AUTH_SECRET`.

La résolution se fait **sur le serveur**, depuis les en-têtes de la requête :

```ts
const session = await auth.api.getSession({ headers: getRequest().headers })
```

Cet appel est dans `fetchSession`, exécuté par le `beforeLoad` de la route
racine à chaque navigation, et le résultat descend dans le contexte de toutes
les routes filles. Une garde ne fait donc jamais confiance au client.

En 2024, cette décision était prise dans le navigateur à partir de
`sessionStorage`. Le serveur croyait ce que le client affirmait, et toutes les
routes du backend étaient de fait publiques.

## Gardes de route

`src/routes/_authed.tsx` est une route de mise en page sans chemin qui protège
tout ce qui est imbriqué dessous :

```ts
beforeLoad: ({ context, location }) => {
  if (!context.user) {
    throw redirect({ to: '/connexion', search: { redirect: location.href } })
  }
  return { user: context.user }
}
```

Deux propriétés :

1. `beforeLoad` s’exécute avant le loader et avant tout rendu. Une visite
   déconnectée est redirigée sans qu’aucun markup ne soit produit.
2. Le retour restreint le type pour toutes les routes filles : sous ce point,
   `user` est défini, et ça n’est pas une supposition.

Le paramètre `redirect` est validé par zod et n’accepte qu’un chemin relatif :

```ts
z.string().refine((v) => v.startsWith('/') && !v.startsWith('//'))
```

Le second test compte. Sans lui, `//evil.example` est un chemin protocole
relatif, et le paramètre devient une redirection ouverte.

## Propriété des données

**La propriété est dans la clause `WHERE`, jamais un contrôle après lecture.**

```ts
where: and(eq(problems.id, data.problemId), eq(problems.userId, userId))
```

La problématique de quelqu’un d’autre n’est pas _trouvée puis refusée_, elle
n’est pas trouvée. Il n’existe aucun chemin de code où la ligne est lue d’abord
et la permission décidée ensuite, donc aucun endroit où oublier la seconde
moitié.

Le `userId` vient toujours de la session côté serveur. Aucune fonction serveur
n’accepte d’identifiant de propriétaire dans ses paramètres. Le backend 2024
faisait l’inverse : des routes comme `/getMyProblem` lisaient `ID_user` dans le
corps de la requête et renvoyaient ce qu’il désignait.

`fetchMyProblems` et `fetchVerbStats` n’acceptent aucun paramètre du tout : il
n’y a rien à falsifier.

## Validation des entrées

Chaque fonction serveur a un `.validator(zodSchema)`. Ce n’est pas seulement du
typage : les bornes sont réelles et volontaires.

| Entrée                        | Borne                                     |
| ----------------------------- | ----------------------------------------- |
| Titre de problématique        | 1 à 500 caractères, coupé                 |
| Réponse d’un échange          | non vide                                  |
| Verbe                         | 1 à 80 caractères                         |
| Engagement                    | 1 à 400 caractères                        |
| Champs du cadre personnel     | 400 caractères, vide converti en `null`   |
| Avatar                        | URL `https://` uniquement, 500 caractères |
| Identifiants de problématique | UUID                                      |

L’avatar est une URL fournie par la personne, pas un envoi de fichier. Ça
garde le stockage objet, ses identifiants et sa facture hors du projet pour
une fonctionnalité dont le rôle est de mettre une petite image dans l’en-tête.
`https://` uniquement, parce que la valeur part directement dans un
`<img src>` et qu’une URL `http` serait de toute façon bloquée comme contenu
mixte.

## Secrets

- Rien de secret n’atteint le navigateur. La clé Anthropic n’est lue que dans
  `src/lib/ai/client.ts`, à l’intérieur de fonctions serveur.
- Le contrat d’environnement (`src/env.ts`) impose un préfixe `VITE_` aux
  variables client, vérifié au type et à l’exécution. Une variable serveur ne
  peut pas fuiter dans le bundle par distraction.
- Les identifiants de `compose.yaml` sont committés délibérément : le conteneur
  n’écoute que sur `127.0.0.1` et ne contient que des données de développement
  jetables. C’est de la configuration, pas un secret.
- `.env.local` est ignoré par git. Un `.env.local.bak` créé pendant le
  développement ne l’était **pas**, `*.local` ne couvrant pas ce suffixe. Il a
  été supprimé et le secret concerné régénéré.

En 2024, une adresse Gmail et son mot de passe d’application étaient écrits en
dur dans `Backend/server.js`, ce qui est la façon dont ce mot de passe a fini
dans l’historique git.

Le formulaire de contact envoie l’adresse de l’expéditeur en `reply-to`, jamais
en `from` : c’est une saisie non fiable, et l’utiliser comme expéditeur revient
à laisser n’importe qui usurper le domaine.

## Injection de prompt

Le cadre personnel est lu sur le serveur depuis la ligne du compte connecté et
n’est jamais transmis par le client. Le contenu reste du texte fourni par la
personne, et il alimente un prompt : la surface existe, mais elle est limitée à
son propre compte et n’a accès à aucun outil. Le modèle n’a aucune capacité
d’action, seulement de production de texte contraint par un schéma.

## Ce qui n’est pas fait

À dire explicitement plutôt que de laisser croire à une couverture complète :

- Pas de limitation de débit sur les fonctions serveur. Sur une instance
  publique, `startProblem` serait une facture Anthropic ouverte.
- Pas de vérification d’adresse e-mail, ni de réinitialisation de mot de passe.
- Pas d’en-têtes de sécurité (CSP, HSTS) : ils appartiennent à un déploiement
  qui n’existe pas.
- Pas de journalisation d’audit.

Ce sont des absences assumées pour un projet de portfolio non déployé, pas des
oublis.
