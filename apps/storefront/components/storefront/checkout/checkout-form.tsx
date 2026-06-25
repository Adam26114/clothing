'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from 'convex/react';
import { ConvexError } from 'convex/values';
import { toast } from 'sonner';
import { Id } from '@workspace/convex/_generated/dataModel';
import { api } from '@workspace/convex/_generated/api';

import { Textarea } from '@workspace/ui/components/textarea';
import { Label } from '@workspace/ui/components/label';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { useCartItems, type UnifiedCartItem } from '@workspace/lib/cart/merge';
import { t } from '@workspace/lib/i18n';
import { cn } from '@workspace/lib/cn';

import { checkoutFormSchema, checkoutFormDefaults, type CheckoutFormValues } from './schema';
import { ContactFields } from './contact-fields';
import { DeliveryAddressFields } from './delivery-address-fields';
import { DeliveryMethodRadio } from './delivery-method-radio';
import { PickupInfoCard } from './pickup-info-card';
import { PaymentCallout } from './payment-callout';
import { PlaceOrderButton } from './place-order-button';

interface CheckoutFormProps {
  className?: string;
}

export function CheckoutForm({ className }: CheckoutFormProps) {
  const router = useRouter();
  const { items, remove } = useCartItems();
  const formRef = useRef<HTMLFormElement | null>(null);

  const settings = useQuery(api.storeSettings.get, {});
  const createOrder = useMutation(api.orders.create);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: checkoutFormDefaults,
    mode: 'onBlur',
  });

  // React Hook Form's `watch()` returns a non-memoizable subscription per its
  // public API; the alternative (useWatch with field) has the same compiler
  // profile. RHF intentionally couples form state to its internal store.
  const deliveryMethod = watch('deliveryMethod');

  useEffect(() => {
    if (typeof window === 'undefined' || !formRef.current) {
      return;
    }
    if (Object.keys(errors).length > 0) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [errors]);

  const onSubmit = handleSubmit(async (values) => {
    if (items.length === 0) {
      toast.error(t('cart.empty'));
      router.push('/cart');
      return;
    }

    const itemsPayload = items.map((item: UnifiedCartItem) => ({
      productId: item.productId as Id<'products'>,
      colorVariantId: item.colorVariantId,
      size: item.size,
      quantity: item.quantity,
    }));

    const address = values.deliveryMethod === 'shipping' ? (values.address?.trim() ?? '') : '';

    try {
      const result = await createOrder({
        customerInfo: {
          name: values.name.trim(),
          email: values.email.trim(),
          phone: values.phone.trim(),
          address,
        },
        items: itemsPayload,
        deliveryMethod: values.deliveryMethod,
        notes: values.notes?.trim() ? values.notes.trim() : undefined,
      });

      for (const item of items) {
        await remove({
          productId: item.productId,
          colorVariantId: item.colorVariantId,
          size: item.size,
          quantity: item.quantity,
          _id: item._id,
        });
      }

      router.push(`/order-confirmation/${result.orderId}`);
    } catch (err: unknown) {
      handleOrderError(err, items, remove);
    }
  });

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      noValidate
      className={cn('flex flex-col gap-6', className)}
    >
      <ContactFields register={register} errors={errors} />

      <fieldset className="flex flex-col gap-4">
        <legend className="text-base font-semibold">{t('checkout.deliveryHeading')}</legend>
        <DeliveryMethodRadio control={control} errors={errors} />
        {deliveryMethod === 'shipping' ? (
          <DeliveryAddressFields register={register} errors={errors} />
        ) : (
          <PickupInfoCard
            storeName={settings?.pickupStoreName ?? null}
            storeAddress={settings?.pickupStoreAddress ?? null}
            storeHours={settings?.pickupStoreHours ?? null}
          />
        )}
      </fieldset>

      <Card size="sm">
        <CardHeader>
          <CardTitle>{t('checkout.notesHeading')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="checkout-notes" className="sr-only">
              {t('checkout.notesHeading')}
            </Label>
            <Textarea
              id="checkout-notes"
              rows={3}
              placeholder={t('checkout.notesPlaceholder')}
              {...register('notes')}
            />
          </div>
        </CardContent>
      </Card>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-base font-semibold">{t('checkout.paymentHeading')}</legend>
        <PaymentCallout />
      </fieldset>

      <PlaceOrderButton isSubmitting={isSubmitting} disabled={items.length === 0} />
    </form>
  );
}

function isConvexStringError(err: unknown): err is ConvexError<string> {
  return err instanceof ConvexError;
}

function handleOrderError(
  err: unknown,
  items: UnifiedCartItem[],
  remove: (args: {
    productId: string;
    colorVariantId: string;
    size: string;
    quantity: number;
    _id?: string;
  }) => Promise<unknown> | void
): void {
  if (isConvexStringError(err)) {
    const message = err.data;
    const isStockError = /out of stock|unavailable|not available/i.test(message);
    if (isStockError) {
      toast.error(t('checkout.errorStock'));
      toast.info(t('checkout.errorStockToast'));
      void Promise.all(
        items.map((item) =>
          Promise.resolve(
            remove({
              productId: item.productId,
              colorVariantId: item.colorVariantId,
              size: item.size,
              quantity: item.quantity,
              _id: item._id,
            })
          )
        )
      );
    } else {
      toast.error(message);
    }
    return;
  }

  if (err instanceof Error) {
    toast.error(err.message);
    return;
  }

  toast.error(t('checkout.errorGeneric'));
}
