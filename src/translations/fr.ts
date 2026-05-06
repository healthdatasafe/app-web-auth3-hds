import type { Translations } from './en'

const fr: Translations = {
  common: {
    loading: 'Chargement…',
    close: 'Fermer',
    cancel: 'Annuler',
    ok: 'OK',
    error: 'Erreur'
  },
  language: {
    label: 'Langue',
    en: 'English',
    fr: 'Français',
    es: 'Español'
  },
  signin: {
    title: 'Connexion',
    appContextWith: 'Connectez-vous pour autoriser {{appId}}',
    appContextWithout: 'Connectez-vous à votre compte Health Data Safe',
    usernameLabel: 'Nom d’utilisateur ou e-mail',
    signInButton: 'Se connecter',
    signingInButton: 'Connexion…',
    cancelLink: 'Annuler et revenir',
    cancelLinkWith: 'Annuler et revenir à {{appId}}',
    forgotPassword: 'Mot de passe oublié',
    createAccount: 'Créer un compte',
    changePassword: 'Changer le mot de passe',
    helpdeskLink: 'Contacter le support'
  },
  mfa: {
    title: 'Vérification en deux étapes',
    prompt: 'Saisissez le code à 6 chiffres de votre application d’authentification.',
    placeholder: 'Code de vérification',
    cancel: 'Annuler',
    submit: 'Vérifier',
    error: 'Échec de la vérification MFA.',
    challengeError: 'Échec du défi MFA.'
  },
  password: {
    label: 'Mot de passe',
    confirmationLabel: 'Confirmation du mot de passe',
    show: 'Afficher le mot de passe',
    hide: 'Masquer le mot de passe',
    required: 'Le mot de passe est obligatoire.',
    confirmationMismatch: 'La confirmation du mot de passe ne correspond pas.'
  }
}

export default fr
