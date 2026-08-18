# Tests

```bash
npm test           # Vitest, 37 tests
npm run test:e2e   # Playwright, 8 tests, sur son propre port
npx tsc --noEmit   # typage
npm run lint       # eslint
```

## Principe

Les tests portent sur ce qui peut casser silencieusement. Ils ne cherchent pas
à couvrir des lignes, ils cherchent à protéger des décisions : quand un test
échoue ici, c’est qu’une règle a été enfreinte, pas qu’un rendu a bougé.

Aucun test ne dépense de jeton Anthropic ni n’attend la latence d’un modèle.

## Tests unitaires (Vitest)

### `five-whys.test.ts` (16 tests)

Le moteur contre un client factice. C’est possible parce que le moteur reçoit
son client en paramètre au lieu de le construire.

Ce qui est vérifié, par groupe :

- **Les appels** : la problématique part bien au modèle, les réponses
  précédentes sont transmises pour que la question suivante s’appuie dessus, un
  format de sortie contraint par schéma est bien demandé.
- **La normalisation** : verbes coupés et passés en minuscules ; les cinq
  échanges reviennent nettoyés.
- **La règle sémantique** : trois verbes identiques sont rejetés, parce qu’ils
  violeraient la clé primaire de `problem_verbs`.
- **Le cadre personnel** : il atteint le modèle quand il est rempli, l’app ne
  dit rien de la personne quand il ne l’est pas, et seuls les champs remplis
  sont transmis.
- **Les reprises sur erreur** : un mauvais nombre d’éléments est réessayé ; la
  reprise dit au modèle _ce qui_ n’allait pas au lieu de reposer la même
  question ; au bout de trois tentatives le moteur abandonne au lieu de boucler.
- **Les défaillances** : un refus lève `RefusedError` _avant_ toute lecture du
  corps, la catégorie du refus est portée, un refus n’est jamais réessayé, et
  une réponse qui ne parse pas lève `MalformedError`.

Le test « ne réessaie pas un refus » vaut d’être signalé : c’est la différence
entre une reprise sur erreur et un acharnement facturé.

### `board-layout.test.ts` (9 tests)

`seedGraph()` est une fonction pure, donc entièrement testable. Les assertions
portent sur des affirmations de conception, pas sur des coordonnées :

- un nœud par élément du parcours,
- les pourquoi s’enchaînent, donc la descente est visible,
- **les verbes pendent du dernier pourquoi et non de la problématique**,
- tous les identifiants sont uniques,
- la colonne de cadre n’apparaît que si quelque chose a été rempli,
- l’engagement devient une action à cocher, et rien n’apparaît sans engagement.

### `availability.test.ts` (8 tests)

La classification du credential et les messages français. Le test important
est celui qui vérifie que `isDisabledMessage` reconnaît exactement les messages
produits, et rien d’autre : la classe d’erreur ne survit pas à la frontière des
fonctions serveur, donc le client identifie ces messages par valeur, et ça ne
tient que tant que la comparaison est exacte.

Un autre vérifie qu’on ne dit pas « aucune clé configurée » quand une clé est
présente mais inutilisable. Un message faux est pire qu’un message générique.

### `client.test.ts` (4 tests)

Les trois façons dont un credential peut être inutilisable, et le cas nominal.
Le test sur le jeton Netlify porte la forme exacte du JWT injecté, parce que
c’est un piège qui a coûté un après-midi de débogage : envoyé à
`api.anthropic.com`, il échoue pour une raison que rien dans la réponse
n’explique.

## Tests de bout en bout (Playwright)

8 tests, sur leur propre port, avec leur propre serveur : ils ne se battent
jamais avec un serveur de développement déjà lancé.

- Une visite déconnectée n’atteint ni la page de compte ni un tableau.
- Inscription, arrivée sur la page de compte, déconnexion.
- La confirmation de mot de passe doit correspondre.
- Un mot de passe erroné est refusé.
- **Une URL de parcours survit au détour par la connexion avec sa
  problématique intacte.**
- La page d’accueil met bien la saisie devant le visiteur.
- Une page inconnue affiche l’état « introuvable ».

Deux difficultés réelles ont été rencontrées et méritent d’être connues de qui
touche à ces tests :

1. **Les saisies étaient effacées par l’hydratation** et les clics arrivaient
   avant que les gestionnaires ne soient attachés. Les aides `fill()` et
   `clickUntil()` réessaient jusqu’à ce que l’état tienne, au lieu d’attendre
   une durée arbitraire.
2. **Les paramètres d’URL encodés en formulaire** utilisent `+` pour l’espace,
   donc `decodeURIComponent` seul ne suffit pas.

## Intégration continue

Le workflow lance, sur un vrai Postgres en service : typage, tests unitaires,
lint.

**La suite de bout en bout n’est pas en CI.** Elle échoue sur le serveur de
développement à froid de la CI, d’une manière qui ressemble à une hydratation
qui ne se termine pas. Elle a été retirée plutôt que rendue verte en relâchant
les assertions, ce qui aurait supprimé le signal au lieu du problème.

La piste la plus probable est de la faire tourner contre une version de
production compilée plutôt que contre `vite dev`. Ce n’est pas fait.

Les variables d’environnement de la CI sont des valeurs de remplacement : rien
n’y atteint une vraie base ni l’API Anthropic, mais le contrat de `src/env.ts`
doit quand même être satisfait pour que l’app démarre.

## Ce qui n’est pas testé

- Aucun test de rendu de composant. Les règles qui comptent sont dans des
  fonctions pures, qui elles sont testées.
- Aucun test d’intégration sur les fonctions serveur contre une vraie base. Les
  garanties correspondantes sont portées par les contraintes du schéma, qui ont
  été vérifiées à la main en tentant les écritures interdites : sixième
  pourquoi, position dupliquée, verbe sans piste, verbe dupliqué, et un
  déroulement complet interrompu au milieu pour observer le rollback.
- Aucun test de non-régression visuelle.
