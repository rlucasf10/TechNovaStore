/**
 * Script para migrar campañas hardcodeadas del frontend a la base de datos
 * 
 * Este script toma las campañas definidas en el frontend (campaigns.ts) y las
 * inserta en la base de datos del Campaign Manager Service.
 */

import { Pool } from 'pg';
import { logger } from '../shared/utils/logger';

// Validación de POSTGRES_PASSWORD
const dbPassword = process.env.POSTGRES_PASSWORD;

if (!dbPassword) {
  logger.error('CRITICAL: POSTGRES_PASSWORD environment variable is not set');
  throw new Error('POSTGRES_PASSWORD must be configured. Application cannot start.');
}

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'technovastore',
  user: process.env.POSTGRES_USER || 'admin',
  password: dbPassword,
});

// Campañas a migrar (copiadas del frontend)
const campaigns = [
  // Black Friday / Cyber Monday (Noviembre)
  {
    name: 'Black Friday 2025',
    slug: 'black-friday-2025',
    startDate: new Date(new Date().getFullYear(), 10, 20), // 20 Nov
    endDate: new Date(new Date().getFullYear(), 11, 2), // 2 Dic
    priority: 100,
    discountRules: {
      global: {
        type: 'percentage',
        value: 20,
        maxDiscount: 500
      }
    },
    frontendConfig: {
      promoBanner: {
        messages: [
          { icon: '🔥', text: 'BLACK FRIDAY: Hasta 70% de descuento' },
          { icon: '⚡', text: 'Cyber Monday: Ofertas relámpago cada hora' },
          { icon: '🎁', text: 'Envío gratis en todos los pedidos' },
          { icon: '💳', text: 'Financiación sin intereses hasta 24 meses' },
        ],
        backgroundColor: 'from-gray-900 to-black'
      },
      hero: {
        title: '🔥 BLACK FRIDAY 2025',
        subtitle: 'Los descuentos más grandes del año en tecnología. ¡No te lo pierdas!',
        ctaText: 'Ver Ofertas Black Friday',
        badge: 'Hasta -70%'
      },
      dealsSection: {
        title: '⚡ Ofertas Black Friday',
        subtitle: 'Descuentos increíbles que no volverás a ver',
        badge: 'BLACK FRIDAY',
        backgroundColor: 'from-gray-900 to-gray-800'
      },
      categories: ['portatiles', 'componentes', 'monitores', 'smartphones']
    }
  },

  // Navidad (Diciembre)
  {
    name: 'Navidad 2025',
    slug: 'navidad-2025',
    startDate: new Date(new Date().getFullYear(), 11, 1), // 1 Dic
    endDate: new Date(new Date().getFullYear(), 11, 26), // 26 Dic
    priority: 90,
    discountRules: {
      global: {
        type: 'percentage',
        value: 15,
        maxDiscount: 300
      }
    },
    frontendConfig: {
      promoBanner: {
        messages: [
          { icon: '🎄', text: 'Adelanta tus compras de Navidad' },
          { icon: '🎁', text: 'Envío gratis hasta el 24 de diciembre' },
          { icon: '🔄', text: 'Devoluciones gratis hasta el 15 de enero' },
          { icon: '💳', text: 'Financiación especial Navidad' },
        ]
      },
      hero: {
        title: '🎄 Regalos Tecnológicos para Navidad',
        subtitle: 'Encuentra el regalo perfecto con envío garantizado antes del 24',
        ctaText: 'Ver Ideas de Regalo',
        badge: 'Especial Navidad'
      },
      dealsSection: {
        title: '🎁 Los Mejores Regalos Tech',
        subtitle: 'Ideas perfectas para sorprender esta Navidad',
        badge: 'ESPECIAL NAVIDAD',
        backgroundColor: 'from-red-600 to-green-600'
      },
      categories: ['smartphones', 'tablets', 'consolas', 'perifericos']
    }
  },

  // Rebajas de Enero
  {
    name: 'Rebajas de Enero 2026',
    slug: 'rebajas-enero-2026',
    startDate: new Date(new Date().getFullYear() + 1, 0, 7), // 7 Ene 2026
    endDate: new Date(new Date().getFullYear() + 1, 0, 31), // 31 Ene 2026
    priority: 85,
    discountRules: {
      global: {
        type: 'percentage',
        value: 25,
        maxDiscount: 400
      }
    },
    frontendConfig: {
      promoBanner: {
        messages: [
          { icon: '🎉', text: 'Rebajas de Enero: Hasta 60% de descuento' },
          { icon: '🔄', text: 'Devoluciones extendidas hasta el 31 de enero' },
          { icon: '🚚', text: 'Envío gratis en pedidos superiores a 50€' },
          { icon: '💰', text: 'Descuentos adicionales por cantidad' },
        ]
      },
      hero: {
        title: '🎉 Rebajas de Enero',
        subtitle: 'Aprovecha los últimos descuentos del año en tecnología',
        ctaText: 'Ver Rebajas',
        badge: 'Hasta -60%'
      },
      dealsSection: {
        title: '💥 Últimas Unidades en Rebaja',
        subtitle: 'Stock limitado a precios increíbles',
        badge: 'REBAJAS',
        backgroundColor: 'from-purple-600 to-pink-600'
      }
    }
  }
];

async function migrateCampaigns() {
  logger.info('Iniciando migración de campañas');

  try {
    // Conectar a la base de datos
    await pool.connect();
    logger.info('Conectado a PostgreSQL');

    // Insertar cada campaña
    for (const campaign of campaigns) {
      logger.info('Insertando campaña', { campaignName: campaign.name });
      
      const query = `
        INSERT INTO campaigns (
          name, slug, start_date, end_date, priority, is_active,
          discount_rules, frontend_config, discounts_applied,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          start_date = EXCLUDED.start_date,
          end_date = EXCLUDED.end_date,
          priority = EXCLUDED.priority,
          discount_rules = EXCLUDED.discount_rules,
          frontend_config = EXCLUDED.frontend_config,
          updated_at = NOW()
        RETURNING id, name;
      `;

      const values = [
        campaign.name,
        campaign.slug,
        campaign.startDate,
        campaign.endDate,
        campaign.priority,
        false, // is_active (se activará automáticamente por el scheduler)
        JSON.stringify(campaign.discountRules),
        JSON.stringify(campaign.frontendConfig),
        false // discounts_applied
      ];

      const result = await pool.query(query, values);
      logger.info('Campaña insertada exitosamente', {
        campaignId: result.rows[0].id,
        campaignName: result.rows[0].name,
        startDate: campaign.startDate.toLocaleDateString(),
        endDate: campaign.endDate.toLocaleDateString(),
        priority: campaign.priority
      });
    }

    logger.info('Migración completada exitosamente', {
      totalCampaigns: campaigns.length
    });

  } catch (error) {
    logger.error('Error durante la migración', {
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  } finally {
    await pool.end();
  }
}

// Ejecutar migración
migrateCampaigns()
  .then(() => {
    logger.info('Proceso de migración completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Error fatal en migración', {
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  });
