export interface PasswordCheck {
  label: string;
  passed: boolean;
}

export function getPasswordErrors(password: string): PasswordCheck[] {
  return [
    { label: "At least 8 characters", passed: password.length >= 8 },
    { label: "One uppercase letter", passed: /[A-Z]/.test(password) },
    { label: "One lowercase letter", passed: /[a-z]/.test(password) },
    { label: "One number", passed: /\d/.test(password) },
    { label: "One special character (!@#$...)", passed: /[^A-Za-z0-9]/.test(password) },
  ];
}
