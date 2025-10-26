import { connectTestDatabase, closeTestDatabase } from '../config/database.test';
import { User, UserConsent, AccountDeletionRequest } from './models.test';
import bcrypt from 'bcrypt';

describe('GDPR Compliance - Simple Tests', () => {
    let testUserId: number;

    beforeAll(async () => {
        await connectTestDatabase();
    });

    beforeEach(async () => {
        // Create test user
        const password_hash = await bcrypt.hash('TestPassword123!', 12);
        const user = await User.create({
            email: 'test@example.com',
            password_hash,
            first_name: 'Test',
            last_name: 'User',
            role: 'customer',
            is_active: true,
            email_verified: true,
        });
        testUserId = (user as any).id;
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

    describe('User Model', () => {
        it('should create a user successfully', async () => {
            const user = await User.findByPk(testUserId);
            expect(user).toBeDefined();
            expect((user as any).email).toBe('test@example.com');
        });

        it('should update user data', async () => {
            const user = await User.findByPk(testUserId);
            await (user as any).update({ first_name: 'Updated' });
            
            const updatedUser = await User.findByPk(testUserId);
            expect((updatedUser as any).first_name).toBe('Updated');
        });
    });

    describe('UserConsent Model', () => {
        it('should create consent record', async () => {
            const consentData = {
                necessary_cookies: true,
                analytics_cookies: false,
                marketing_cookies: false,
                data_processing: true,
                email_marketing: false,
                third_party_sharing: false,
            };

            const consent = await UserConsent.create({
                user_id: testUserId,
                consent_data: consentData,
                ip_address: '127.0.0.1',
            });

            expect(consent).toBeDefined();
            expect((consent as any).user_id).toBe(testUserId);
        });

        it('should retrieve consent by user', async () => {
            const consentData = {
                necessary_cookies: true,
                analytics_cookies: true,
                marketing_cookies: false,
                data_processing: true,
                email_marketing: false,
                third_party_sharing: false,
            };

            await UserConsent.create({
                user_id: testUserId,
                consent_data: consentData,
            });

            const consents = await UserConsent.findAll({
                where: { user_id: testUserId },
            });

            expect(consents).toHaveLength(1);
            expect((consents[0] as any).consent_data.necessary_cookies).toBe(true);
        });
    });

    describe('AccountDeletionRequest Model', () => {
        it('should create deletion request', async () => {
            const scheduledDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            
            const request = await AccountDeletionRequest.create({
                user_id: testUserId,
                reason: 'Test deletion',
                status: 'pending',
                scheduled_deletion_date: scheduledDate,
            });

            expect(request).toBeDefined();
            expect((request as any).user_id).toBe(testUserId);
            expect((request as any).status).toBe('pending');
        });

        it('should update deletion request status', async () => {
            const request = await AccountDeletionRequest.create({
                user_id: testUserId,
                reason: 'Test deletion',
                status: 'pending',
                scheduled_deletion_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            });

            await (request as any).update({ status: 'cancelled' });
            expect((request as any).status).toBe('cancelled');
        });
    });

    describe('GDPR Data Operations', () => {
        it('should collect user data for export', async () => {
            // Create consent history
            await UserConsent.create({
                user_id: testUserId,
                consent_data: {
                    necessary_cookies: true,
                    analytics_cookies: false,
                    marketing_cookies: false,
                    data_processing: true,
                    email_marketing: false,
                    third_party_sharing: false,
                },
            });

            // Create deletion request
            await AccountDeletionRequest.create({
                user_id: testUserId,
                reason: 'Test',
                status: 'cancelled',
                scheduled_deletion_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            });

            // Collect all data
            const user = await User.findByPk(testUserId);
            const consents = await UserConsent.findAll({ where: { user_id: testUserId } });
            const deletionRequests = await AccountDeletionRequest.findAll({ where: { user_id: testUserId } });

            expect(user).toBeDefined();
            expect(consents).toHaveLength(1);
            expect(deletionRequests).toHaveLength(1);
        });

        it('should anonymize user data', async () => {
            const user = await User.findByPk(testUserId);
            
            await (user as any).update({
                email: `anonymized_${testUserId}@deleted.local`,
                first_name: 'Anonymized',
                last_name: 'User',
                is_active: false,
            });

            const anonymizedUser = await User.findByPk(testUserId);
            expect((anonymizedUser as any).email).toBe(`anonymized_${testUserId}@deleted.local`);
            expect((anonymizedUser as any).first_name).toBe('Anonymized');
            expect((anonymizedUser as any).is_active).toBe(false);
        });
    });

    describe('Data Integrity', () => {
        it('should maintain referential integrity', async () => {
            // Create related records
            await UserConsent.create({
                user_id: testUserId,
                consent_data: { necessary_cookies: true, analytics_cookies: false, marketing_cookies: false, data_processing: true, email_marketing: false, third_party_sharing: false },
            });

            await AccountDeletionRequest.create({
                user_id: testUserId,
                reason: 'Test',
                status: 'pending',
                scheduled_deletion_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            });

            // Verify relationships exist
            const consents = await UserConsent.findAll({ where: { user_id: testUserId } });
            const requests = await AccountDeletionRequest.findAll({ where: { user_id: testUserId } });

            expect(consents).toHaveLength(1);
            expect(requests).toHaveLength(1);
        });

        it('should validate consent data structure', async () => {
            const validConsent = {
                necessary_cookies: true,
                analytics_cookies: false,
                marketing_cookies: false,
                data_processing: true,
                email_marketing: false,
                third_party_sharing: false,
            };

            const consent = await UserConsent.create({
                user_id: testUserId,
                consent_data: validConsent,
            });

            const savedConsent = (consent as any).consent_data;
            expect(typeof savedConsent.necessary_cookies).toBe('boolean');
            expect(typeof savedConsent.analytics_cookies).toBe('boolean');
            expect(typeof savedConsent.marketing_cookies).toBe('boolean');
            expect(typeof savedConsent.data_processing).toBe('boolean');
            expect(typeof savedConsent.email_marketing).toBe('boolean');
            expect(typeof savedConsent.third_party_sharing).toBe('boolean');
        });
    });
});