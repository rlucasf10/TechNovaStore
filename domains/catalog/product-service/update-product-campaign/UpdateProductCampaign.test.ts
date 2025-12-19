import fc from 'fast-check';
import { UpdateProductCampaign } from './UpdateProductCampaign';
import { ClearProductCampaign } from '../clear-product-campaign/ClearProductCampaign';
import { Product, IProduct } from '../shared/types/Product';

/**
 * Property-Based Tests para UpdateProductCampaign y ClearProductCampaign
 *
 * Feature: campaign-manager-service, Property 27: Product Service Integration
 * Validates: Requirements 6.2
 *
 * Property 27: Product Service Integration
 * Para cualquier descuento aplicado, el producto debe actualizarse en el Product Service
 * con los campos de campaña correctos.
 */

// Generador de SKU único basado en UUID
const uniqueSkuArb = fc.uuid().map((uuid) => `SKU${uuid.replace(/-/g, '').substring(0, 12).toUpperCase()}`);

// Generador de ObjectId válido de MongoDB (24 caracteres hexadecimales)
const mongoObjectIdArb = fc
  .array(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'), {
    minLength: 24,
    maxLength: 24,
  })
  .map((chars) => chars.join(''));

describe('UpdateProductCampaign - Property-Based Tests', () => {
  // La conexión a MongoDB es manejada por jest.setup.ts

  beforeEach(async () => {
    // Limpiar productos de campaña antes de cada test
    await Product.deleteMany({ sku: /^SKU/ });
  });

  afterEach(async () => {
    // Limpiar productos de campaña después de cada test
    await Product.deleteMany({ sku: /^SKU/ });
  });

  /**
   * Property 27: Product Service Integration
   */
  describe('Property 27: Product Service Integration', () => {
    it('should update product with correct campaign fields for any valid campaign data', async () => {
      await fc.assert(
        fc.asyncProperty(
          uniqueSkuArb,
          fc.record({
            in_campaign: fc.constant(true),
            campaign_id: fc.uuid(),
            campaign_price: fc.float({ min: 50, max: 4000, noNaN: true }),
            original_price: fc.float({ min: 100, max: 5000, noNaN: true }),
            discount_percentage: fc.float({ min: 1, max: 99, noNaN: true }),
          }),
          async (sku, campaignData) => {
            // Crear producto en la base de datos
            const product: IProduct = (await Product.create({
              sku,
              name: 'Test Product Name',
              description: 'Test product description for testing',
              category: 'laptops',
              brand: 'Apple',
              our_price: 1000,
              providers: [],
              images: [],
              specifications: {},
              is_active: true,
            })) as any;

            // Aplicar campaña
            const updatedProduct = await UpdateProductCampaign.execute(product.id, campaignData);

            // Verificar que el producto fue actualizado
            expect(updatedProduct).not.toBeNull();
            expect(updatedProduct!.in_campaign).toBe(true);
            expect(updatedProduct!.campaign_id).toBe(campaignData.campaign_id);
            expect(updatedProduct!.campaign_price).toBeCloseTo(campaignData.campaign_price, 2);
            expect(updatedProduct!.original_price).toBeCloseTo(campaignData.original_price, 2);
            expect(updatedProduct!.discount_percentage).toBeCloseTo(campaignData.discount_percentage, 2);

            // Verificar persistencia en la base de datos
            const productFromDB = await Product.findById(product.id);
            expect(productFromDB).not.toBeNull();
            expect(productFromDB!.in_campaign).toBe(true);
            expect(productFromDB!.campaign_id).toBe(campaignData.campaign_id);

            // Limpiar después de cada iteración
            await Product.findByIdAndDelete(product.id);
          },
        ),
        { numRuns: 15 },
      );
    }, 60000);

    it('should reject invalid campaign data (negative prices)', async () => {
      await fc.assert(
        fc.asyncProperty(
          uniqueSkuArb,
          fc.record({
            in_campaign: fc.constant(true),
            campaign_id: fc.uuid(),
            campaign_price: fc.float({ min: -1000, max: -1, noNaN: true }),
            original_price: fc.float({ min: 100, max: 5000, noNaN: true }),
            discount_percentage: fc.float({ min: 1, max: 99, noNaN: true }),
          }),
          async (sku, campaignData) => {
            const product: IProduct = (await Product.create({
              sku,
              name: 'Test Product Name',
              description: 'Test product description for testing',
              category: 'laptops',
              brand: 'Apple',
              our_price: 1000,
              providers: [],
              images: [],
              specifications: {},
              is_active: true,
            })) as any;

            // Debe lanzar error por precio negativo
            await expect(UpdateProductCampaign.execute(product.id, campaignData)).rejects.toThrow();

            // Limpiar después de cada iteración
            await Product.findByIdAndDelete(product.id);
          },
        ),
        { numRuns: 10 },
      );
    }, 60000);

    it('should reject invalid discount percentage (outside 0-100 range)', async () => {
      await fc.assert(
        fc.asyncProperty(
          uniqueSkuArb,
          fc.record({
            in_campaign: fc.constant(true),
            campaign_id: fc.uuid(),
            campaign_price: fc.float({ min: 50, max: 4000, noNaN: true }),
            original_price: fc.float({ min: 100, max: 5000, noNaN: true }),
            discount_percentage: fc.oneof(
              fc.float({ min: -100, max: -1, noNaN: true }),
              fc.float({ min: 101, max: 200, noNaN: true }),
            ),
          }),
          async (sku, campaignData) => {
            const product: IProduct = (await Product.create({
              sku,
              name: 'Test Product Name',
              description: 'Test product description for testing',
              category: 'laptops',
              brand: 'Apple',
              our_price: 1000,
              providers: [],
              images: [],
              specifications: {},
              is_active: true,
            })) as any;

            // Debe lanzar error por porcentaje inválido
            await expect(UpdateProductCampaign.execute(product.id, campaignData)).rejects.toThrow();

            // Limpiar después de cada iteración
            await Product.findByIdAndDelete(product.id);
          },
        ),
        { numRuns: 10 },
      );
    }, 60000);

    it('should return null for non-existent product', async () => {
      await fc.assert(
        fc.asyncProperty(
          mongoObjectIdArb,
          fc.record({
            in_campaign: fc.constant(true),
            campaign_id: fc.uuid(),
            campaign_price: fc.float({ min: 50, max: 4000, noNaN: true }),
            original_price: fc.float({ min: 100, max: 5000, noNaN: true }),
            discount_percentage: fc.float({ min: 1, max: 99, noNaN: true }),
          }),
          async (nonExistentId, campaignData) => {
            const result = await UpdateProductCampaign.execute(nonExistentId, campaignData);
            expect(result).toBeNull();
          },
        ),
        { numRuns: 10 },
      );
    }, 60000);
  });

  /**
   * Property 28: Product Service Cleanup Integration
   */
  describe('Property 28: Product Service Cleanup Integration', () => {
    it('should clear all campaign fields for any product with campaign', async () => {
      await fc.assert(
        fc.asyncProperty(
          uniqueSkuArb,
          fc.record({
            in_campaign: fc.constant(true),
            campaign_id: fc.uuid(),
            campaign_price: fc.float({ min: 50, max: 4000, noNaN: true }),
            original_price: fc.float({ min: 100, max: 5000, noNaN: true }),
            discount_percentage: fc.float({ min: 1, max: 99, noNaN: true }),
          }),
          async (sku, campaignData) => {
            // Crear producto con campaña
            const product: IProduct = (await Product.create({
              sku,
              name: 'Test Product Name',
              description: 'Test product description for testing',
              category: 'laptops',
              brand: 'Apple',
              our_price: 1000,
              ...campaignData,
              providers: [],
              images: [],
              specifications: {},
              is_active: true,
            })) as any;

            // Verificar que tiene campos de campaña
            expect(product.in_campaign).toBe(true);
            expect(product.campaign_id).toBeDefined();

            // Limpiar campaña
            const clearedProduct = await ClearProductCampaign.execute(product.id);

            // Verificar que los campos fueron limpiados
            expect(clearedProduct).not.toBeNull();
            expect(clearedProduct!.in_campaign).toBe(false);
            expect(clearedProduct!.campaign_id).toBeUndefined();
            expect(clearedProduct!.campaign_price).toBeUndefined();
            expect(clearedProduct!.original_price).toBeUndefined();
            expect(clearedProduct!.discount_percentage).toBeUndefined();

            // Verificar persistencia en la base de datos
            const productFromDB = await Product.findById(product.id);
            expect(productFromDB).not.toBeNull();
            expect(productFromDB!.in_campaign).toBe(false);

            // Limpiar después de cada iteración
            await Product.findByIdAndDelete(product.id);
          },
        ),
        { numRuns: 15 },
      );
    }, 60000);

    it('should handle clearing campaign from product without campaign', async () => {
      await fc.assert(
        fc.asyncProperty(uniqueSkuArb, async (sku) => {
          // Crear producto SIN campaña
          const product: IProduct = (await Product.create({
            sku,
            name: 'Test Product Name',
            description: 'Test product description for testing',
            category: 'laptops',
            brand: 'Apple',
            our_price: 1000,
            providers: [],
            images: [],
            specifications: {},
            is_active: true,
            in_campaign: false,
          })) as any;

          // Limpiar campaña (debería funcionar sin errores)
          const clearedProduct = await ClearProductCampaign.execute(product.id);

          // Verificar que no hay errores y los campos siguen limpios
          expect(clearedProduct).not.toBeNull();
          expect(clearedProduct!.in_campaign).toBe(false);
          expect(clearedProduct!.campaign_id).toBeUndefined();

          // Limpiar después de cada iteración
          await Product.findByIdAndDelete(product.id);
        }),
        { numRuns: 10 },
      );
    }, 60000);

    it('should return null when clearing campaign from non-existent product', async () => {
      await fc.assert(
        fc.asyncProperty(mongoObjectIdArb, async (nonExistentId) => {
          const result = await ClearProductCampaign.execute(nonExistentId);
          expect(result).toBeNull();
        }),
        { numRuns: 10 },
      );
    }, 60000);
  });
});
