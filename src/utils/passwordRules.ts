export interface PasswordRule {
  id: string;
  label: string;
  met: boolean;
}

/** Same rules the backend enforces when a password is changed or reset. */
export function getPasswordRules(password: string, confirmation: string): PasswordRule[] {
  return [
    { id: 'length', label: 'No mínimo 8 caracteres', met: password.length >= 8 },
    { id: 'upper', label: 'Pelo menos uma letra maiúscula (A-Z)', met: /[A-Z]/.test(password) },
    { id: 'lower', label: 'Pelo menos uma letra minúscula (a-z)', met: /[a-z]/.test(password) },
    { id: 'number', label: 'Pelo menos um número (0-9)', met: /[0-9]/.test(password) },
    { id: 'special', label: 'Pelo menos um caractere especial (ex.: ! @ # $ %)', met: /[^A-Za-z0-9]/.test(password) },
    { id: 'match', label: 'As duas senhas são iguais', met: password.length > 0 && password === confirmation },
  ];
}

export function isPasswordValid(password: string, confirmation: string): boolean {
  return getPasswordRules(password, confirmation).every((rule) => rule.met);
}
