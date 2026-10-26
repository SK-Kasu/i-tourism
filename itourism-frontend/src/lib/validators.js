import { z } from "zod";

// Accepts 0712345678, 712345678, +254712345678, 254712345678
const phoneSchema = z
  .string()
  .trim()
  .regex(/^(?:\+?254|0)?[17]\d{8}$/, "Enter a valid Kenyan phone number");

export const loginSchema = z.object({
  phoneNumber: phoneSchema,
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name"),
    phoneNumber: phoneSchema,
    email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
    password: z.string().min(8, "Use at least 8 characters"),
    confirmPassword: z.string(),
    role: z.enum(["TRAVELER", "OWNER"]),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const propertySchema = z.object({
  name: z.string().trim().min(3, "Enter the property name"),
  region: z.string().min(1, "Choose a region"),
  county: z.string().min(1, "Choose a county"),
});

export const roomSchema = z.object({
  name: z.string().trim().min(2, "Enter a room name, for example Standard double"),
  pricePerNight: z.coerce
    .number({ invalid_type_error: "Enter a price" })
    .int("Use a whole number")
    .min(100, "Minimum is KES 100")
    .max(500000, "Maximum is KES 500,000"),
  maxOccupancy: z.coerce
    .number({ invalid_type_error: "Enter the number of guests" })
    .int("Use a whole number")
    .min(1, "At least 1 guest")
    .max(20, "At most 20 guests"),
  amenities: z.array(z.string()).default([]),
});
