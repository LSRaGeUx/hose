/**
 * Better Auth reports errors in English with stable codes. The UI is French, so
 * codes are mapped here rather than showing the raw message to the user.
 */
const MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: 'Adresse e-mail ou mot de passe incorrect.',
  INVALID_EMAIL: 'Cette adresse e-mail est invalide.',
  INVALID_PASSWORD: 'Mot de passe incorrect.',
  USER_ALREADY_EXISTS: 'Un compte existe déjà avec cette adresse e-mail.',
  USER_NOT_FOUND: 'Aucun compte ne correspond à cette adresse e-mail.',
  PASSWORD_TOO_SHORT: 'Le mot de passe est trop court.',
  PASSWORD_TOO_LONG: 'Le mot de passe est trop long.',
  EMAIL_NOT_VERIFIED: 'Cette adresse e-mail n’a pas encore été vérifiée.',
}

export function translateAuthError(error: {
  code?: string
  message?: string
}): string {
  if (error.code && MESSAGES[error.code]) return MESSAGES[error.code]
  return 'Une erreur est survenue. Réessaie dans un instant.'
}
