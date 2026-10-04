export function authRedirect(value: string | string[] | undefined): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u0020]/.test(value)) return '/';
  // These are the application's supported post-login destinations.
  return ['/', '/studio', '/welcome', '/#membership', '/#library', '/#listen'].includes(value) ? value : '/';
}
