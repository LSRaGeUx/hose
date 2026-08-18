# 0008. La propriété est dans la clause `WHERE`

Statut : acceptée

## Contexte

Le backend 2024 lisait `ID_user` dans le corps de la requête et renvoyait ce
qu’il désignait. Changer un nombre dans la requête suffisait à lire les
problématiques de quelqu’un d’autre.

Même avec un identifiant pris dans la session, il reste un motif fragile :
lire la ligne, puis comparer le propriétaire, puis refuser. Il suffit d’oublier
la seconde moitié une fois.

## Décision

La condition de propriété fait partie de la requête :

```ts
where: and(eq(problems.id, data.problemId), eq(problems.userId, userId))
```

La ressource de quelqu’un d’autre n’est pas trouvée, plutôt que trouvée puis
refusée.

## Conséquences

- Il n’existe aucun endroit où oublier le contrôle, puisqu’il n’y a pas de
  contrôle séparé.
- Le `userId` vient toujours de la session. Aucune fonction serveur n’accepte
  d’identifiant de propriétaire en paramètre.
- Les fonctions de liste n’acceptent aucun paramètre : il n’y a rien à
  falsifier.
- Effet de bord souhaitable : les réponses ne distinguent pas « n’existe pas »
  de « ne t’appartient pas », donc rien ne confirme l’existence d’une ressource
  à quelqu’un qui n’y a pas droit.
