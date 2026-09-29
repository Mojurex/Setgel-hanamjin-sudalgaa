# Өдөрлөгийн судалгаа · Амжилт Кибер Сургууль

Эцэг эхийн хурлын дараах санал асуулгын вэб (кибер/неон HUD загвар) + админ самбар.
React + Vite + Tailwind v4 + Framer Motion + Recharts + Supabase.

| Хуудас | Зам |
|---|---|
| Судалгааны форм (3 алхам, 10 асуулт) | `/` |
| Удирдлагын төв (статистик, график, шүүлт, CSV, хичээл засах) | `/admin` |

## Ажиллуулах

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # dist/ хавтсанд
```

`.env` файлгүй бол **демо горимоор** ажиллана: хариултууд зөвхөн тухайн хөтөчийн
localStorage-д хадгалагдана, админы нууц үг `amjilt2026` (`VITE_DEMO_ADMIN_PASSWORD`-оор солино).

## Supabase холбох

1. Supabase дээр шинэ төсөл үүсгэнэ.
2. **SQL Editor** дээр `supabase/schema.sql`-ийг бүтнээр нь ажиллуулна. Энэ нь:
   - `form_responses` — хариултууд. RLS: нийтэд зөвхөн **INSERT**, унших/устгах нь зөвхөн админд.
   - `subjects` — 7-р асуултын хичээлийн жагсаалт. Нийтэд унших, засах нь зөвхөн админд.
   - `admins` + `is_admin()` — админ эрх.
   - Нэг төхөөрөмжөөс 10 минутад 2-оос олон илгээлтийг хаадаг trigger.
3. **Authentication → Users** хэсэгт админ хэрэглэгч (мэйл + нууц үг) үүсгээд:
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'admin@amjilt.com';
   ```
   Нийтийн бүртгэлийг хаах бол Authentication → Sign In / Providers дээр “Allow new users to sign up”-г унтраана.
4. `.env.example`-г `.env` болгон хуулж `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`-г бөглөнө.

## Байршуулах

SPA тул бүх замыг `index.html` руу чиглүүлэх хэрэгтэй (`/admin` шууд нээгдэхийн тулд).
Vercel-д `vercel.json`, Netlify-д `public/_redirects` бэлэн байгаа. Орчны хувьсагчдаа хостинг дээр тохируулна.

## Давхар илгээлтийн хамгаалалт

- Хөтөч бүрт `device_id` (localStorage); 10 минутад 2 удаагаас илүү илгээхгүй.
- Нэг сурагчийн нэр + бүлгээр дахин илгээх гэвэл баталгаажуулалт асууна.
- Серверт мөн адил хязгаар (trigger) + ботоос хамгаалах honeypot талбар.

## Хүртээмж ба гүйцэтгэл

- `prefers-reduced-motion` болон сул төхөөрөмж (≤4 цөм, ≤2GB санах ой, Save-Data) дээр анимаци автоматаар хөнгөрнө.
- Бүх сонголт жинхэнэ `radio`/`checkbox` тул гар, дэлгэц уншигчаар ажиллана; товч 44px+.
- Графикууд “Хүснэгт” горимтой; асран хамгаалагчийн donut-д өнгөнөөс гадна хээ ашигласан.
