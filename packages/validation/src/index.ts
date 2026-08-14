import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const otpSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const addressSchema = z.object({
  Name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  street: z.string().min(3, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().optional(),
  pincode: z.string().min(3, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
  phone: z.string().min(7, 'Valid phone number is required'),
});

export const placeOrderSchema = z.object({
  address: addressSchema,
  paymentMethod: z.enum(['COD', 'Razorpay', 'Stripe']),
  agreeToTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to the Terms & Conditions' }),
  }),
});

export const productFormSchema = z.object({
  name: z.string().min(2, 'Product name is required'),
  description: z.string().min(5, 'Description is required'),
  price: z.number().positive('Price must be greater than 0'),
  discount: z.number().min(0).max(100).default(0),
  category: z.string().min(1, 'Category is required'),
  subCategory: z.string().min(1, 'Subcategory is required'),
  sizes: z.array(z.string()).min(1, 'At least one size must be selected'),
  bestseller: z.boolean().default(false),
  inStock: z.boolean().default(true),
  company: z.string().optional(),
});
