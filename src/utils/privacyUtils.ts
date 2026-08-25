/**
 * Utilitários para proteção, anonimização e mascaramento de dados sensíveis (LGPD / DLP)
 */

export function maskEmail(email: string | null | undefined): string {
  if (!email || !email.includes('@')) return '••••@••••.•••';
  const [user, domain] = email.split('@');
  if (user.length <= 2) {
    return `${user.charAt(0)}*@${domain}`;
  }
  const firstChar = user.charAt(0);
  const lastChar = user.charAt(user.length - 1);
  return `${firstChar}***${lastChar}@${domain}`;
}

export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '••••••••••';
  const clean = phone.replace(/\D/g, '');
  if (clean.length < 8) return '••••-••••';

  if (clean.length >= 10) {
    const ddd = clean.slice(0, 2);
    const firstTwo = clean.slice(2, 4);
    const lastTwo = clean.slice(-2);
    return `(${ddd}) ${firstTwo}***-**${lastTwo}`;
  }

  const firstTwo = clean.slice(0, 2);
  const lastTwo = clean.slice(-2);
  return `${firstTwo}***-**${lastTwo}`;
}

export function maskDocument(doc: string | null | undefined): string {
  if (!doc) return '•••.•••.•••-••';
  const clean = doc.replace(/\D/g, '');
  if (clean.length === 14) {
    // CNPJ
    return `${clean.slice(0, 2)}.***.***/${clean.slice(8, 12)}-**`;
  }
  if (clean.length === 11) {
    // CPF
    return `${clean.slice(0, 3)}.***.***-${clean.slice(9, 11)}`;
  }
  return '•••.•••.•••-••';
}

export function maskCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return 'R$ •••';
  return 'R$ ••••••';
}

export function maskApiKey(key: string | null | undefined): string {
  if (!key) return '';
  if (key.length <= 8) return '••••••••';
  const start = key.slice(0, 4);
  const end = key.slice(-4);
  return `${start}${'•'.repeat(Math.min(16, key.length - 8))}${end}`;
}
