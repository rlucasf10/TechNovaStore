import { User, UserConsent, AccountDeletionRequest } from './models.test';
import { connectTestDatabase, closeTestDatabase } from '../config/database.test';
import bcrypt from 'bcrypt';

describe('GDPR Compliance', () => {
    let testUser: any;

    beforeAll(async () => {
        // Setup test database
        await connectTestDatabase();
    });

    beforeEach(async () => {
        // Create test user
        const password_hash = await bcrypt.hash('TestPassword123!', 12);
        testUser = await User.create({
            email: 'test@example.com',
            password_hash,
            first_name: 'Test',
            last_name: 'User',
            role: 'customer',
            is_active: true,
            email_verified: true,
        });
    });

    afterEach(async () => {
        // Clean up test data
        await AccountDeletionRequest.destroy({ where: {} });
        await UserConsent.destroy({ where: {} });
        await User.destroy({ where: {} });
    });

    afterAll(async () => {
        await closeTestDatabase();
    });

    describe('Cookie Consent Management', () => {
        it('should create user consent record', async () => {
            const consentData = {
                necessary_cookies: true,
                analytics_cookies: true,
                marketing_cookies: false,
                data_processing: true,
                email_marketing: false,
                third_party_sharing: false,
            };

            const consent = await UserConsent.create({
                user_id: testUser.id,
                consent_data: consentData,
                ip_address: '127.0.0.1',
                user_agent: 'Test Agent',
            });

            expect(consent).toBeDefined();
            expect((consent as any).user_id).toBe(testUser.id);
            expect((consent as any).consent_data).toMatchObject(consentData);
        });

        it('should retrieve user consent status', async () => {
            const consentData = {
                necessary_cookies: true,
                analytics_cookies: true,
                marketing_cookies: false,
                data_processing: true,
                email_marketing: false,
                third_party_sharing: false,
            };

            // Create consent
            await UserConsent.create({
                user_id: testUser.id,
                consent_data: consentData,
                ip_address: '127.0.0.1',
                user_agent: 'Test Agent',
            });

            // Retrieve consent
            const latestConsent = await UserConsent.findOne({
                where: { user_id: testUser.id },
                order: [['created_at', 'DESC']],
            });

            expect(latestConsent).toBeDefined();
            expect((latestConsent as any)?.consent_data).toMatchObject(consentData);
        });
    });

    describe('Data Export', () => {
        it('should collect user personal data', async () => {
            // Create some consent history
            await UserConsent.create({
                user_id: testUser.id,
                consent_data: {
                    necessary_cookies: true,
                    analytics_cookies: false,
                    marketing_cookies: false,
                    data_processing: true,
                    email_marketing: false,
                    third_party_sharing: false,
                },
                ip_address: '127.0.0.1',
            });

            // Get user data
            const user = await User.findByPk(testUser.id);
            const consentHistory = await UserConsent.findAll({
                where: { user_id: testUser.id },
            });

            expect(user).toBeDefined();
            expect((user as any)?.email).toBe('test@example.com');
            expect((user as any)?.first_name).toBe('Test');
            expect((user as any)?.last_name).toBe('User');
            expect(consentHistory).toHaveLength(1);
        });

        it('should include user profile data', async () => {
            const user = await User.findByPk(testUser.id);

            expect((user as any)?.email).toBe('test@example.com');
            expect((user as any)?.first_name).toBe('Test');
            expect((user as any)?.last_name).toBe('User');
            expect((user as any)?.role).toBe('customer');
        });
    });

    describe('Account Deletion', () => {
        it('should create account deletion request', async () => {
            const scheduledDeletionDate = new Date();
            scheduledDeletionDate.setDate(scheduledDeletionDate.getDate() + 30);

            const deletionRequest = await AccountDeletionRequest.create({
                user_id: testUser.id,
                reason: 'No longer need the service',
                status: 'pending',
                scheduled_deletion_date: scheduledDeletionDate,
            });

            expect(deletionRequest).toBeDefined();
            expect((deletionRequest as any).user_id).toBe(testUser.id);
            expect((deletionRequest as any).status).toBe('pending');
            expect((deletionRequest as any).reason).toBe('No longer need the service');
        });

        it('should validate deletion request status', async () => {
            const deletionRequest = await AccountDeletionRequest.create({
                user_id: testUser.id,
                reason: 'Test deletion',
                status: 'pending',
                scheduled_deletion_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            });

            expect((deletionRequest as any).status).toBe('pending');

            // Update status to cancelled
            await deletionRequest.update({ status: 'cancelled' });
            expect((deletionRequest as any).status).toBe('cancelled');
        });

        it('should handle multiple deletion requests for same user', async () => {
            // Create first request
            await AccountDeletionRequest.create({
                user_id: testUser.id,
                reason: 'First request',
                status: 'cancelled',
                scheduled_deletion_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            });

            // Create second request
            await AccountDeletionRequest.create({
                user_id: testUser.id,
                reason: 'Second request',
                status: 'pending',
                scheduled_deletion_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            });

            const requests = await AccountDeletionRequest.findAll({
                where: { user_id: testUser.id },
            });

            expect(requests).toHaveLength(2);
        });
    });

    describe('Data Validation', () => {
        it('should validate consent data structure', async () => {
            const validConsentData = {
                necessary_cookies: true,
                analytics_cookies: false,
                marketing_cookies: false,
                data_processing: true,
                email_marketing: false,
                third_party_sharing: false,
            };

            const consent = await UserConsent.create({
                user_id: testUser.id,
                consent_data: validConsentData,
            });

            expect((consent as any).consent_data).toMatchObject(validConsentData);
            expect(typeof (consent as any).consent_data.necessary_cookies).toBe('boolean');
            expect(typeof (consent as any).consent_data.analytics_cookies).toBe('boolean');
        });

        it('should handle user data anonymization', async () => {
            // Update user with anonymized data
            await testUser.update({
                email: `anonymized_${testUser.id}@deleted.local`,
                first_name: 'Anonymized',
                last_name: 'User',
                phone: undefined,
                address: undefined,
                is_active: false,
            });

            const updatedUser = await User.findByPk(testUser.id);
            expect((updatedUser as any)?.email).toBe(`anonymized_${testUser.id}@deleted.local`);
            expect((updatedUser as any)?.first_name).toBe('Anonymized');
            expect((updatedUser as any)?.is_active).toBe(false);
        });
    });
});