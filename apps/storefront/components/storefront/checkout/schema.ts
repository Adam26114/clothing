import { z } from 'zod';

export const deliveryMethodSchema = z.enum(['shipping', 'pickup'], {
  message: 'Please select a delivery method',
});

export const checkoutFormSchema = z
  .object({
    name: z.string({ message: 'Please enter your name' }).trim().min(1, 'Please enter your name'),
    email: z
      .string({ message: 'Please enter your email' })
      .trim()
      .min(1, 'Please enter your email')
      .email('Please enter a valid email'),
    phone: z
      .string({ message: 'Please enter your phone number' })
      .trim()
      .min(1, 'Please enter your phone number'),
    address: z
      .string({ message: 'Please enter your shipping address' })
      .trim()
      .max(500, 'Address is too long')
      .optional(),
    deliveryMethod: deliveryMethodSchema,
    notes: z.string().trim().max(500, 'Notes must be 500 characters or fewer').optional(),
  })
  .superRefine((data, ctx) => {
    if (data.deliveryMethod === 'shipping') {
      const address = data.address?.trim() ?? '';
      if (address.length === 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['address'],
          message: 'Please enter your shipping address',
        });
      }
    }
  });

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

export const checkoutFormDefaults: CheckoutFormValues = {
  name: '',
  email: '',
  phone: '',
  address: '',
  deliveryMethod: 'shipping',
  notes: '',
};
