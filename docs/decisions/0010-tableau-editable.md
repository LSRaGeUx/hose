# 0010. Un canevas éditable plutôt qu’un rendu du parcours

Statut : acceptée

## Contexte

Le tableau restituait le parcours. C’était une illustration : joli, et sans
usage après la première lecture. Or l’endroit où une réflexion devient un plan
est précisément là.

## Décision

React Flow, avec ajout de nœuds, liaison, édition du texte, suppression,
annulation et autosauvegarde. Le canevas s’ouvre déjà rempli du raisonnement,
du cadre personnel et de l’action engagée.

## Conséquences

- Le tableau devient un lieu de travail et non une page de résultat.
- React Flow est sous licence MIT, donc pas de contrainte de licence.
- Trois problèmes réels sont apparus et ont dû être résolus : les changements
  de dimension comptés comme des modifications déclenchaient une écriture à
  chaque ouverture, les nœuds ajoutés atterrissaient sur l’arbre existant, et
  l’état d’affichage de React Flow partait en base. Détail dans
  [Tableau](../board.md).
- Le graphe est stocké en `jsonb`, parce qu’il est toujours lu et écrit en
  entier. Si une vue transversale des actions engagées apparaît un jour, ce
  choix devra être revu.
