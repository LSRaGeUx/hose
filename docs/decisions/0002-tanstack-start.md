# 0002. TanStack Start plutôt qu’un SPA et une API séparée

Statut : acceptée

## Contexte

L’architecture de 2024 séparait un client React d’un serveur Express. Cette
séparation était la source de la faille principale : le client décidait de
l’authentification, et le serveur croyait les identifiants qu’il recevait dans
le corps des requêtes.

## Décision

TanStack Start : rendu côté serveur, routage par fichiers, et surtout
`createServerFn` pour les appels au serveur.

## Conséquences

- Le corps d’une fonction serveur est retiré du bundle client à la compilation.
  Ce n’est pas une convention, c’est une garantie de la chaîne de build.
- `beforeLoad` s’exécute avant tout rendu, donc une garde redirige sans qu’un
  seul octet de markup ne soit produit. Voir [0007](0007-session-cote-serveur.md).
- Les entrées et sorties sont typées de bout en bout, sans schéma d’API à
  maintenir en double.
- En contrepartie, le framework est jeune et sa documentation encore mince. Une
  option de route (`server:`) a semblé ne pas typer correctement avant qu’on
  découvre que son augmentation de types vivait dans un paquet qu’il fallait
  ajouter au `types` du tsconfig.
