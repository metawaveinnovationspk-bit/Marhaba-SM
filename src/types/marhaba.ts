export type DataTier = 'verified' | 'demonstration' | 'proposed';

export type AppRoute =
  | 'home'
  | 'shop'
  | 'product'
  | 'restaurant'
  | 'playland'
  | 'offers'
  | 'locations'
  | 'about'
  | 'contact'
  | 'wishlist'
  | 'account'
  | 'checkout';

export type RestaurantSection =
  | 'overview'
  | 'menu'
  | 'cuisines'
  | 'offers'
  | 'dining'
  | 'gallery'
  | 'reservations';

export type PlayLandSection =
  | 'overview'
  | 'attractions'
  | 'ages'
  | 'packages'
  | 'birthdays'
  | 'parents-guide'
  | 'plan-visit';

export interface BranchInfo {
  id: string;
  name: string;
  shortName: string;
  city: string;
  address: string;
  hours: string;
  phones: string[];
  restaurantPhones?: string[];
  email: string;
  facilities: ('Supermarket' | 'Restaurant' | 'Play Land')[];
  isFlagship?: boolean;
  dataTier: DataTier;
}

export interface DepartmentAttributeFilter {
  key: string;
  label: string;
  options: string[];
}

export interface DepartmentTaxonomy {
  id: string;
  name: string;
  shortDescription: string;
  featuredCollection: string;
  featuredBannerImage: string;
  subcategories: string[];
  attributeFilters: DepartmentAttributeFilter[];
}

export interface ProductVariant {
  id: string;
  label: string;
  sku: string;
  price: number;
  originalPrice?: number;
  inStock: boolean;
  stockCount?: number;
}

export type PackshotStyle =
  | 'carton'
  | 'pouch'
  | 'bottle'
  | 'jar'
  | 'bag'
  | 'box'
  | 'produce'
  | 'bakery'
  | 'cosmetic'
  | 'appliance'
  | 'apparel'
  | 'stationery'
  | 'pet';

export interface Product {
  id: string;
  sku: string;
  name: string;
  brand: string;
  departmentId: string;
  subcategory: string;
  price: number;
  originalPrice?: number;
  unitLabel: string;
  inStock: boolean;
  stockNote?: string;
  variants: ProductVariant[];
  image?: string;
  packshotStyle: PackshotStyle;
  packshotAccent: string;
  description: string;
  specifications: { label: string; value: string }[];
  ingredients?: string;
  storageUsage?: string;
  attributes: Record<string, string>;
  featured?: boolean;
  dataTier: DataTier;
}

export type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'discount' | 'name-asc';

export interface ShopFilterState {
  departmentId: string | null;
  subcategory: string | null;
  brands: string[];
  minPrice: number | null;
  maxPrice: number | null;
  availability: 'all' | 'in-stock' | 'out-of-stock';
  offersOnly: boolean;
  attributes: Record<string, string[]>;
  searchQuery: string;
  sortBy: SortOption;
}

export interface CartItem {
  productId: string;
  variantId: string;
  name: string;
  brand: string;
  variantLabel: string;
  unitPrice: number;
  originalPrice?: number;
  quantity: number;
  image?: string;
  packshotStyle: PackshotStyle;
  packshotAccent: string;
}

export interface CartTotals {
  itemCount: number;
  subtotal: number;
  totalSavings: number;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  amountToFreeDelivery: number;
  finalTotal: number;
}

export interface CheckoutFormData {
  fullName: string;
  phone: string;
  email: string;
  branchId: string;
  fulfillmentMethod: 'delivery' | 'pickup';
  address: string;
  city: string;
  deliveryNotes: string;
  paymentMethod: 'cod' | 'card-counter';
}

export interface SimulatedOrder {
  orderNumber: string;
  createdAt: string;
  items: CartItem[];
  totals: CartTotals;
  customer: CheckoutFormData;
  status: string;
}

export type CuisineType = 'Pakistani' | 'Chinese' | 'Italian' | 'Turkish' | 'Beverages & Desserts';

export interface DishItem {
  id: string;
  name: string;
  cuisine: CuisineType;
  category: string;
  description: string;
  portionSize: string;
  price?: number;
  variations?: string[];
  ingredients?: string[];
  dietaryTags?: string[];
  available: boolean;
  image?: string;
  featured?: boolean;
  dataTier: DataTier;
}

export interface RestaurantDeal {
  id: string;
  title: string;
  includedItems: string[];
  servings: string;
  originalPrice?: number;
  offerPrice: number;
  terms: string;
  validity: string;
  available: boolean;
  dataTier: DataTier;
}

export interface GalleryPhoto {
  id: string;
  title: string;
  caption: string;
  category: 'Food' | 'Dining' | 'Ambiance' | 'Play Land';
  image: string;
  dataTier: DataTier;
}

export interface ReservationFormData {
  branchId: string;
  date: string;
  time: string;
  partySize: number;
  customerName: string;
  contactNumber: string;
  seatingPreference: 'Family Hall' | 'Rooftop Dining' | 'No Preference';
  specialRequests: string;
}

export interface ReservationSubmission {
  referenceId: string;
  submittedAt: string;
  data: ReservationFormData;
  status: 'Pending Staff Confirmation';
}

export type AgeSuitabilityGroup =
  | 'Little Explorers (1–3 yrs)'
  | 'Young Adventurers (4–7 yrs)'
  | 'Juniors (8–12 yrs)'
  | 'Family Activities';

export interface PlayAttraction {
  id: string;
  name: string;
  category: 'Soft Play' | 'Rides' | 'Climbing & Slides' | 'Arcade & Interactive';
  ageGroup: AgeSuitabilityGroup;
  ageRangeLabel: string;
  heightRequirement: string;
  supervisionRule: string;
  sessionDuration: string;
  packageEligibility: string[];
  capacityNote: string;
  availability: 'Available Daily' | 'Weekend Peak' | 'Seasonal Maintenance';
  description: string;
  safetyGuidelines: string[];
  image?: string;
  dataTier: DataTier;
}

export interface PlayPackage {
  id: string;
  name: string;
  price: number;
  participants: string;
  duration: string;
  includedAttractions: string[];
  exclusions: string[];
  terms: string;
  isBirthday?: boolean;
  dataTier: DataTier;
}

export interface PlayLandInquiryData {
  inquiryType: 'General Visit' | 'Birthday Celebration' | 'School / Group Visit';
  branchId: string;
  childrenCount: number;
  ageGroups: AgeSuitabilityGroup[];
  adultsCount: number;
  preferredDate: string;
  packageId: string;
  parentName: string;
  contactPhone: string;
  specialRequirements: string;
}

export interface PlayLandInquirySubmission {
  referenceId: string;
  submittedAt: string;
  data: PlayLandInquiryData;
  status: 'Inquiry Received — Awaiting Play Land Desk Confirmation';
}

export interface CorporateMilestone {
  id: string;
  year: string;
  location: string;
  headline: string;
  summary: string;
  highlights: string[];
  dataTier: DataTier;
}

export interface TrustCreed {
  id: string;
  index: string;
  title: string;
  creedStatement: string;
  elaboration: string;
}

export interface BoardDirector {
  id: string;
  name: string;
  role: string;
  initials: string;
  isLead?: boolean;
  stewardshipNote: string;
  portraitUrl?: string;
}

export interface BusinessEcosystemPillar {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  imageAlt: string;
  ctaLabel: string;
  targetRoute: 'shop' | 'restaurant' | 'playland';
}

export type AccountSection =
  | 'overview'
  | 'orders'
  | 'wishlist'
  | 'addresses'
  | 'profile'
  | 'bookings'
  | 'support';

export interface AccountProfile {
  fullName: string;
  email: string;
  phone: string;
  preferredBranchId: string;
  orderUpdates: boolean;
  weeklyOffers: boolean;
}

export interface SavedAddress {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  streetAddress: string;
  city: string;
  notes?: string;
  isDefault: boolean;
}


