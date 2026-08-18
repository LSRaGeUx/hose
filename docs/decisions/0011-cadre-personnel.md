# 0011. Le cadre personnel alimente la synthèse

Statut : acceptée

## Contexte

Le tableau de 2024 collectait « ce que j’aime faire », « ce que je déteste
faire » et « mes aspirations ». Rien ne lisait jamais ces champs. Les trois
verbes d’action étaient donc proposés pour personne en particulier.

Une action que quelqu’un ne fera pas n’est pas une solution, quelle que soit la
qualité du raisonnement qui y mène.

## Décision

Trois champs dans `profiles`, transmis à `synthesize` et `commitToAction`,
**lus sur le serveur depuis la ligne du compte connecté**.

## Conséquences

- Les conseils sont jugés contre ce que la personne fera réellement.
- Le client ne transmet jamais le cadre, donc il ne peut être ni falsifié ni
  utilisé comme vecteur d’injection depuis un autre compte.
- La consigne est nuancée volontairement : éviter ce qui épuise _quand une
  autre voie existe_, et sinon proposer quand même en rendant l’action aussi
  petite que possible. Un assistant qui évite systématiquement l’inconfort ne
  propose plus que du confortable.
- Le cadre est facultatif. Vide, l’app ne dit rien de la personne au modèle
  plutôt que d’envoyer des champs vides, ce qu’un test vérifie.
- Table séparée de `user`, que Better Auth possède et régénère.
