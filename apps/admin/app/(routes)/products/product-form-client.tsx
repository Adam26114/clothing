'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { ArrowLeftIcon, CheckIcon, XIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { Doc, Id } from '@workspace/convex/_generated/dataModel';
import { api } from '@workspace/convex/_generated/api';

import { Button } from '@workspace/ui/components/button';
import { AdminPageHeader } from '@workspace/ui/components/admin/page-header';
import { Card, CardContent } from '@workspace/ui/components/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@workspace/ui/components/alert-dialog';
import { t } from '@workspace/lib/i18n';

import { DetailsTab } from '@/components/admin/products/form/details-tab';
import { VariantsTab } from '@/components/admin/products/form/variants-tab';
import {
  createEmptyProductFormState,
  createEmptyColorVariant,
  slugifyName,
  type ColorVariantForm,
  type ProductFormState,
} from '@/components/admin/products/form/types';

interface ProductFormClientProps {
  mode: 'create' | 'edit';
  productId?: string;
}

export function ProductFormClient({ mode, productId }: ProductFormClientProps) {
  const router = useRouter();
  const isEdit = mode === 'edit';
  const typedId = isEdit && productId ? (productId as Id<'products'>) : null;

  const productQuery = useQuery(api.products.adminGetById, typedId ? { id: typedId } : 'skip');

  const create = useMutation(api.products.create);
  const update = useMutation(api.products.update);

  const [state, setState] = React.useState<ProductFormState>(createEmptyProductFormState);
  const [initialState, setInitialState] = React.useState<ProductFormState>(
    createEmptyProductFormState
  );
  const [slugValid, setSlugValid] = React.useState(false);
  const [tab, setTab] = React.useState<'details' | 'variants'>('details');
  const [pending, setPending] = React.useState(false);
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [autoSlugUserEdited, setAutoSlugUserEdited] = React.useState(false);
  const [lastAutoSlug, setLastAutoSlug] = React.useState('');
  const [hasHydrated, setHasHydrated] = React.useState(!isEdit);

  React.useEffect(() => {
    if (isEdit && productQuery && !hasHydrated) {
      const next = productToFormState(productQuery);
      // one-time hydration from Convex query
      setState(next);
      setInitialState(next);
      setSlugValid(true);
      setAutoSlugUserEdited(true);
      setHasHydrated(true);
    }
  }, [isEdit, productQuery, hasHydrated]);

  const handleNameChange = React.useCallback(
    (name: string) => {
      setState((prev) => {
        const next: ProductFormState = { ...prev, name };
        if (!autoSlugUserEdited) {
          const auto = slugifyName(name);
          if (prev.slug === '' || prev.slug === lastAutoSlug) {
            next.slug = auto;
            setLastAutoSlug(auto);
          }
        }
        return next;
      });
    },
    [autoSlugUserEdited, lastAutoSlug]
  );

  const handleSubmit = React.useCallback(async () => {
    if (isEdit && typedId) {
      setPending(true);
      try {
        const variants = state.colorVariants.map(toConvexVariant);
        await update({
          id: typedId,
          sku: state.sku.trim() === '' ? undefined : state.sku.trim(),
          name: state.name.trim(),
          slug: state.slug.trim(),
          description: state.description,
          categoryId: state.categoryId ?? undefined,
          basePrice: parseOptionalNumber(state.basePrice),
          salePrice: parseOptionalNumber(state.salePrice),
          isFeatured: state.isFeatured,
          isPublished: state.isPublished,
          colorVariants: variants,
        });
        toast.success(t('admin.products.success.update'));
        router.push('/products');
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : t('admin.products.error.update');
        toast.error(message);
      } finally {
        setPending(false);
      }
      return;
    }

    if (state.categoryId === null) {
      toast.error(t('admin.products.error.invalidCategory'));
      setTab('details');
      return;
    }
    if (state.colorVariants.length === 0) {
      toast.error(t('admin.products.error.noVariants'));
      setTab('variants');
      return;
    }

    setPending(true);
    try {
      const variants = state.colorVariants.map(toConvexVariant);
      await create({
        sku: state.sku.trim() === '' ? undefined : state.sku.trim(),
        name: state.name.trim(),
        slug: state.slug.trim(),
        description: state.description,
        categoryId: state.categoryId,
        basePrice: parseOptionalNumber(state.basePrice),
        salePrice: parseOptionalNumber(state.salePrice),
        isFeatured: state.isFeatured,
        isPublished: state.isPublished,
        colorVariants: variants,
      });
      toast.success(t('admin.products.success.create'));
      router.push('/products');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('admin.products.error.create');
      toast.error(message);
    } finally {
      setPending(false);
    }
  }, [create, isEdit, router, state, typedId, update]);

  const isDirty = React.useMemo(
    () => JSON.stringify(state) !== JSON.stringify(initialState),
    [state, initialState]
  );

  const variantsValid =
    state.colorVariants.length > 0 &&
    state.colorVariants.every((v) => v.colorName.trim().length > 0);

  const isValid =
    state.name.trim().length > 0 && state.slug.trim().length > 0 && slugValid && variantsValid;

  const canSave = isValid && isDirty && !pending;

  const handleCancelClick = () => {
    if (isDirty) {
      setCancelOpen(true);
      return;
    }
    router.push('/products');
  };

  const handleCancelConfirm = () => {
    setCancelOpen(false);
    router.push('/products');
  };

  if (isEdit && !hasHydrated) {
    return (
      <div className="flex flex-col gap-6" aria-busy>
        <AdminPageHeader title={t('admin.products.editProduct')} />
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground text-sm">{t('admin.common.loading')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="-mb-2">
        <Button
          render={<Link href="/products" />}
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground -ms-2 cursor-pointer"
        >
          <ArrowLeftIcon className="me-1.5 size-4 rtl:rotate-180" aria-hidden />
          {t('admin.products.form.back')}
        </Button>
      </div>
      <AdminPageHeader
        title={isEdit ? t('admin.products.editProduct') : t('admin.products.addProduct')}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancelClick}
              disabled={pending}
              className="cursor-pointer"
            >
              <XIcon className="me-1.5 size-4" aria-hidden />
              {t('admin.products.form.cancel')}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => void handleSubmit()}
              disabled={!canSave}
              className="cursor-pointer"
            >
              <CheckIcon className="me-1.5 size-4" aria-hidden />
              {pending ? t('admin.products.form.saving') : t('admin.products.form.save')}
            </Button>
          </div>
        }
      />

      <Tabs
        value={tab}
        onValueChange={(value) => {
          if (value === 'details' || value === 'variants') {
            setTab(value);
          }
        }}
        className="gap-4"
      >
        <TabsList>
          <TabsTrigger value="details" className="cursor-pointer">
            {t('admin.products.form.tabDetails')}
          </TabsTrigger>
          <TabsTrigger value="variants" className="cursor-pointer">
            {t('admin.products.form.tabVariants')}
            <span className="text-muted-foreground ms-1.5 text-xs">
              ({state.colorVariants.length})
            </span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="details">
          <Card>
            <CardContent className="pt-4">
              <DetailsTab
                state={state}
                onStateChange={setState}
                excludeProductId={typedId}
                onNameChange={handleNameChange}
                onSlugValidityChange={setSlugValid}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="variants">
          <VariantsTab
            variants={state.colorVariants}
            onChange={(next) => setState((prev) => ({ ...prev, colorVariants: next }))}
          />
        </TabsContent>
      </Tabs>

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.products.form.dirtyCancelTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.products.form.dirtyCancelDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer" onClick={() => setCancelOpen(false)}>
              {t('admin.products.form.dirtyCancelCancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(event) => {
                event.preventDefault();
                handleCancelConfirm();
              }}
              className="cursor-pointer"
            >
              {t('admin.products.form.dirtyCancelAction')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function parseOptionalNumber(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return undefined;
  }
  const num = Number(trimmed);
  return Number.isFinite(num) ? num : undefined;
}

function toConvexVariant(variant: ColorVariantForm) {
  return {
    id: variant.id,
    colorName: variant.colorName,
    colorHex: variant.colorHex,
    images: variant.images,
    selectedSizes: variant.selectedSizes,
    stock: variant.stock,
    measurements: variant.measurements,
  };
}

function productToFormState(product: Doc<'products'>): ProductFormState {
  return {
    sku: product.sku ?? '',
    name: product.name,
    slug: product.slug,
    description: product.description,
    categoryId: product.categoryId,
    basePrice: product.basePrice === undefined ? '' : String(product.basePrice),
    salePrice: product.salePrice === undefined ? '' : String(product.salePrice),
    isFeatured: product.isFeatured,
    isPublished: product.isPublished,
    colorVariants:
      product.colorVariants.length > 0
        ? product.colorVariants.map((v) => ({
            id: v.id || createEmptyColorVariant().id,
            colorName: v.colorName,
            colorHex: v.colorHex,
            images: v.images,
            selectedSizes: v.selectedSizes,
            stock: { ...v.stock },
            measurements: v.measurements
              ? Object.fromEntries(Object.entries(v.measurements).map(([k, m]) => [k, { ...m }]))
              : undefined,
          }))
        : [createEmptyColorVariant()],
  };
}

export { slugifyName };
