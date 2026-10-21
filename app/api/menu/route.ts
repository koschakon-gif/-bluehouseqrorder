import { NextRequest, NextResponse } from 'next/server'
import { PRODUCTS, type Product } from '@/lib/config'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('id', { ascending: true })

    if (!error && data && data.length > 0) {
      return NextResponse.json({
        products: data as Product[],
        source: 'database',
      })
    }
  } catch (err) {
    console.warn('Fetch products from DB failed, using fallback:', err)
  }

  return NextResponse.json({
    products: PRODUCTS,
    source: 'fallback',
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, product, id, is_out_of_stock } = body

    if (action === 'toggle_stock' && id) {
      const { data, error } = await supabase
        .from('products')
        .update({ is_out_of_stock: Boolean(is_out_of_stock) })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ success: true, product: data })
    }

    if (action === 'upsert' && product) {
      const { data, error } = await supabase
        .from('products')
        .upsert(product)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ success: true, product: data })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}
