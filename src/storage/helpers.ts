export function load(key: string): string | null {
  return localStorage.getItem(key);
}

export function save(key: string, value: string): void {
  localStorage.setItem(key, value);
}

export function remove(key: string): void {
  localStorage.removeItem(key);
}
