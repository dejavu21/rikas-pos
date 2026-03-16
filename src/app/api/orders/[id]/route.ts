import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    
    const order = await prisma.order.findUnique({
      where: { id },
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

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error("Error fetching order:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { action, ...updateData } = body

    if (action === "void") {
      // Void the order - restore stock
      const order = await prisma.order.findUnique({
        where: { id },
        include: { items: true },
      })

      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 })
      }

      if (order.status === "VOID") {
        return NextResponse.json({ error: "Order already voided" }, { status: 400 })
      }

      await prisma.$transaction(async (tx) => {
        // Restore stock
        for (const item of order.items) {
          if (item.variationId) {
            await tx.productVariation.update({
              where: { id: item.variationId },
              data: {
                stock: {
                  increment: item.quantity,
                },
              },
            })
          }

          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          })
        }

        // Update order status
        await tx.order.update({
          where: { id },
          data: { status: "VOID" },
        })
      })

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: "VOID_ORDER",
          description: `Membatalkan pesanan: ${order.orderNumber}`,
        },
      })

      return NextResponse.json({ message: "Order voided successfully" })
    }

    // Regular update
    const order = await prisma.order.update({
      where: { id },
      data: {
        customerId: updateData.customerId,
        notes: updateData.notes,
        paymentMethod: updateData.paymentMethod,
        status: updateData.status,
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

    return NextResponse.json(order)
  } catch (error) {
    console.error("Error updating order:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
