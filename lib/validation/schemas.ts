// lib/validation/schemas.ts
import { z } from 'zod';

/**
 * Event Validation Schema
 * Used for creating and updating events
 */
export const eventSchema = z.object({
    title: z.string()
        .min(3, 'Title must be at least 3 characters')
        .max(100, 'Title must be less than 100 characters'),

    description: z.string()
        .min(10, 'Description must be at least 10 characters')
        .max(2000, 'Description must be less than 2000 characters'),

    image: z.string()
        .url('Invalid image URL'),

    date: z.string()
        .refine((date) => !isNaN(Date.parse(date)), 'Invalid date format'),

    time: z.string()
        .min(1, 'Time is required'),

    venue: z.string()
        .min(3, 'Venue must be at least 3 characters')
        .max(200, 'Venue must be less than 200 characters'),

    location: z.string()
        .min(3, 'Location must be at least 3 characters')
        .max(200, 'Location must be less than 200 characters'),

    category: z.string()
        .min(1, 'Category is required'),

    price: z.number()
        .min(0, 'Price must be 0 or greater'),

    discountPrice: z.number()
        .min(0, 'Discount price must be 0 or greater')
        .nullable(),

    capacity: z.number()
        .int('Capacity must be an integer')
        .min(1, 'Capacity must be at least 1'),

    registered: z.number()
        .int('Registered count must be an integer')
        .min(0, 'Registered count cannot be negative')
        .default(0),

    organizerName: z.string()
        .min(2, 'Organizer name must be at least 2 characters')
        .max(100, 'Organizer name must be less than 100 characters'),

    organizerAvatar: z.string()
        .url('Invalid organizer avatar URL'),

    tags: z.array(z.string())
        .min(1, 'At least one tag is required')
        .max(10, 'Maximum 10 tags allowed'),

    isFeatured: z.boolean()
        .default(false),

    isPremium: z.boolean()
        .default(false),

    status: z.enum(['upcoming', 'ongoing', 'completed', 'cancelled'])
        .optional()
        .default('upcoming'),

    isRecurring: z.boolean()
        .optional()
        .default(false),

    recurringPattern: z.enum(['none', 'weekly', 'monthly', 'quarterly'])
        .optional()
        .default('none'),

    parentEventId: z.string()
        .optional(),
});

export type EventInput = z.infer<typeof eventSchema>;

/**
 * Event Registration Schema
 * Used for user registration to events
 */
export const registrationSchema = z.object({
    eventId: z.string()
        .min(1, 'Event ID is required'),

    userId: z.string()
        .min(1, 'User ID is required'),

    userName: z.string()
        .min(2, 'User name must be at least 2 characters')
        .max(100, 'User name must be less than 100 characters'),

    userEmail: z.string()
        .email('Invalid email address'),

    userPhone: z.string()
        .optional(),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;

/**
 * Project Validation Schema
 * Used for creating and updating projects
 */
export const projectSchema = z.object({
    title: z.string()
        .min(3, 'Title must be at least 3 characters')
        .max(100, 'Title must be less than 100 characters'),

    description: z.string()
        .min(10, 'Description must be at least 10 characters')
        .max(2000, 'Description must be less than 2000 characters'),

    image: z.string()
        .url('Invalid image URL'),

    category: z.string()
        .min(1, 'Category is required'),

    status: z.enum(['planning', 'in-progress', 'completed', 'on-hold'])
        .optional()
        .default('planning'),

    progress: z.number()
        .int('Progress must be an integer')
        .min(0, 'Progress must be at least 0')
        .max(100, 'Progress cannot exceed 100'),

    technologies: z.array(z.string())
        .min(1, 'At least one technology is required')
        .max(20, 'Maximum 20 technologies allowed'),

    stars: z.number()
        .int('Stars must be an integer')
        .min(0, 'Stars cannot be negative')
        .default(0),

    forks: z.number()
        .int('Forks must be an integer')
        .min(0, 'Forks cannot be negative')
        .default(0),

    contributors: z.number()
        .int('Contributors must be an integer')
        .min(0, 'Contributors cannot be negative')
        .default(0),

    duration: z.string()
        .min(1, 'Duration is required'),

    isFeatured: z.boolean()
        .default(false),

    demoUrl: z.string()
        .url('Invalid demo URL'),

    repoUrl: z.string()
        .url('Invalid repository URL'),

    teamMembers: z.array(z.string())
        .default([]),

    createdAt: z.string()
        .refine((date) => !isNaN(Date.parse(date)), 'Invalid date format'),
});

export type ProjectInput = z.infer<typeof projectSchema>;

/**
 * Gallery Image Validation Schema
 * Used for uploading gallery images
 */
export const galleryImageSchema = z.object({
    title: z.string()
        .min(3, 'Title must be at least 3 characters')
        .max(100, 'Title must be less than 100 characters'),

    description: z.string()
        .min(10, 'Description must be at least 10 characters')
        .max(500, 'Description must be less than 500 characters'),

    imageUrl: z.string()
        .url('Invalid image URL'),

    category: z.enum(['events', 'workshops', 'hackathons', 'team', 'projects']),

    date: z.string()
        .refine((date) => !isNaN(Date.parse(date)), 'Invalid date format'),

    attendees: z.number()
        .int('Attendees must be an integer')
        .min(0, 'Attendees cannot be negative')
        .default(0),

    uploadedBy: z.string()
        .min(1, 'Uploader ID is required'),

    isApproved: z.boolean()
        .default(false),

    isFeatured: z.boolean()
        .default(false),

    tags: z.array(z.string())
        .max(10, 'Maximum 10 tags allowed')
        .default([]),

    eventId: z.string()
        .optional(),
});

export type GalleryImageInput = z.infer<typeof galleryImageSchema>;

/**
 * Blog Post Validation Schema
 * Used for creating and updating blog posts
 */
export const blogPostSchema = z.object({
    title: z.string()
        .min(5, 'Title must be at least 5 characters')
        .max(150, 'Title must be less than 150 characters'),

    slug: z.string()
        .min(3, 'Slug must be at least 3 characters')
        .max(150, 'Slug must be less than 150 characters')
        .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),

    excerpt: z.string()
        .min(20, 'Excerpt must be at least 20 characters')
        .max(300, 'Excerpt must be less than 300 characters'),

    content: z.string()
        .min(100, 'Content must be at least 100 characters'),

    coverImage: z.string()
        .url('Invalid cover image URL'),

    author: z.string()
        .min(1, 'Author is required'),

    authorAvatar: z.string()
        .url('Invalid author avatar URL')
        .optional(),

    category: z.string()
        .min(1, 'Category is required'),

    tags: z.array(z.string())
        .min(1, 'At least one tag is required')
        .max(10, 'Maximum 10 tags allowed'),

    status: z.enum(['draft', 'published', 'archived'])
        .default('draft'),

    publishedAt: z.string()
        .refine((date) => !isNaN(Date.parse(date)), 'Invalid date format')
        .optional(),

    readTime: z.number()
        .int('Read time must be an integer')
        .min(1, 'Read time must be at least 1 minute')
        .optional(),

    views: z.number()
        .int('Views must be an integer')
        .min(0, 'Views cannot be negative')
        .default(0),

    likes: z.number()
        .int('Likes must be an integer')
        .min(0, 'Likes cannot be negative')
        .default(0),
});

export type BlogPostInput = z.infer<typeof blogPostSchema>;

/**
 * User Profile Update Schema
 * Used for updating user profile information
 */
export const userProfileSchema = z.object({
    name: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must be less than 100 characters'),

    email: z.string()
        .email('Invalid email address')
        .optional(), // Email updates might require verification

    phone: z.string()
        .regex(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/, 'Invalid phone number')
        .optional(),

    bio: z.string()
        .max(500, 'Bio must be less than 500 characters')
        .optional(),
});

export type UserProfileInput = z.infer<typeof userProfileSchema>;

/**
 * Team Member Validation Schema
 * Used for adding/updating team members
 */
export const teamMemberSchema = z.object({
    name: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must be less than 100 characters'),

    role: z.string()
        .min(2, 'Role must be at least 2 characters')
        .max(100, 'Role must be less than 100 characters'),

    avatar: z.string()
        .url('Invalid avatar URL'),

    linkedin: z.string()
        .url('Invalid LinkedIn URL'),

    github: z.string()
        .url('Invalid GitHub URL')
        .optional(),

    bio: z.string()
        .max(500, 'Bio must be less than 500 characters')
        .optional(),

    achievements: z.array(z.string())
        .max(10, 'Maximum 10 achievements allowed')
        .optional(),

    color: z.enum(['primary', 'secondary', 'warning', 'danger', 'success'])
        .default('primary'),

    position: z.number()
        .int('Position must be an integer')
        .min(0, 'Position cannot be negative'),

    isActive: z.boolean()
        .default(true),
});

export type TeamMemberInput = z.infer<typeof teamMemberSchema>;

/**
 * Contact Form Schema
 * Used for contact form submissions
 */
export const contactFormSchema = z.object({
    name: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must be less than 100 characters'),

    email: z.string()
        .email('Invalid email address'),

    subject: z.string()
        .min(5, 'Subject must be at least 5 characters')
        .max(200, 'Subject must be less than 200 characters'),

    message: z.string()
        .min(10, 'Message must be at least 10 characters')
        .max(1000, 'Message must be less than 1000 characters'),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;

/**
 * Login Validation Schema
 * Used for user login
 */
export const loginSchema = z.object({
    email: z.string()
        .email('Invalid email address'),

    password: z.string()
        .min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Register Validation Schema
 * Used for user registration
 */
export const registerSchema = z.object({
    name: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must be less than 100 characters'),

    email: z.string()
        .email('Invalid email address'),

    password: z.string()
        .min(8, 'Password must be at least 8 characters'),

    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

export type RegisterInput = z.infer<typeof registerSchema>;
