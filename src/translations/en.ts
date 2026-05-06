// English (default). Keep keys flat-ish and meaningful — sub-pages reuse common.*.
const en = {
  common: {
    loading: 'Loading…',
    close: 'Close',
    cancel: 'Cancel',
    ok: 'OK',
    error: 'Error'
  },
  language: {
    label: 'Language',
    en: 'English',
    fr: 'Français',
    es: 'Español'
  },
  signin: {
    title: 'Sign in',
    appContextWith: 'Sign in to authorise {{appId}}',
    appContextWithout: 'Sign in to your Health Data Safe account',
    usernameLabel: 'Username or email',
    signInButton: 'Sign In',
    signingInButton: 'Signing in…',
    cancelLink: 'Cancel and return',
    cancelLinkWith: 'Cancel and return to {{appId}}',
    forgotPassword: 'Forgot password',
    createAccount: 'Create an account',
    changePassword: 'Change password',
    helpdeskLink: 'Contact our helpdesk'
  },
  mfa: {
    title: 'Two-factor verification',
    prompt: 'Enter the 6-digit code from your authenticator app.',
    placeholder: 'Verification code',
    cancel: 'Cancel',
    submit: 'Verify',
    error: 'MFA verification failed.',
    challengeError: 'Failed to perform MFA challenge.'
  },
  password: {
    label: 'Password',
    confirmationLabel: 'Password confirmation',
    show: 'Show password',
    hide: 'Hide password',
    required: 'Password is required.',
    confirmationMismatch: 'Password confirmation does not match.'
  },
  register: {
    title: 'Create your account',
    intro: 'Join Health Data Safe to securely manage and share your health data.',
    usernameLabel: 'Username',
    usernameHint: 'Letters, numbers and dashes. 5–60 characters.',
    emailLabel: 'E-mail',
    emailHint: 'Optional, but required to recover your password later.',
    hostingLabel: 'Hosting region',
    submit: 'Create account',
    submitting: 'Creating…',
    termsPrefix: 'By creating an account you agree to our',
    termsLink: 'terms and conditions',
    successTitle: 'Welcome to Health Data Safe',
    successBody: 'Your account {{username}} has been created.',
    successContinueAuth: 'Continue to sign in',
    alreadyHaveAccount: 'Already have an account?',
    signInLink: 'Sign in'
  },
  signinhub: {
    title: 'Find your account',
    intro: 'Enter your username or email to continue to your Health Data Safe homepage.',
    submit: 'Continue',
    submitting: 'Loading…'
  },
  changepassword: {
    title: 'Change password',
    intro: 'Update your password. We’ll sign you in with the current one to verify it’s you.',
    currentPasswordLabel: 'Current password',
    newPasswordLabel: 'New password',
    newPasswordConfirmationLabel: 'Confirm new password',
    submit: 'Change password',
    submitting: 'Changing…',
    successTitle: 'Password changed',
    successBody: 'Your password has been changed. You can now sign in with your new password.'
  },
  reset: {
    request: {
      title: 'Reset password',
      intro: 'Enter your username or email and we’ll send you a link to reset your password.',
      submit: 'Send reset email',
      submitting: 'Sending…',
      successTitle: 'Check your inbox',
      successBody: 'If an account matches, password reset instructions have been sent. The link expires within one hour.'
    },
    set: {
      title: 'Set a new password',
      intro: 'Choose a new password for your Health Data Safe account.',
      submit: 'Change password',
      submitting: 'Changing…',
      successTitle: 'Password changed',
      successBody: 'Your password has been changed. You can now sign in with your new password.'
    },
    backToSignIn: 'Back to sign in',
    backToReset: 'Back'
  },
  consent: {
    title: 'Authorise {{appId}}',
    intro: 'This app is requesting access to your Health Data Safe account.',
    permissionsHeading: '{{appId}} would like to:',
    levelRead: 'View',
    levelContribute: 'Add to',
    levelManage: 'Manage',
    streamAll: 'all your data',
    expiresAfter: 'This access will expire after {{seconds}}s.',
    mismatchWarning: 'You have already given this app a different access. Continuing replaces the previous one.',
    accept: 'Accept',
    reject: 'Reject',
    revokeNote: 'You can revoke this access at any time from your account.'
  }
}

export default en
// Translations is the structural shape — fr/es are checked against this
// for *which keys* must be present, but values can be any string. (Don't
// `as const` the bag, or fr/es can't supply different strings.)
export type Translations = typeof en
