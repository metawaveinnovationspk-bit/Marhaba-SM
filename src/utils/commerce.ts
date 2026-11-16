import type {
  AccountProfile,
  CartItem,
  CartTotals,
  CheckoutFormData,
  PlayLandInquiryData,
  Product,
  ReservationFormData,
  SavedAddress,
  ShopFilterState,
} from '../types/marhaba';

export const FREE_DELIVERY_THRESHOLD_PKR = 5000;
export const STANDARD_DELIVERY_FEE_PKR = 250;

export function formatPKR(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  return `Rs. ${safe.toLocaleString('en-PK')}`;
}

export function calculateDiscountPercent(originalPrice?: number, salePrice?: number): number {
  if (!originalPrice || !salePrice || originalPrice <= 0 || salePrice >= originalPrice) {
    return 0;
  }
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
}

export function filterAndSortProducts(products: Product[], filter: ShopFilterState): Product[] {
  const query = filter.searchQuery.trim().toLowerCase();

  const filtered = products.filter((product) => {
    if (filter.departmentId && product.departmentId !== filter.departmentId) {
      return false;
    }
    if (filter.subcategory && product.subcategory !== filter.subcategory) {
      return false;
    }
    if (filter.brands.length > 0 && !filter.brands.includes(product.brand)) {
      return false;
    }
    if (filter.minPrice !== null && product.price < filter.minPrice) {
      return false;
    }
    if (filter.maxPrice !== null && product.price > filter.maxPrice) {
      return false;
    }
    if (filter.availability === 'in-stock' && !product.inStock) {
      return false;
    }
    if (filter.availability === 'out-of-stock' && product.inStock) {
      return false;
    }
    if (filter.offersOnly && calculateDiscountPercent(product.originalPrice, product.price) <= 0) {
      return false;
    }

    for (const [attrKey, selectedValues] of Object.entries(filter.attributes)) {
      if (selectedValues.length > 0) {
        const productAttrValue = product.attributes[attrKey];
        if (!productAttrValue || !selectedValues.includes(productAttrValue)) {
          return false;
        }
      }
    }

    if (query) {
      const searchable = [
        product.name,
        product.brand,
        product.sku,
        product.subcategory,
        product.unitLabel,
        product.description,
      ]
        .join(' ')
        .toLowerCase();
      if (!searchable.includes(query)) {
        return false;
      }
    }

    return true;
  });

  const sorted = [...filtered];
  switch (filter.sortBy) {
    case 'price-asc':
      sorted.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      sorted.sort((a, b) => b.price - a.price);
      break;
    case 'discount':
      sorted.sort(
        (a, b) =>
          calculateDiscountPercent(b.originalPrice, b.price) -
          calculateDiscountPercent(a.originalPrice, a.price)
      );
      break;
    case 'name-asc':
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'featured':
    default:
      sorted.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        if (a.dataTier === 'verified' && b.dataTier !== 'verified') return -1;
        if (a.dataTier !== 'verified' && b.dataTier === 'verified') return 1;
        return a.name.localeCompare(b.name);
      });
      break;
  }

  return sorted;
}

export function addOrUpdateCartItem(
  currentItems: CartItem[],
  product: Product,
  variantId: string,
  quantityToAdd: number
): { items: CartItem[]; error?: string } {
  if (!product.inStock) {
    return { items: currentItems, error: 'This product is currently out of stock.' };
  }
  const variant = product.variants.find((v) => v.id === variantId) ?? product.variants[0];
  if (!variant) {
    return { items: currentItems, error: 'Please select a valid product variation.' };
  }
  if (!variant.inStock) {
    return { items: currentItems, error: `${variant.label} is currently unavailable.` };
  }
  const safeQty = Math.floor(quantityToAdd);
  if (!Number.isFinite(safeQty) || safeQty < 1) {
    return { items: currentItems, error: 'Quantity must be at least 1.' };
  }

  const existingIndex = currentItems.findIndex(
    (item) => item.productId === product.id && item.variantId === variant.id
  );

  if (existingIndex >= 0) {
    const updated = [...currentItems];
    const nextQty = Math.min(99, updated[existingIndex].quantity + safeQty);
    updated[existingIndex] = {
      ...updated[existingIndex],
      quantity: nextQty,
      unitPrice: variant.price,
      originalPrice: variant.originalPrice,
    };
    return { items: updated };
  }

  const newItem: CartItem = {
    productId: product.id,
    variantId: variant.id,
    name: product.name,
    brand: product.brand,
    variantLabel: variant.label,
    unitPrice: variant.price,
    originalPrice: variant.originalPrice,
    quantity: Math.min(99, safeQty),
    image: product.image,
    packshotStyle: product.packshotStyle,
    packshotAccent: product.packshotAccent,
  };

  return { items: [...currentItems, newItem] };
}

export function updateCartItemQuantity(
  currentItems: CartItem[],
  productId: string,
  variantId: string,
  quantity: number
): CartItem[] {
  if (quantity <= 0) {
    return currentItems.filter(
      (item) => !(item.productId === productId && item.variantId === variantId)
    );
  }
  const clamped = Math.min(99, Math.floor(quantity));
  return currentItems.map((item) =>
    item.productId === productId && item.variantId === variantId
      ? { ...item, quantity: clamped }
      : item
  );
}

export function calculateCartTotals(
  items: CartItem[],
  fulfillmentMethod: 'delivery' | 'pickup' = 'delivery'
): CartTotals {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const totalSavings = items.reduce((sum, item) => {
    if (item.originalPrice && item.originalPrice > item.unitPrice) {
      return sum + (item.originalPrice - item.unitPrice) * item.quantity;
    }
    return sum;
  }, 0);

  const deliveryFee =
    items.length === 0 || fulfillmentMethod === 'pickup' || subtotal >= FREE_DELIVERY_THRESHOLD_PKR
      ? 0
      : STANDARD_DELIVERY_FEE_PKR;

  const amountToFreeDelivery =
    fulfillmentMethod === 'pickup'
      ? 0
      : Math.max(0, FREE_DELIVERY_THRESHOLD_PKR - subtotal);

  return {
    itemCount,
    subtotal,
    totalSavings,
    deliveryFee,
    freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD_PKR,
    amountToFreeDelivery,
    finalTotal: subtotal + deliveryFee,
  };
}

export function validateCheckoutForm(data: CheckoutFormData): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!data.fullName.trim() || data.fullName.trim().length < 2) {
    errors.fullName = 'Please enter your full name.';
  }
  const cleanPhone = data.phone.replace(/[\s-]/g, '');
  if (!/^(\+92|0)?3\d{9}$/.test(cleanPhone) && cleanPhone.length < 10) {
    errors.phone = 'Please enter a valid Pakistani mobile number (e.g. 03XX-XXXXXXX).';
  }
  if (data.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }
  if (data.fulfillmentMethod === 'delivery') {
    if (!data.address.trim() || data.address.trim().length < 6) {
      errors.address = 'Please enter a complete street or sector delivery address.';
    }
    if (!data.city.trim()) {
      errors.city = 'Please select or enter your city.';
    }
  }
  return errors;
}

export function validateReservationForm(data: ReservationFormData): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!data.date) {
    errors.date = 'Please select a preferred dining date.';
  }
  if (!data.time) {
    errors.time = 'Please select a preferred dining time.';
  }
  if (!Number.isFinite(data.partySize) || data.partySize < 1 || data.partySize > 40) {
    errors.partySize = 'Party size must be between 1 and 40 guests.';
  }
  if (!data.customerName.trim() || data.customerName.trim().length < 2) {
    errors.customerName = 'Please enter your name for the reservation.';
  }
  const cleanPhone = data.contactNumber.replace(/[\s-]/g, '');
  if (cleanPhone.length < 10) {
    errors.contactNumber = 'Please provide a reachable contact number.';
  }
  return errors;
}

export function validatePlayLandInquiry(data: PlayLandInquiryData): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!Number.isFinite(data.childrenCount) || data.childrenCount < 1 || data.childrenCount > 60) {
    errors.childrenCount = 'Please specify between 1 and 60 children.';
  }
  if (data.ageGroups.length === 0) {
    errors.ageGroups = 'Please select at least one child age group.';
  }
  if (!Number.isFinite(data.adultsCount) || data.adultsCount < 1) {
    errors.adultsCount = 'At least 1 accompanying adult/guardian is required.';
  }
  if (!data.preferredDate) {
    errors.preferredDate = 'Please select your preferred visit date.';
  }
  if (!data.parentName.trim() || data.parentName.trim().length < 2) {
    errors.parentName = 'Please enter parent or guardian name.';
  }
  const cleanPhone = data.contactPhone.replace(/[\s-]/g, '');
  if (cleanPhone.length < 10) {
    errors.contactPhone = 'Please enter a valid contact number.';
  }
  return errors;
}

export function getRelatedProducts(
  allProducts: Product[],
  target: Product,
  limit = 4
): Product[] {
  const seen = new Set<string>([target.id]);
  const picks: Product[] = [];

  const pushUnique = (list: Product[]) => {
    for (const item of list) {
      if (picks.length >= limit) break;
      if (!seen.has(item.id)) {
        seen.add(item.id);
        picks.push(item);
      }
    }
  };

  // 1. Same department (prefer in-stock & verified first)
  pushUnique(
    allProducts.filter((p) => p.departmentId === target.departmentId && p.inStock)
  );
  // 2. Same brand across departments
  pushUnique(allProducts.filter((p) => p.brand === target.brand && p.inStock));
  // 3. Verified & featured everyday essentials backfill so the 4-column desktop row stays balanced
  pushUnique(
    allProducts.filter((p) => p.dataTier === 'verified' && p.featured && p.inStock)
  );
  pushUnique(allProducts.filter((p) => p.inStock));

  return picks.slice(0, limit);
}

export function validateAddressForm(
  data: Omit<SavedAddress, 'id' | 'isDefault'>
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!data.label.trim()) {
    errors.label = 'Please enter an address label (e.g. Home, Office).';
  }
  if (!data.recipientName.trim() || data.recipientName.trim().length < 2) {
    errors.recipientName = 'Please enter the recipient name.';
  }
  const cleanPhone = data.phone.replace(/[\s-]/g, '');
  if (cleanPhone.length < 10) {
    errors.phone = 'Please enter a valid contact number.';
  }
  if (!data.streetAddress.trim() || data.streetAddress.trim().length < 6) {
    errors.streetAddress = 'Please enter your complete street or block address.';
  }
  if (!data.city.trim()) {
    errors.city = 'Please choose or enter a city.';
  }
  return errors;
}

export function validateProfileForm(data: AccountProfile): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!data.fullName.trim() || data.fullName.trim().length < 2) {
    errors.fullName = 'Please enter your full name.';
  }
  if (!data.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }
  const cleanPhone = data.phone.replace(/[\s-]/g, '');
  if (cleanPhone.length < 10) {
    errors.phone = 'Please enter a valid mobile number.';
  }
  return errors;
}

export function validatePasswordChange(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!currentPassword.trim()) {
    errors.currentPassword = 'Enter your current password.';
  }
  if (newPassword.length < 8) {
    errors.newPassword = 'New password must be at least 8 characters.';
  }
  if (newPassword !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }
  return errors;
}


