import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addOrUpdateCartItem,
  calculateCartTotals,
  calculateDiscountPercent,
  filterAndSortProducts,
  formatPKR,
  getRelatedProducts,
  updateCartItemQuantity,
  validateAddressForm,
  validateCheckoutForm,
  validatePasswordChange,
  validatePlayLandInquiry,
  validateProfileForm,
  validateReservationForm,
} from './commerce';
import type { Product, ShopFilterState } from '../types/marhaba';

const sampleProducts: Product[] = [
  {
    id: 'olpers-1l',
    sku: 'MRH-DAI-001',
    name: "Olper's Full Cream Milk 1 Liter Carton (12 Packs)",
    brand: "Olper's",
    departmentId: 'dairy-bakery',
    subcategory: 'UHT & Packaged Milk',
    price: 4180,
    originalPrice: 4560,
    unitLabel: '1L × 12 Carton',
    inStock: true,
    variants: [
      { id: 'v-carton', label: '1L × 12 Carton', sku: 'MRH-DAI-001', price: 4180, originalPrice: 4560, inStock: true },
    ],
    packshotStyle: 'carton',
    packshotAccent: '#9B1C2E',
    description: 'Full cream UHT milk carton.',
    specifications: [{ label: 'Volume', value: '12 Liters' }],
    attributes: { 'Pack Size': 'Bulk Carton' },
    featured: true,
    dataTier: 'verified',
  },
  {
    id: 'steam-rice-1kg',
    sku: 'MRH-GRO-001',
    name: 'Premium Basmati Steam Rice',
    brand: 'Marhaba Staples',
    departmentId: 'grocery-pantry',
    subcategory: 'Rice & Grains',
    price: 305,
    originalPrice: 320,
    unitLabel: '1 kg',
    inStock: true,
    variants: [
      { id: 'v-1kg', label: '1 kg', sku: 'MRH-GRO-001', price: 305, originalPrice: 320, inStock: true },
      { id: 'v-5kg', label: '5 kg', sku: 'MRH-GRO-002', price: 1490, originalPrice: 1580, inStock: true },
    ],
    packshotStyle: 'bag',
    packshotAccent: '#166534',
    description: 'Long-grain steam basmati rice.',
    specifications: [{ label: 'Weight', value: '1 kg' }],
    attributes: { Weight: '1 kg', 'Product Type': 'Grains' },
    featured: true,
    dataTier: 'verified',
  },
  {
    id: 'out-of-stock-item',
    sku: 'MRH-BEA-009',
    name: 'Botanical Hair Serum',
    brand: 'Saeed Ghani',
    departmentId: 'beauty-cosmetics',
    subcategory: 'Hair Care',
    price: 950,
    unitLabel: '100 ml',
    inStock: false,
    variants: [
      { id: 'v-100ml', label: '100 ml', sku: 'MRH-BEA-009', price: 950, inStock: false },
    ],
    packshotStyle: 'cosmetic',
    packshotAccent: '#B45309',
    description: 'Nourishing serum.',
    specifications: [],
    attributes: { 'Skin Category': 'All Types' },
    dataTier: 'demonstration',
  },
];

test('calculateDiscountPercent computes accurate rounded percentage without fabrication', () => {
  assert.equal(calculateDiscountPercent(4560, 4180), 8);
  assert.equal(calculateDiscountPercent(120, 100), 17);
  assert.equal(calculateDiscountPercent(100, 100), 0);
  assert.equal(calculateDiscountPercent(undefined, 100), 0);
  assert.equal(calculateDiscountPercent(90, 100), 0);
});

test('formatPKR formats currency cleanly', () => {
  assert.equal(formatPKR(4180), 'Rs. 4,180');
  assert.equal(formatPKR(305), 'Rs. 305');
});

test('filterAndSortProducts filters by department, offers, availability, attributes, and search', () => {
  const baseFilter: ShopFilterState = {
    departmentId: null,
    subcategory: null,
    brands: [],
    minPrice: null,
    maxPrice: null,
    availability: 'all',
    offersOnly: false,
    attributes: {},
    searchQuery: '',
    sortBy: 'featured',
  };

  assert.equal(filterAndSortProducts(sampleProducts, baseFilter).length, 3);
  assert.equal(
    filterAndSortProducts(sampleProducts, { ...baseFilter, departmentId: 'grocery-pantry' }).length,
    1
  );
  assert.equal(
    filterAndSortProducts(sampleProducts, { ...baseFilter, offersOnly: true }).length,
    2
  );
  assert.equal(
    filterAndSortProducts(sampleProducts, { ...baseFilter, availability: 'in-stock' }).length,
    2
  );
  assert.equal(
    filterAndSortProducts(sampleProducts, { ...baseFilter, searchQuery: 'rice' })[0].id,
    'steam-rice-1kg'
  );
  assert.equal(
    filterAndSortProducts(sampleProducts, {
      ...baseFilter,
      attributes: { Weight: ['1 kg'] },
    }).length,
    1
  );
});

test('addOrUpdateCartItem merges identical variants and blocks out-of-stock items', () => {
  const first = addOrUpdateCartItem([], sampleProducts[1], 'v-1kg', 2);
  assert.equal(first.error, undefined);
  assert.equal(first.items.length, 1);
  assert.equal(first.items[0].quantity, 2);

  const second = addOrUpdateCartItem(first.items, sampleProducts[1], 'v-1kg', 3);
  assert.equal(second.items.length, 1);
  assert.equal(second.items[0].quantity, 5);

  const differentVariant = addOrUpdateCartItem(second.items, sampleProducts[1], 'v-5kg', 1);
  assert.equal(differentVariant.items.length, 2);

  const oos = addOrUpdateCartItem(differentVariant.items, sampleProducts[2], 'v-100ml', 1);
  assert.ok(oos.error);
  assert.equal(oos.items.length, 2);
});

test('calculateCartTotals computes subtotal, savings, and free delivery threshold accurately', () => {
  const { items } = addOrUpdateCartItem([], sampleProducts[0], 'v-carton', 1); // 4180 (orig 4560)
  const belowThreshold = calculateCartTotals(items, 'delivery');
  assert.equal(belowThreshold.subtotal, 4180);
  assert.equal(belowThreshold.totalSavings, 380);
  assert.equal(belowThreshold.deliveryFee, 250);
  assert.equal(belowThreshold.amountToFreeDelivery, 820);
  assert.equal(belowThreshold.finalTotal, 4430);

  const updated = updateCartItemQuantity(items, 'olpers-1l', 'v-carton', 2); // 8360
  const aboveThreshold = calculateCartTotals(updated, 'delivery');
  assert.equal(aboveThreshold.deliveryFee, 0);
  assert.equal(aboveThreshold.finalTotal, 8360);

  const pickup = calculateCartTotals(items, 'pickup');
  assert.equal(pickup.deliveryFee, 0);
});

test('form validators catch missing required fields cleanly', () => {
  const checkoutErrs = validateCheckoutForm({
    fullName: '',
    phone: '123',
    email: 'bad',
    branchId: 'hyderabad',
    fulfillmentMethod: 'delivery',
    address: '',
    city: '',
    deliveryNotes: '',
    paymentMethod: 'cod',
  });
  assert.ok(checkoutErrs.fullName);
  assert.ok(checkoutErrs.phone);
  assert.ok(checkoutErrs.email);
  assert.ok(checkoutErrs.address);

  const resErrs = validateReservationForm({
    branchId: 'hyderabad',
    date: '',
    time: '',
    partySize: 0,
    customerName: '',
    contactNumber: '',
    seatingPreference: 'Family Hall',
    specialRequests: '',
  });
  assert.ok(resErrs.date);
  assert.ok(resErrs.partySize);
  assert.ok(resErrs.customerName);

  const playErrs = validatePlayLandInquiry({
    inquiryType: 'General Visit',
    branchId: 'hyderabad',
    childrenCount: 0,
    ageGroups: [],
    adultsCount: 0,
    preferredDate: '',
    packageId: '',
    parentName: '',
    contactPhone: '',
    specialRequirements: '',
  });
  assert.ok(playErrs.childrenCount);
  assert.ok(playErrs.ageGroups);
  assert.ok(playErrs.adultsCount);
});

test('getRelatedProducts fills up to requested limit without duplicating target', () => {
  const related = getRelatedProducts(sampleProducts, sampleProducts[0], 4);
  assert.ok(!related.some((p) => p.id === sampleProducts[0].id));
  assert.equal(related.length, 1); // only 1 other in-stock item in sampleProducts
  assert.equal(related[0].id, 'steam-rice-1kg');
});

test('About Marhaba corporate records preserve milestones, creeds, directors, and portrait authenticity', async () => {
  const {
    ABOUT_MILESTONES,
    ABOUT_TRUST_CREEDS,
    BOARD_OF_DIRECTORS,
    BUSINESS_ECOSYSTEM_PILLARS,
    CORPORATE_WORKFORCE,
    VERIFIED_BRANCHES,
  } = await import('../data/marhabaData');

  assert.deepEqual(
    ABOUT_MILESTONES.map((m) => m.year),
    ['1998', '2015', '2018', '2021']
  );
  assert.equal(ABOUT_TRUST_CREEDS.length, 3);
  assert.equal(BOARD_OF_DIRECTORS.length, 5);
  assert.equal(
    BOARD_OF_DIRECTORS.every((d) => d.portraitUrl === undefined),
    true
  );
  assert.equal(CORPORATE_WORKFORCE.reportedHeadcount, 145);
  assert.match(CORPORATE_WORKFORCE.statusLabel, /subject to confirmation/i);
  assert.equal(BUSINESS_ECOSYSTEM_PILLARS.length, 3);
  assert.ok(VERIFIED_BRANCHES.some((b) => b.city === 'Karachi'));
  assert.ok(VERIFIED_BRANCHES.some((b) => b.city === 'Hyderabad'));
});

test('account validators catch invalid address, profile, and password inputs cleanly', () => {
  const addrErrs = validateAddressForm({
    label: '',
    recipientName: 'A',
    phone: '123',
    streetAddress: '123',
    city: '',
  });
  assert.ok(addrErrs.label);
  assert.ok(addrErrs.recipientName);
  assert.ok(addrErrs.phone);
  assert.ok(addrErrs.streetAddress);
  assert.ok(addrErrs.city);

  const validAddrErrs = validateAddressForm({
    label: 'Home',
    recipientName: 'Nadia Siddiqui',
    phone: '03001234567',
    streetAddress: 'Block 4, Qasim Chowk',
    city: 'Hyderabad',
  });
  assert.deepEqual(validAddrErrs, {});

  const profErrs = validateProfileForm({
    fullName: '',
    email: 'invalid-email',
    phone: '123',
    preferredBranchId: 'hyderabad',
    orderUpdates: true,
    weeklyOffers: false,
  });
  assert.ok(profErrs.fullName);
  assert.ok(profErrs.email);
  assert.ok(profErrs.phone);

  const pwErrs = validatePasswordChange('', 'short', 'mismatch');
  assert.ok(pwErrs.currentPassword);
  assert.ok(pwErrs.newPassword);
  assert.ok(pwErrs.confirmPassword);
});



