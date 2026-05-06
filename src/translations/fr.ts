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
  },
  changepassword: {
    title: 'Changer le mot de passe',
    intro: 'Mettez à jour votre mot de passe. Nous nous connecterons avec l’actuel pour confirmer votre identité.',
    currentPasswordLabel: 'Mot de passe actuel',
    newPasswordLabel: 'Nouveau mot de passe',
    newPasswordConfirmationLabel: 'Confirmez le nouveau mot de passe',
    submit: 'Changer le mot de passe',
    submitting: 'Modification…',
    successTitle: 'Mot de passe modifié',
    successBody: 'Votre mot de passe a été modifié. Vous pouvez maintenant vous connecter avec le nouveau mot de passe.'
  },
  reset: {
    request: {
      title: 'Réinitialiser le mot de passe',
      intro: 'Saisissez votre nom d’utilisateur ou e-mail et nous vous enverrons un lien pour réinitialiser votre mot de passe.',
      submit: 'Envoyer l’e-mail',
      submitting: 'Envoi…',
      successTitle: 'Vérifiez votre boîte mail',
      successBody: 'Si un compte correspond, des instructions de réinitialisation ont été envoyées. Le lien expire dans une heure.'
    },
    set: {
      title: 'Définir un nouveau mot de passe',
      intro: 'Choisissez un nouveau mot de passe pour votre compte Health Data Safe.',
      submit: 'Changer le mot de passe',
      submitting: 'Modification…',
      successTitle: 'Mot de passe modifié',
      successBody: 'Votre mot de passe a été modifié. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.'
    },
    backToSignIn: 'Retour à la connexion',
    backToReset: 'Retour'
  },
  consent: {
    title: 'Autoriser {{appId}}',
    intro: 'Cette application demande l’accès à votre compte Health Data Safe.',
    permissionsHeading: '{{appId}} souhaite :',
    levelRead: 'Consulter',
    levelContribute: 'Ajouter à',
    levelManage: 'Gérer',
    streamAll: 'toutes vos données',
    expiresAfter: 'Cet accès expirera dans {{seconds}}s.',
    mismatchWarning: 'Vous avez déjà donné un accès différent à cette application. Continuer remplace le précédent.',
    accept: 'Accepter',
    reject: 'Refuser',
    revokeNote: 'Vous pouvez révoquer cet accès à tout moment depuis votre compte.'
  }
}

export default fr
