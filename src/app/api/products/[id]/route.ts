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
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        variations: true,
        wholesalePrices: {
          orderBy: { minQty: "asc" },
        },
      },
    })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error("Error fetching product:", error)
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

    if (session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const { name, barcode, categoryId, image, price, costPrice, stock, minStock, unit, hasVariations, variations, wholesalePrices } = body

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        barcode,
        categoryId,
        image,
        price: parseFloat(price) || 0,
        costPrice: parseFloat(costPrice) || 0,
        stock: parseInt(stock) || 0,
        minStock: parseInt(minStock) || 0,
        unit: unit || "pcs",
        hasVariations,
      },
      include: {
        category: true,
        variations: true,
      },
    })

    // Update variations if hasVariations is true
    if (hasVariations && variations) {
      await prisma.productVariation.deleteMany({
        where: { productId: id },
      })

      await prisma.productVariation.createMany({
        data: variations.map((v: any) => ({
          productId: id,
          name: v.name,
          sku: v.sku,
          price: parseFloat(v.price) || 0,
          stock: parseInt(v.stock) || 0,
        })),
      })
    }

    // Update wholesale prices
    if (wholesalePrices) {
      await prisma.wholesalePrice.deleteMany({
        where: { productId: id },
      })

      await prisma.wholesalePrice.createMany({
        data: wholesalePrices.map((w: any) => ({
          productId: id,
          minQty: parseInt(w.minQty),
          price: parseFloat(w.price),
        })),
      })
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE_PRODUCT",
        description: `Memperbarui produk: ${product.name}`,
      },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error("Error updating product:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const product = await prisma.product.findUnique({
      where: { id },
    })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    await prisma.product.delete({
      where: { id },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE_PRODUCT",
        description: `Menghapus produk: ${product.name}`,
      },
    })

    return NextResponse.json({ message: "Product deleted successfully" })
  } catch (error) {
    console.error("Error deleting product:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
