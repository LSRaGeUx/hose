# 0012. Sans clé, l’app tourne et le dit

Statut : acceptée

## Contexte

`HOSE_ANTHROPIC_API_KEY` était déjà optionnelle dans le contrat
d’environnement, donc l’app démarrait sans elle. Mais rien ne le disait : on
pouvait saisir une problématique, valider, et recevoir « quelque chose a
échoué de mon côté », le message générique. Une panne permanente était
présentée comme un incident passager.

Pour un projet de portfolio, c’est aussi une contrainte pratique : la clé
expire, et le dépôt doit rester consultable et exécutable ensuite.

## Décision

Le credential est classé dans `src/lib/ai/availability.ts`, module **sans
aucun import**, lisible à la fois par le bundle navigateur et par le moteur. La
route racine sonde la disponibilité une fois par chargement et la place dans le
contexte du routeur. Le formulaire de départ est désactivé et affiche la
raison, avant toute saisie.

## Conséquences

- Une même classification sert à l’interface et au moteur : ils ne peuvent pas
  être en désaccord sur l’utilisabilité de la clé.
- Deux messages et non un : dire « aucune clé configurée » alors qu’une clé est
  présente mais invalide serait faux.
- Une sonde en échec se résout en « activé » plutôt que de se propager. Ne pas
  savoir ne doit jamais faire tomber l’app, et supposer activé revient
  exactement au comportement précédent.
- Le client reconnaît le message par égalité exacte : la classe d’erreur ne
  survit pas à la frontière des fonctions serveur.
- Le reste de l’app (comptes, historique, tableau, contact) fonctionne
  normalement sans clé.
