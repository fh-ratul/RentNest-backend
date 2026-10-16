import { z } from "zod";

const registerSchema = z.object({
  body: z.object({
    name: z.string({ message: "Name is required" }).min(2, "Name must be at least 2 characters").max(255),
    email: z.string({ message: "Email is required" }).email("Invalid email address"),
    password: z.string({ message: "Password is required" }).min(6, "Password must be at least 6 characters"),
    role: z.enum(["TENANT", "LANDLORD"], { message: "Role must be either TENANT or LANDLORD" }),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string({ message: "Email is required" }).email("Invalid email address"),
    password: z.string({ message: "Password is required" }),
  }),
});

const verifyEmailSchema = z.object({
  body: z.object({
    email: z.string({ message: "Email is required" }).email("Invalid email address"),
    otp: z.string({ message: "OTP is required" }).regex(/^\d{6}$/, "OTP must be a 6 digit code"),
  }),
});

const resendOtpSchema = z.object({
  body: z.object({
    email: z.string({ message: "Email is required" }).email("Invalid email address"),
  }),
});

// The ID token (credential) that Google Sign-In hands to the frontend.
const googleLoginSchema = z.object({
  body: z.object({
    idToken: z.string({ message: "Google ID token is required" }).min(1, "Google ID token is required"),
    role: z.enum(["TENANT", "LANDLORD"], { message: "Role must be either TENANT or LANDLORD" }).optional(),
  }),
});

export const authValidation = {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendOtpSchema,
  googleLoginSchema,
};
