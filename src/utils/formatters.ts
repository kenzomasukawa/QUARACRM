export function formatCurrency(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatDateShort(dateString: string | undefined | null): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatTimeAgo(dateString: string | undefined | null): string {
  if (!dateString) return 'Nunca';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMins < 1) return 'Agora mesmo';
    if (diffInMins < 60) return `Há ${diffInMins}m`;
    if (diffInHours < 24) return `Há ${diffInHours}h`;
    if (diffInDays === 1) return 'Ontem';
    if (diffInDays < 30) return `Há ${diffInDays}d`;
    return formatDateShort(dateString);
  } catch {
    return dateString;
  }
}

export function cleanPhoneForWhatsApp(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (!cleaned.startsWith('55') && cleaned.length >= 10) {
    cleaned = '55' + cleaned;
  }
  return cleaned;
}

export function getWhatsAppDirectUrl(phone: string, messageText?: string): string {
  const clean = cleanPhoneForWhatsApp(phone);
  const encodedText = messageText ? encodeURIComponent(messageText) : '';
  return `https://wa.me/${clean}${encodedText ? `?text=${encodedText}` : ''}`;
}

export function getSLAStatus(
  enteredAt: string,
  slaHours: number
): { isOverdue: boolean; hoursElapsed: number; percentRemaining: number; label: string } {
  if (!enteredAt || slaHours <= 0) {
    return { isOverdue: false, hoursElapsed: 0, percentRemaining: 100, label: 'Sem SLA' };
  }

  const entered = new Date(enteredAt).getTime();
  const now = new Date().getTime();
  const hoursElapsed = Math.max(0, (now - entered) / (1000 * 60 * 60));
  const isOverdue = hoursElapsed > slaHours;
  const percentRemaining = Math.max(0, Math.min(100, ((slaHours - hoursElapsed) / slaHours) * 100));

  let label = '';
  if (isOverdue) {
    const hoursOver = Math.round(hoursElapsed - slaHours);
    label = `SLA Excedido (+${hoursOver}h)`;
  } else {
    const hoursLeft = Math.round(slaHours - hoursElapsed);
    label = `${hoursLeft}h restantes`;
  }

  return { isOverdue, hoursElapsed, percentRemaining, label };
}
