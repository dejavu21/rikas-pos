import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create owner user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const owner = await prisma.user.upsert({
    where: { email: 'admin@kasirpos.com' },
    update: {},
    create: {
      name: 'Owner',
      email: 'admin@kasirpos.com',
      password: hashedPassword,
      role: 'OWNER',
      isActive: true,
    },
  })

  console.log('Created owner user:', owner.email)

  // Create default categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { id: 'makanan-ringan' },
      update: {},
      create: {
        id: 'makanan-ringan',
        name: 'Makanan Ringan',
        color: '#3B82F6',
      },
    }),
    prisma.category.upsert({
      where: { id: 'minuman' },
      update: {},
      create: {
        id: 'minuman',
        name: 'Minuman',
        color: '#10B981',
      },
    }),
    prisma.category.upsert({
      where: { id: 'kebutuhan-rumah' },
      update: {},
      create: {
        id: 'kebutuhan-rumah',
        name: 'Kebutuhan Rumah',
        color: '#F59E0B',
      },
    }),
  ])

  console.log('Created categories:', categories.length)

  // Create default payment methods
  const paymentMethods = await prisma.setting.upsert({
    where: { key: 'payment_methods' },
    update: {},
    create: {
      key: 'payment_methods',
      value: [
        { id: 'tunai', name: 'Tunai', isDefault: true },
        { id: 'qris', name: 'QRIS', isDefault: false },
        { id: 'debit', name: 'Kartu Debit', isDefault: false },
        { id: 'kredit', name: 'Kartu Kredit', isDefault: false },
      ],
    },
  })

  console.log('Created payment methods')

  // Create default additional fees
  const additionalFees = await prisma.setting.upsert({
    where: { key: 'additional_fees' },
    update: {},
    create: {
      key: 'additional_fees',
      value: [
        { id: 'pajak', name: 'Pajak', type: 'percentage', value: 10 },
        { id: 'service', name: 'Service Charge', type: 'percentage', value: 5 },
      ],
    },
  })

  console.log('Created additional fees')

  // Create store profile
  const storeProfile = await prisma.setting.upsert({
    where: { key: 'store_profile' },
    update: {},
    create: {
      key: 'store_profile',
      value: {
        name: 'Toko Saya',
        address: 'Jl. Contoh No. 123',
        phone: '081234567890',
        email: 'toko@email.com',
      },
    },
  })

  console.log('Created store profile')

  // Create app settings
  await prisma.setting.upsert({
    where: { key: 'app_settings' },
    update: {},
    create: {
      key: 'app_settings',
      value: {
        language: 'id',
        currency: 'IDR',
        taxEnabled: true,
        receiptFooter: 'Terima Kasih',
      },
    },
  })

  console.log('Created app settings')
  console.log('\n✅ Database seeded successfully!')
  console.log('\n📝 Login credentials:')
  console.log('   Email: admin@kasirpos.com')
  console.log('   Password: admin123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
