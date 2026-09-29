# Paji Shoes — Ecommerce Platform

Production-ready footwear ecommerce website for **Paji Shoes**, Durg, Chhattisgarh.

## Stack

- **Next.js 15** (App Router) + TypeScript + Tailwind CSS
- **Neon PostgreSQL** + Drizzle ORM
- **Cloudinary** (images & videos)
- **Razorpay** (payments)

## Setup

1. **Install dependencies**

```bash
cd "C:\Users\Harshit\Documents\paji shoes"
npm install
```

2. **Configure environment**

Copy `.env.example` to `.env` and fill in:

- `DATABASE_URL` — Neon PostgreSQL connection string
- `CLOUDINARY_*` — Cloudinary credentials
- `RAZORPAY_*` — Razorpay keys
- `AUTH_SECRET` — random string (min 32 characters)
- `NEXT_PUBLIC_APP_URL` — e.g. `http://localhost:3000`

3. **Push schema & seed**

```bash
npm run db:push
npm run db:seed
```

4. **Run dev server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Login credentials

### Admin portal — `/admin/login`

| Field    | Value                |
|----------|----------------------|
| Username | `WPaJiShoes`         |
| Password | `WPPaJJoi@12356789`  |

### Customer login — `/account`

1. Enter your 10-digit mobile number
2. Click **Get OTP**
3. OTP is shown **on screen** (demo mode — no SMS required)
4. Enter the OTP to sign in

---

## Admin features

- Dashboard (sales, orders, low stock)
- Products (9-step wizard, optional sizes/colors, variants)
- Categories (Cloudinary image upload)
- Orders (status updates, invoice print)
- Videos (Our Glimpses homepage section)
- Branding (logo → auto favicon sitewide)
- Settings (store info, hero, SEO, shipping/tax)

## Build troubleshooting (Windows)

If you see **`Can't resolve 'fs'`** from Cloudinary: pull latest code (client uses `cloudinary-url.ts` only).

If you see **`next-swc.win32-x64-msvc.node is not a valid Win32 application`**:

```bat
cd /d "C:\Users\Harshit\Documents\paji shoes"
rmdir /s /q node_modules
del package-lock.json
npm install
npm run build
```

Use **64-bit Node.js** (not 32-bit). If Next warns about multiple lockfiles, either remove stray `C:\Users\Harshit\package-lock.json` if you did not mean to create it, or keep it — this project sets `outputFileTracingRoot` in `next.config.ts`.

## Deploy

Deploy to **Vercel** with the same environment variables. Connect Neon as `DATABASE_URL`.

---

© Paji Shoes — Near Marwadi School, Baniya Para, Durg, Chhattisgarh – 491001
