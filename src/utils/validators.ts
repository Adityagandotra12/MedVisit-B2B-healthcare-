export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLoginForm(email: string, password: string) {
  const errors: Record<string, string> = {};

  if (!emailRegex.test(email)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters.';
  }

  return errors;
}
