# 0014. Interface en français uniquement

Statut : acceptée

## Contexte

Le projet d’origine était en français. La méthode des cinq pourquoi se pratique
ici en français, le tutoiement fait partie du ton, et les prompts sont écrits
en français.

## Décision

Pas d’internationalisation. Une seule langue dans l’interface, dans les
prompts, dans les messages d’erreur destinés aux personnes, et dans cette
documentation.

## Conséquences

- Aucune infrastructure de traduction, aucun fichier de chaînes, aucune clé à
  tenir synchronisée.
- Les messages destinés aux personnes sont écrits directement là où ils
  servent, ce qui les rend lisibles en contexte pendant une revue.
- Les erreurs destinées aux développeurs restent en anglais : elles s’adressent
  à qui fait tourner l’instance, et voisinent avec les messages du SDK.
  `client.ts` et `availability.ts` illustrent cette séparation, en produisant
  chacun l’une des deux formes à partir de la même classification.
- Le README racine est en français, avec une version anglaise à côté, parce que
  le dépôt s’adresse aussi à des lecteurs qui ne lisent pas le français. La
  documentation, elle, n’est pas doublée : deux jeux de pages profondes
  divergent plus vite qu’ils ne servent.
- Ouvrir le produit à une autre langue demanderait de reprendre les prompts, pas
  seulement l’interface.
