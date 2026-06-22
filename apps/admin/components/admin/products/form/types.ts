import type { Id } from '@workspace/convex/_generated/dataModel';
import { SIZE_OPTIONS } from '@workspace/lib/constants';

export interface Measurements {
  shoulder: number;
  chest: number;
  sleeve: number;
  waist: number;
  length: number;
}

export interface ColorVariantForm {
  id: string;
  colorName: string;
  colorHex: string;
  images: Id<'_storage'>[];
  selectedSizes: string[];
  stock: Record<string, number>;
  measurements?: Record<string, Measurements>;
}

export interface ProductFormState {
  sku: string;
  name: string;
  slug: string;
  description: string;
  categoryId: Id<'categories'> | null;
  basePrice: string;
  salePrice: string;
  isFeatured: boolean;
  isPublished: boolean;
  colorVariants: ColorVariantForm[];
}

export function createEmptyProductFormState(): ProductFormState {
  return {
    sku: '',
    name: '',
    slug: '',
    description: '',
    categoryId: null,
    basePrice: '',
    salePrice: '',
    isFeatured: false,
    isPublished: true,
    colorVariants: [createEmptyColorVariant()],
  };
}

export function createEmptyColorVariant(): ColorVariantForm {
  return {
    id: `variant-${crypto.randomUUID().slice(0, 8)}`,
    colorName: '',
    colorHex: '#FFFFFF',
    images: [],
    selectedSizes: [...SIZE_OPTIONS],
    stock: {},
    measurements: undefined,
  };
}

export function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}
