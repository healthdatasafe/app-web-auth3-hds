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
} as const

export default en
export type Translations = typeof en
