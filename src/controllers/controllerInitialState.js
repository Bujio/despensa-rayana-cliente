export const initialAuthForm = {
  accountType: '',
  name: '',
  legalName: '',
  description: '',
  email: '',
  password: '',
  phone: '',
  street: '',
  codePostal: '',
  city: '',
  country: 'España',
};

export const initialCategoryForm = {
  name: '',
  description: '',
};

export const initialProductForm = {
  name: '',
  sku: '',
  price: '',
  shortDescription: '',
  description: '',
  stock: '0',
  category: '',
  supplierId: '1',
  supplierName: '',
  supplierImages: [],
  images: [],
  status: 'pending_review',
  offerType: 'none',
  offerValue: '',
  offerBundleQuantity: '3',
  offerBundlePayQuantity: '2',
  offerLabel: '',
  offerValidFrom: '',
  offerValidUntil: '',
};

export const initialAdminSearch = {
  users: '',
  products: '',
  categories: '',
  orders: '',
  media: '',
  reviews: '',
  suppliers: '',
};

export const initialSupplierForm = {
  name: '',
  legalName: '',
  phone: '',
  status: '',
  featured: false,
  internalNotes: '',
  rejectionReason: '',
};

export const initialImageForm = {
  productId: '',
  files: [],
  imageUrl: '',
  imageName: '',
};

export const initialHomeComponentForm = {
  type: 'promoBanner',
  title: '',
  subtitle: '',
  body: '',
  imageUrl: '',
  linkUrl: '',
  ctaLabel: '',
  productIds: [],
  itemOneTitle: '',
  itemOneBody: '',
  itemOneImageUrl: '',
  itemOneLinkUrl: '',
  itemTwoTitle: '',
  itemTwoBody: '',
  itemTwoImageUrl: '',
  itemTwoLinkUrl: '',
  itemThreeTitle: '',
  itemThreeBody: '',
  itemThreeImageUrl: '',
  itemThreeLinkUrl: '',
};

export const initialAdminUserForm = {
  name: '',
  email: '',
  phone: '',
  street: '',
  codePostal: '',
  city: '',
  country: '',
  role: 'user',
  password: '',
};

export const initialAccountProfileForm = {
  name: '',
  email: '',
  phone: '',
  street: '',
  codePostal: '',
  city: '',
  country: '',
  password: '',
};

export const initialPaymentForm = {
  accepted: false,
};
