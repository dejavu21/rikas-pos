import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { generateOrderNumber } from "@/lib/utils"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    const where: any = {
      OR: [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
      ],
    }

    if (status) {
      where.status = status
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: true,
          user: {
            select: { name: true, email: true },
          },
          items: {
            include: {
              product: true,
              variation: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ])

    return NextResponse.json({
      orders,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { customerId, items, subtotal, discount, discountType, tax, additionalFees, total, paymentMethod, amountPaid, change, notes, isPreOrder, preOrderDate } = body

    // Generate order number
    const orderNumber = generateOrderNumber()

    // Create order with items in a transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create the order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId: customerId || null,
          userId: session.user.id,
          subtotal: parseFloat(subtotal) || 0,
          discount: parseFloat(discount) || 0,
          discountType: discountType || "PERCENTAGE",
          tax: parseFloat(tax) || 0,
          additionalFees: parseFloat(additionalFees) || 0,
          total: parseFloat(total) || 0,
          paymentMethod,
          amountPaid: parseFloat(amountPaid) || 0,
          change: parseFloat(change) || 0,
          notes,
          isPreOrder: isPreOrder || false,
          preOrderDate: preOrderDate ? new Date(preOrderDate) : null,
          status: isPreOrder ? "PREORDER" : "COMPLETED",
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              variationId: item.variationId || null,
              quantity: parseInt(item.quantity) || 1,
              price: parseFloat(item.price) || 0,
              costPrice: parseFloat(item.costPrice) || 0,
              discount: parseFloat(item.discount) || 0,
              discountType: item.discountType || "PERCENTAGE",
              notes: item.notes || null,
              additionalFees: parseFloat(item.additionalFees) || 0,
            })),
          },
        },
        include: {
          customer: true,
          user: {
            select: { name: true, email: true },
          },
          items: {
            include: {
              product: true,
              variation: true,
            },
          },
        },
      })

      // Update product stock
      for (const item of items) {
        if (item.variationId) {
          // Update variation stock
          await tx.productVariation.update({
            where: { id: item.variationId },
            data: {
              stock: {
                decrement: parseInt(item.quantity) || 1,
              },
            },
          })
        }

        // Update main product stock
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: parseInt(item.quantity) || 1,
            },
          },
        })
      }

      // If pre-order, don't complete yet
      if (!isPreOrder) {
        await tx.order.update({
          where: { id: newOrder.id },
          data: { status: "COMPLETED" },
        })
      }

      return newOrder
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: isPreOrder ? "CREATE_PREORDER" : "CREATE_ORDER",
        description: `Membuat ${isPreOrder ? "pre-order" : "pesanan"} baru: ${order.orderNumber}`,
        details: { total, paymentMethod },
      },
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
