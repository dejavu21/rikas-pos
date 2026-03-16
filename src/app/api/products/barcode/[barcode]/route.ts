import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ barcode: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { barcode } = await params
    
    const product = await prisma.product.findFirst({
      where: {
        OR: [
          { barcode },
          { barcode: { contains: barcode } },
        ],
      },
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
    console.error("Error fetching product by barcode:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
