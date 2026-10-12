# Bluehouse QR Order

ระบบสั่งอาหารผ่าน QR Code ประจำโต๊ะ — Next.js 14 + Supabase + Tailwind CSS

## หน้าในระบบ
- `/` หน้าแรก + เลือกโต๊ะสำรอง
- `/table/1` ถึง `/table/6` หน้าสั่งอาหาร (ลิงก์ใน QR แต่ละโต๊ะ)
- `/my-orders` ออเดอร์ของฉัน + ติดตามสถานะ
- `/kitchen` หน้าจอครัว / แคชเชียร์ (ต้องล็อกอินพนักงาน)
- `/qr` พิมพ์ QR ทุกโต๊ะ

## ติดตั้ง
1. Supabase > SQL Editor > รันไฟล์ `supabase/schema.sql`
2. Supabase > Authentication > Users > Add user (บัญชีพนักงาน)
3. คัดลอก `.env.local.example` เป็น `.env.local` แล้วใส่คีย์
4. `npm install` แล้ว `npm run dev` > เปิด http://localhost:3000

## แก้เมนู / ราคา / จำนวนโต๊ะ
แก้ที่ `lib/config.ts` ไฟล์เดียว (เพิ่มโต๊ะแล้วต้องพิมพ์ QR ใหม่)