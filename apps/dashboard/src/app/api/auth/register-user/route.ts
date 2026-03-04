import { prisma } from "@eventos-prime/db";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password, name, personType, area, category, jobTitle, avatarUrl } = body;

        function mapCategoryToRole(cat: string) {
            if (cat === "Socio") return "ADMIN";
            if (cat === "Sponsor") return "SPONSOR";
            if (["Proveedor", "Agencia Externa", "Empresa Aliada", "Consultor", "Artista"].includes(cat)) return "PROVEEDOR";
            if (["Staff Administrativo"].includes(cat)) return "COORDINADOR";
            return "STAFF";
        }

        const role = mapCategoryToRole(category);

        const adminSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 1. Create user in Supabase with admin API
        // Do NOT store avatarUrl in user_metadata to avoid gigantic cookies (HTTP 431)
        const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Automatically confirm the email
            user_metadata: {
                name,
                role,
                personType,
                area,
                category,
                jobTitle
            }
        });

        if (authError) throw authError;

        if (authData?.user) {
            // 2. Insert into Prisma DB directly with the base64 avatar
            await (prisma as any).user.upsert({
                where: { id: authData.user.id },
                update: {
                    name,
                    role: role as any,
                    personType: personType || null,
                    area: area || null,
                    category: category || null,
                    jobTitle: jobTitle || null,
                    avatarUrl: avatarUrl || null
                },
                create: {
                    id: authData.user.id,
                    email: authData.user.email!,
                    name,
                    role: role as any,
                    personType: personType || null,
                    area: area || null,
                    category: category || null,
                    jobTitle: jobTitle || null,
                    avatarUrl: avatarUrl || null
                }
            });
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
