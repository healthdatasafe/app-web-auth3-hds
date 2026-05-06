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
  register: {
    title: 'Crea tu cuenta',
    intro: 'Únete a Health Data Safe para gestionar y compartir tus datos de salud con seguridad.',
    usernameLabel: 'Nombre de usuario',
    usernameHint: 'Letras, números y guiones. 5–60 caracteres.',
    emailLabel: 'E-mail',
    emailHint: 'Opcional, pero necesario para restablecer tu contraseña.',
    hostingLabel: 'Región de alojamiento',
    submit: 'Crear cuenta',
    submitting: 'Creando…',
    termsPrefix: 'Al crear una cuenta aceptas nuestras',
    termsLink: 'condiciones de uso',
    successTitle: 'Bienvenido a Health Data Safe',
    successBody: 'Tu cuenta {{username}} ha sido creada.',
    successContinueAuth: 'Continuar para iniciar sesión',
    alreadyHaveAccount: '¿Ya tienes cuenta?',
    signInLink: 'Iniciar sesión'
  },
  signinhub: {
    title: 'Encontrar tu cuenta',
    intro: 'Introduce tu nombre de usuario o e-mail para acceder a tu página de Health Data Safe.',
    submit: 'Continuar',
    submitting: 'Cargando…'
  },
  changepassword: {
    title: 'Cambiar contraseña',
    intro: 'Actualiza tu contraseña. Iniciaremos sesión con la actual para verificar que eres tú.',
    currentPasswordLabel: 'Contraseña actual',
    newPasswordLabel: 'Nueva contraseña',
    newPasswordConfirmationLabel: 'Confirmar nueva contraseña',
    submit: 'Cambiar contraseña',
    submitting: 'Cambiando…',
    successTitle: 'Contraseña cambiada',
    successBody: 'Tu contraseña ha sido cambiada. Ya puedes iniciar sesión con tu nueva contraseña.'
  },
  reset: {
    request: {
      title: 'Restablecer contraseña',
      intro: 'Introduce tu nombre de usuario o e-mail y te enviaremos un enlace para restablecer tu contraseña.',
      submit: 'Enviar e-mail',
      submitting: 'Enviando…',
      successTitle: 'Revisa tu correo',
      successBody: 'Si una cuenta coincide, se han enviado instrucciones para restablecer la contraseña. El enlace caduca en una hora.'
    },
    set: {
      title: 'Establecer una nueva contraseña',
      intro: 'Elige una nueva contraseña para tu cuenta de Health Data Safe.',
      submit: 'Cambiar contraseña',
      submitting: 'Cambiando…',
      successTitle: 'Contraseña cambiada',
      successBody: 'Tu contraseña ha sido cambiada. Ya puedes iniciar sesión con tu nueva contraseña.'
    },
    backToSignIn: 'Volver al inicio de sesión',
    backToReset: 'Volver'
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
