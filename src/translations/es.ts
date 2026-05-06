import type { Translations } from './en'

const es: Translations = {
  common: {
    loading: 'Cargando…',
    close: 'Cerrar',
    cancel: 'Cancelar',
    ok: 'OK',
    error: 'Error'
  },
  language: {
    label: 'Idioma',
    en: 'English',
    fr: 'Français',
    es: 'Español'
  },
  signin: {
    title: 'Iniciar sesión',
    appContextWith: 'Inicia sesión para autorizar {{appId}}',
    appContextWithout: 'Inicia sesión en tu cuenta de Health Data Safe',
    usernameLabel: 'Nombre de usuario o e-mail',
    signInButton: 'Iniciar sesión',
    signingInButton: 'Iniciando sesión…',
    cancelLink: 'Cancelar y volver',
    cancelLinkWith: 'Cancelar y volver a {{appId}}',
    forgotPassword: 'Olvidé mi contraseña',
    createAccount: 'Crear una cuenta',
    changePassword: 'Cambiar contraseña',
    helpdeskLink: 'Contactar con soporte'
  },
  mfa: {
    title: 'Verificación en dos pasos',
    prompt: 'Introduce el código de 6 dígitos de tu aplicación de autenticación.',
    placeholder: 'Código de verificación',
    cancel: 'Cancelar',
    submit: 'Verificar',
    error: 'Error en la verificación MFA.',
    challengeError: 'Error al iniciar el desafío MFA.'
  },
  password: {
    label: 'Contraseña',
    confirmationLabel: 'Confirmación de contraseña',
    show: 'Mostrar contraseña',
    hide: 'Ocultar contraseña',
    required: 'La contraseña es obligatoria.',
    confirmationMismatch: 'La confirmación de la contraseña no coincide.'
  },
  consent: {
    title: 'Autorizar a {{appId}}',
    intro: 'Esta aplicación solicita acceso a tu cuenta de Health Data Safe.',
    permissionsHeading: '{{appId}} desea:',
    levelRead: 'Consultar',
    levelContribute: 'Añadir a',
    levelManage: 'Gestionar',
    streamAll: 'todos tus datos',
    expiresAfter: 'Este acceso caducará dentro de {{seconds}}s.',
    mismatchWarning: 'Ya has concedido a esta aplicación un acceso distinto. Continuar lo reemplazará.',
    accept: 'Aceptar',
    reject: 'Rechazar',
    revokeNote: 'Puedes revocar este acceso en cualquier momento desde tu cuenta.'
  }
}

export default es
