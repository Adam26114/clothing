import { authTables } from '@convex-dev/auth/server';
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

const measurementSchema = v.object({
  shoulder: v.number(),
  chest: v.number(),
  sleeve: v.number(),
  waist: v.number(),
  length: v.number(),
});

const colorVariantSchema = v.object({
  id: v.string(),
  colorName: v.string(),
  colorHex: v.string(),
  images: v.array(v.id('_storage')),
  selectedSizes: v.array(v.string()),
  stock: v.record(v.string(), v.number()),
  measurements: v.optional(v.record(v.string(), measurementSchema)),
});

export default defineSchema({
  ...authTables,

  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    image: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    role: v.union(v.literal('customer'), v.literal('admin'), v.literal('super-admin')),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index('by_email', ['email'])
    .index('by_phone', ['phone']),

  categories: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    parentId: v.optional(v.id('categories')),
    sortOrder: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_slug', ['slug'])
    .index('by_parent', ['parentId'])
    .index('by_active', ['isActive']),

  products: defineTable({
    sku: v.optional(v.string()),
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    categoryId: v.id('categories'),
    basePrice: v.optional(v.number()),
    salePrice: v.optional(v.number()),
    isFeatured: v.boolean(),
    isPublished: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
    colorVariants: v.array(colorVariantSchema),
  })
    .index('by_slug', ['slug'])
    .index('by_sku', ['sku'])
    .index('by_category', ['categoryId'])
    .index('by_featured', ['isFeatured'])
    .index('by_active', ['isPublished']),

  cartItems: defineTable({
    userId: v.id('users'),
    productId: v.id('products'),
    colorVariantId: v.string(),
    size: v.string(),
    quantity: v.number(),
    addedAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_product_variant', ['userId', 'productId', 'colorVariantId', 'size']),

  wishlistItems: defineTable({
    userId: v.id('users'),
    productId: v.id('products'),
    colorVariantId: v.optional(v.string()),
    size: v.optional(v.string()),
    addedAt: v.number(),
  }).index('by_user', ['userId']),

  orders: defineTable({
    orderNumber: v.string(),
    customerId: v.optional(v.id('users')),
    customerInfo: v.object({
      name: v.string(),
      email: v.string(),
      phone: v.string(),
      address: v.string(),
    }),
    items: v.array(
      v.object({
        productId: v.id('products'),
        colorVariantId: v.string(),
        name: v.string(),
        size: v.string(),
        color: v.string(),
        colorHex: v.string(),
        quantity: v.number(),
        price: v.number(),
      })
    ),
    subtotal: v.number(),
    shippingFee: v.number(),
    total: v.number(),
    deliveryMethod: v.union(v.literal('shipping'), v.literal('pickup')),
    paymentMethod: v.literal('cod'),
    status: v.union(
      v.literal('pending'),
      v.literal('confirmed'),
      v.literal('processing'),
      v.literal('shipped'),
      v.literal('delivered'),
      v.literal('cancelled')
    ),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_orderNumber', ['orderNumber'])
    .index('by_customer', ['customerId'])
    .index('by_status', ['status'])
    .index('by_createdAt', ['createdAt']),

  storeSettings: defineTable({
    heroTitle: v.optional(v.string()),
    heroSubtitle: v.optional(v.string()),
    heroImageId: v.optional(v.id('_storage')),
    heroCtaLabel: v.optional(v.string()),
    heroCtaLink: v.optional(v.string()),
    saleBannerEnabled: v.boolean(),
    saleBannerText: v.optional(v.string()),
    saleBannerLink: v.optional(v.string()),
    announcementBar: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    socialInstagram: v.optional(v.string()),
    socialFacebook: v.optional(v.string()),
    socialTiktok: v.optional(v.string()),
    pickupStoreName: v.optional(v.string()),
    pickupStoreAddress: v.optional(v.string()),
    pickupStoreHours: v.optional(v.string()),
    updatedAt: v.number(),
  }),
});
