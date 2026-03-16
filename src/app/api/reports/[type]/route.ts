import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { type } = await params
    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const userId = searchParams.get("userId")

    const dateFilter: any = {}
    if (startDate && endDate) {
      dateFilter.gte = new Date(startDate)
      dateFilter.lte = new Date(endDate)
    }

    switch (type) {
      case "sales": {
        const orders = await prisma.order.findMany({
          where: {
            status: "COMPLETED",
            createdAt: dateFilter,
          },
          include: {
            customer: true,
            user: { select: { name: true } },
            items: true,
          },
          orderBy: { createdAt: "desc" },
        })

        const totalSales = orders.reduce((sum, o) => sum + o.total, 0)
        const totalItems = orders.reduce((sum, o) => 
          sum + o.items.reduce((s, i) => s + i.quantity, 0), 0
        )

        return NextResponse.json({
          orders,
          summary: {
            totalTransactions: orders.length,
            totalSales,
            totalItems,
          },
        })
      }

      case "profit": {
        const orders = await prisma.order.findMany({
          where: {
            status: "COMPLETED",
            createdAt: dateFilter,
          },
          include: {
            items: {
              include: { product: true },
            },
          },
        })

        let totalRevenue = 0
        let totalCost = 0

        orders.forEach((order) => {
          order.items.forEach((item) => {
            totalRevenue += item.price * item.quantity
            totalCost += (item.costPrice || 0) * item.quantity
          })
        })

        return NextResponse.json({
          summary: {
            totalRevenue,
            totalCost,
            grossProfit: totalRevenue - totalCost,
            profitMargin: totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0,
          },
        })
      }

      case "products": {
        const orders = await prisma.order.findMany({
          where: {
            status: "COMPLETED",
            createdAt: dateFilter,
          },
          include: {
            items: {
              include: { product: true },
            },
          },
        })

        const productStats: Record<string, any> = {}

        orders.forEach((order) => {
          order.items.forEach((item) => {
            const productId = item.productId
            if (!productStats[productId]) {
              productStats[productId] = {
                product: item.product,
                totalQty: 0,
                totalRevenue: 0,
              }
            }
            productStats[productId].totalQty += item.quantity
            productStats[productId].totalRevenue += item.price * item.quantity
          })
        })

        const products = Object.values(productStats).sort(
          (a: any, b: any) => b.totalQty - a.totalQty
        )

        return NextResponse.json({ products })
      }

      case "cashier": {
        const orders = await prisma.order.findMany({
          where: {
            status: "COMPLETED",
            createdAt: dateFilter,
            ...(userId ? { userId } : {}),
          },
          include: {
            user: { select: { name: true, email: true } },
          },
        })

        const cashierStats: Record<string, any> = {}

        orders.forEach((order) => {
          const userId = order.userId
          if (!cashierStats[userId]) {
            cashierStats[userId] = {
              user: order.user,
              totalTransactions: 0,
              totalSales: 0,
            }
          }
          cashierStats[userId].totalTransactions++
          cashierStats[userId].totalSales += order.total
        })

        const cashiers = Object.values(cashierStats).sort(
          (a: any, b: any) => b.totalSales - a.totalSales
        )

        return NextResponse.json({ cashiers })
      }

      case "expenses": {
        const expenses = await prisma.expense.findMany({
          where: {
            date: dateFilter,
          },
          include: {
            user: { select: { name: true } },
          },
          orderBy: { date: "desc" },
        })

        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

        return NextResponse.json({
          expenses,
          summary: {
            totalExpenses,
            count: expenses.length,
          },
        })
      }

      case "stock": {
        const products = await prisma.product.findMany({
          include: {
            category: true,
            variations: true,
          },
          orderBy: { stock: "asc" },
        })

        const lowStock = products.filter((p) => p.stock <= p.minStock)
        const outOfStock = products.filter((p) => p.stock === 0)

        return NextResponse.json({
          products,
          summary: {
            totalProducts: products.length,
            lowStockCount: lowStock.length,
            outOfStockCount: outOfStock.length,
          },
        })
      }

      case "payment": {
        const orders = await prisma.order.findMany({
          where: {
            status: "COMPLETED",
            createdAt: dateFilter,
          },
        })

        const paymentStats: Record<string, number> = {}

        orders.forEach((order) => {
          const method = order.paymentMethod
          if (!paymentStats[method]) {
            paymentStats[method] = 0
          }
          paymentStats[method] += order.total
        })

        return NextResponse.json({
          payments: Object.entries(paymentStats).map(([method, total]) => ({
            method,
            total,
          })),
        })
      }

      default:
        return NextResponse.json({ error: "Invalid report type" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error generating report:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
