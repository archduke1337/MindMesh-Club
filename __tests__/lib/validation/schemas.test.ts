// __tests__/lib/validation/schemas.test.ts
import { describe, it, expect } from '@jest/globals';
import {
    eventSchema,
    registrationSchema,
    projectSchema,
    galleryImageSchema,
    userProfileSchema,
    contactFormSchema
} from '@/lib/validation/schemas';

describe('validationSchemas', () => {
    describe('registrationSchema', () => {
        it('should validate correct registration data', () => {
            const validData = {
                eventId: '123456',
                userId: 'user123',
                userName: 'John Doe',
                userEmail: 'john@example.com',
            };

            const result = registrationSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject missing eventId', () => {
            const invalidData = {
                userId: 'user123',
                userName: 'John Doe',
                userEmail: 'john@example.com',
            };

            const result = registrationSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject invalid email', () => {
            const invalidData = {
                eventId: '123456',
                userId: 'user123',
                userName: 'John Doe',
                userEmail: 'invalid-email',
            };

            const result = registrationSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject short user name', () => {
            const invalidData = {
                eventId: '123456',
                userId: 'user123',
                userName: 'J',
                userEmail: 'john@example.com',
            };

            const result = registrationSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe('userProfileSchema', () => {
        it('should validate correct profile data', () => {
            const validData = {
                name: 'John Doe',
                email: 'john@example.com',
                phone: '+1234567890',
                bio: 'A software developer',
            };

            const result = userProfileSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject invalid phone format', () => {
            const invalidData = {
                name: 'John Doe',
                phone: '123', // Invalid format
            };

            const result = userProfileSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject too long bio', () => {
            const invalidData = {
                name: 'John Doe',
                bio: 'a'.repeat(501), // Over 500 characters
            };

            const result = userProfileSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe('contactFormSchema', () => {
        it('should validate correct contact form data', () => {
            const validData = {
                name: '} Doe',
                email: 'john@example.com',
                subject: 'Inquiry about services',
                message: 'Hello, I would like to know more about your services.',
            };

            const result = contactFormSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject short subject', () => {
            const invalidData = {
                name: 'John Doe',
                email: 'john@example.com',
                subject: 'Hi',
                message: 'Hello, I would like to know more.',
            };

            const result = contactFormSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });
});
