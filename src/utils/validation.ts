import { z } from 'zod';

export const subscriptionSchema = z.object({
  name: z.string().min(1, 'Name required').max(100),
  description: z.string().max(500).optional(),
  price: z.number().positive('Price must be > 0'),
  currency: z.string().length(3, 'Invalid currency'),
  billingFrequency: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']),
  category: z.enum(['streaming', 'music', 'productivity', 'gaming', 'fitness', 'news', 'cloud', 'shopping', 'education', 'finance', 'communication', 'other']),
websiteUrl: z
  .string()
  .trim()
  .min(1, 'Website URL is required')
  .url('Enter a valid URL, e.g. https://www.netflix.com')
  .refine(
    value => /^https?:\/\//i.test(value),
    'URL must start with http:// or https://'
  ),  notes: z.string().max(1000).optional(),
  startDate: z.string().min(1),
  renewalDate: z.string().min(1),
});

export const cancelSchema = z.object({
  cancellationDate: z.string().min(1),
  cancellationReason: z.string().max(500).optional(),
});

export type SubscriptionFormData = z.infer<typeof subscriptionSchema>;
export type CancelFormData = z.infer<typeof cancelSchema>;
