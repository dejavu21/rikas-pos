import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const productId = searchParams.get("productId")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")

    const where: any = {}

    if (productId) {
      where.productId = productId
    }

    const [restocks, total] = await Promise.all([
      prisma.restock.findMany({
        where,
        include: {
          product: true,
          variation: true,
          user: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.restock.count({ where }),
    ])

    return NextResponse.json({
      restocks,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("Error fetching restocks:", error)
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
    const { productId, variationId, quantity, costPrice, supplier, notes } = body

    const restock = await prisma.$transaction(async (tx) => {
      // Create restock record
      const newRestock = await tx.restock.create({
        data: {
          productId,
          variationId: variationId || null,
          quantity: parseInt(quantity),
          costPrice: parseFloat(costPrice) || 0,
          supplier,
          notes,
          userId: session.user.id,
        },
        include: {
          product: true,
          variation: true,
        },
      })

      // Update product/variation stock
      if (variationId) {
        await tx.productVariation.update({
          where: { id: variationId },
          data: {
            stock: {
              increment: parseInt(quantity),
            },
          },
        })
      }

      await tx.product.update({
        where: { id: productId },
        data: {
          stock: {
            increment: parseInt(quantity),
          },
          costPrice: parseFloat(costPrice) || undefined,
        },
      })

      return newRestock
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "RESTOCK",
        description: `Restok produk: ${restock.product.name}`,
        details: { quantity, costPrice },
      },
    })

    return NextResponse.json(restock, { status: 201 })
  } catch (error) {
    console.error("Error creating restock:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
