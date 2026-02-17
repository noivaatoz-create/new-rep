# Vercel pe DATABASE_URL add kaise karein

Product / orders / settings save karne ke liye **DATABASE_URL** zaroori hai. Neeche steps follow karein.

---

## 1. Neon se connection string lo

1. https://neon.tech pe jao aur account banao (ya login)  
2. **New Project** banao  
3. Project ke andar **Connection string** copy karo (URI format)  
   - Format aisa hoga:  
     `postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`  
4. Agar password change karna ho to **Dashboard** → **Connection details** se set karo  

---

## 2. Vercel pe variable add karo

1. https://vercel.com → apna **Nova** project  
2. **Settings** → **Environment Variables**  
3. **Add** → **Key:** `DATABASE_URL`  
4. **Value:** jo connection string copy kiya (password ke saath) paste karo  
5. **Environments:** Production (aur agar chaho to Preview bhi select karo)  
6. **Save** karo  

---

## 3. Redeploy karo

1. **Deployments** tab  
2. Latest deployment ke saamne **⋯** → **Redeploy**  
3. Redeploy complete hone do  

Iske baad product create / order save sab Neon DB pe kaam karega.
