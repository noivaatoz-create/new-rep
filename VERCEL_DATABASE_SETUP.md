# Vercel pe DATABASE_URL add kaise karein

Product / orders / settings save karne ke liye **DATABASE_URL** zaroori hai. Neeche steps follow karein.

---

## 1. Supabase se connection string lo

1. https://supabase.com/dashboard pe jao  
2. Apna **Nova** project kholo  
3. Left sidebar → **Project Settings** (gear icon)  
4. **Database** pe click karo  
5. Neeche **Connection string** section mein:
   - **URI** tab select karo  
   - **Mode:** "Session" ya "Transaction" (Session prefer karein)  
   - **Copy** karo — format aisa hoga:
     ```
     postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
     ```
6. `[YOUR-PASSWORD]` ki jagah apna **database password** daalo (project create karte waqt jo diya tha).  
   Password bhool gaye? → **Reset database password** (us hi Database page pe) se naya set karo.

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

Iske baad product add/save kaam karna chahiye.
