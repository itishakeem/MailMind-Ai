interface FuzzyClient {
  id: string;
  name: string;
  email: string;
  company: string | null;
}

export function fuzzyMatchClients(clients: FuzzyClient[], identifier: string): FuzzyClient[] {
  const q = identifier.toLowerCase().trim();
  if (!q) return [];
  return clients.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
  );
}
