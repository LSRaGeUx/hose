# 0013. La suite de bout en bout sort de la CI

Statut : acceptée, à revoir

## Contexte

Les huit tests Playwright passent en local et échouent en CI. La défaillance
ressemble à une hydratation qui ne se termine pas sur un serveur de
développement démarré à froid : les saisies sont effacées, les clics arrivent
avant que les gestionnaires ne soient attachés.

Des aides `fill()` et `clickUntil()` qui réessaient ont réglé le problème en
local mais pas en CI.

## Décision

La suite est retirée de la CI et reste une commande locale. La CI conserve le
typage, les tests unitaires et le lint, sur un vrai Postgres.

## Conséquences

- Les huit garanties de bout en bout ne sont plus vérifiées automatiquement à
  chaque poussée. C’est une perte réelle, pas un détail.
- L’alternative était de rendre la suite verte en relâchant les assertions ou
  en ajoutant des attentes fixes, ce qui aurait supprimé le signal plutôt que
  le problème.
- La cause reste une hypothèse et non un diagnostic. La piste la plus probable
  est de faire tourner la suite contre une version de production compilée
  plutôt que contre `vite dev`. Ce n’est pas fait.
- Le statut est « à revoir » et non « acceptée » tout court : c’est une dette
  connue, pas une position.
