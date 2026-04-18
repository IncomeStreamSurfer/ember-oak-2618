// Client-side cart helpers. Persists to localStorage and emits emberoak:cart-changed.
export type CartItem = {
  id: string;
  slug: string;
  name: string;
  price_pence: number;
  image_url: string;
  quantity: number;
};

const KEY = 'emberoak_cart';

export function readCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function writeCart(cart: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(cart));
  window.dispatchEvent(new CustomEvent('emberoak:cart-changed'));
}

export function addToCart(item: Omit<CartItem, 'quantity'>, qty = 1) {
  const cart = readCart();
  const existing = cart.find((c) => c.id === item.id);
  if (existing) existing.quantity += qty;
  else cart.push({ ...item, quantity: qty });
  writeCart(cart);
}

export function updateQuantity(id: string, qty: number) {
  const cart = readCart().map((c) => (c.id === id ? { ...c, quantity: qty } : c)).filter((c) => c.quantity > 0);
  writeCart(cart);
}

export function removeItem(id: string) {
  writeCart(readCart().filter((c) => c.id !== id));
}

export function clearCart() {
  writeCart([]);
}
