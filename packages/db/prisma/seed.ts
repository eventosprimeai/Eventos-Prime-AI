import { PrismaClient, UserRole, TaskStatus, TaskPriority, EventStatus, SponsorStage } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Iniciando seeder con datos de prueba...");

    // 1. Usuarios / Equipo
    console.log("👥 Creando equipo...");
    const adminId = "f98d11b4-26d2-4620-a071-9d1e896d3f91"; // ID de Gabriel que ya existe en Supabase Auth

    // Actualizar al Director (Gabriel) por si falta algo
    const director = await prisma.user.upsert({
        where: { id: adminId },
        update: { name: "Gabriel", role: "DIRECTOR", email: "ventas@eventosprimeai.com" },
        create: { id: adminId, name: "Gabriel", role: "DIRECTOR", email: "ventas@eventosprimeai.com" },
    });

    const users = [
        { id: "test-user-1", email: "marketing@eventosprimeai.com", name: "Ana Pérez", role: UserRole.COORDINADOR },
        { id: "test-user-2", email: "finanzas@eventosprimeai.com", name: "María López", role: UserRole.ADMIN },
        { id: "test-user-3", email: "logistica@eventosprimeai.com", name: "Carlos Ruiz", role: UserRole.STAFF },
        { id: "test-user-4", email: "comercial@eventosprimeai.com", name: "Elena Gómez", role: UserRole.STAFF },
    ];

    const dbUsers = [];
    for (const u of users) {
        const created = await prisma.user.upsert({
            where: { id: u.id },
            update: u,
            create: u,
        });
        dbUsers.push(created);
    }

    // 2. Evento: Prime Festival
    console.log("🎪 Asegurando evento Prime Festival...");
    let evento = await prisma.event.findFirst({ where: { name: { contains: "Prime" } } });

    if (!evento) {
        evento = await prisma.event.create({
            data: {
                name: "Prime Festival 2026 | Gran Final",
                description: "Coliseo principal para la competencia y conciertos.\n\nÁreas recreativas con canchas de fútbol y tenis, piscinas y zona de karting.\n\nEspacios gastronómicos y seguridad corporativa.",
                startDate: new Date("2026-07-09T00:00:00Z"),
                endDate: new Date("2026-07-10T23:59:59Z"),
                location: "Guayaquil",
                venue: "Club Nacional",
                capacity: 24000,
                budget: 50000,
                status: EventStatus.PLANIFICADO,
            }
        });
    }

    // Limpiar datos de prueba anteriores asociados a este evento para regenerar limpio
    await prisma.task.deleteMany({ where: { eventId: evento.id } });
    const dealIds = (await prisma.sponsorDeal.findMany({ where: { eventId: evento.id }, select: { sponsorId: true } })).map(d => d.sponsorId);
    await prisma.sponsorDeal.deleteMany({ where: { eventId: evento.id } });
    if (dealIds.length > 0) {
        await prisma.sponsor.deleteMany({ where: { id: { in: dealIds }, companyName: { contains: "(Test)" } } });
    }

    // 3. Tareas (simulando que el evento está en pre-producción)
    console.log("📋 Creando tareas de prueba...");
    const tasks = [
        { title: "Cerrar contrato principal del venue", status: TaskStatus.COMPLETADA, priority: TaskPriority.URGENTE, assigneeId: director.id, dueDate: new Date("2026-03-01") },
        { title: "Diseñar línea gráfica del evento", status: TaskStatus.EN_PROGRESO, priority: TaskPriority.ALTA, assigneeId: dbUsers[0].id, dueDate: new Date("2026-03-15") },
        { title: "Crear pauta para redes sociales", status: TaskStatus.PENDIENTE, priority: TaskPriority.MEDIA, assigneeId: dbUsers[0].id, dueDate: new Date("2026-03-20") },
        { title: "Aprobar presupuesto de marketing", status: TaskStatus.REVISION, priority: TaskPriority.ALTA, assigneeId: dbUsers[1].id, dueDate: new Date("2026-03-05") },
        { title: "Cotizar estructuras de tarima principal", status: TaskStatus.COMPLETADA, priority: TaskPriority.MEDIA, assigneeId: dbUsers[2].id, dueDate: new Date("2026-02-28") },
        { title: "Logística de transporte artistas intl.", status: TaskStatus.PENDIENTE, priority: TaskPriority.URGENTE, assigneeId: dbUsers[2].id, dueDate: new Date("2026-05-15") },
        { title: "Llamadas en frío a 50 auspiciantes locales", status: TaskStatus.EN_PROGRESO, priority: TaskPriority.ALTA, assigneeId: dbUsers[3].id, dueDate: new Date("2026-03-10") },
        { title: "Enviar propuesta comercial a Pepsi", status: TaskStatus.COMPLETADA, priority: TaskPriority.URGENTE, assigneeId: dbUsers[3].id, dueDate: new Date("2026-02-20") },
    ];

    for (const t of tasks) {
        await prisma.task.create({
            data: {
                title: t.title,
                status: t.status,
                priority: t.priority,
                eventId: evento.id,
                assigneeId: t.assigneeId,
                creatorId: adminId,
                dueDate: t.dueDate,
                evidenceRequired: t.status === TaskStatus.COMPLETADA,
            }
        });
    }

    // 4. Sponsors
    console.log("🏢 Creando sponsors de prueba...");
    const sponsors = [
        { name: "Pepsi (Test)", company: "PepsiCo", industry: "Bebidas", stage: SponsorStage.CERRADO, value: 15000 },
        { name: "Big Cola (Test)", company: "AjeGroup", industry: "Bebidas", stage: SponsorStage.PROPUESTA, value: 5000 },
        { name: "Banco Pichincha (Test)", company: "Banco Pichincha", industry: "Banca", stage: SponsorStage.REUNION, value: 12000 },
        { name: "Claro (Test)", company: "Conecel S.A.", industry: "Telecom", stage: SponsorStage.CONTACTADO, value: 8000 },
        { name: "Hyundai (Test)", company: "Neohyundai", industry: "Automotriz", stage: SponsorStage.PROSPECTO, value: null },
    ];

    for (const s of sponsors) {
        const sponsor = await prisma.sponsor.create({
            data: { companyName: s.name, industry: s.industry }
        });

        await prisma.sponsorDeal.create({
            data: {
                sponsorId: sponsor.id,
                eventId: evento.id,
                stage: s.stage,
                dealValue: s.value,
                notes: `Interesados en ser sponsor en categoría ${s.industry}`,
            }
        });
    }

    // 5. Proveedores y Pagos
    console.log("🔧 Creando proveedores simulados...");
    const supplier1 = await prisma.supplier.create({
        data: { companyName: "Sonido Pro Ecuador (Test)", category: "Audio e Iluminación", contactPhone: "+593999999991" }
    });
    const supplier2 = await prisma.supplier.create({
        data: { companyName: "Estructuras Gigantes S.A. (Test)", category: "Tarimas", contactPhone: "+593999999992" }
    });

    // Órdenes de prueba para los proveedores
    await prisma.supplierOrder.createMany({
        data: [
            { supplierId: supplier1.id, eventId: evento.id, description: "Alquiler 4 pantallas LED y Line Array", amount: 4500.00, status: "CONFIRMADO", dueDate: new Date("2026-07-08") },
            { supplierId: supplier2.id, eventId: evento.id, description: "Tarima principal 20x15m techada", amount: 8200.00, status: "PENDIENTE", dueDate: new Date("2026-07-07") },
        ]
    });

    // 6. Configurar Tickets
    console.log("🎟️ Generando tickets simulados...");
    await prisma.ticket.deleteMany({ where: { eventId: evento.id } }); // clean test tickets

    // Generamos un mix de tickets dummy 
    const createTickets = async (type: string, count: number, price: number) => {
        const batch = Array(count).fill(null).map((_, i) => ({
            eventId: evento.id,
            ticketCode: `TKT-${type}-${i}-${Date.now()}`,
            qrCode: `QR-TEST-${type}-${i}-${Date.now()}`,
            status: i % 5 === 0 ? "CHECKIN" : "PAGADO", // Enum TicketStatus
            buyerName: `Comprador Test ${i}`,
            buyerEmail: `comprador${i}@test.com`,
            ticketType: type,
            price: price
        }));
        await prisma.ticket.createMany({ data: batch });
    };

    await createTickets("GENERAL", 1200, 30);
    await createTickets("VIP", 350, 80);
    await createTickets("SOCIOS", 100, 0);
    await createTickets("AUSPICIANTES", 50, 0);

    // 7. Checklists e Incidentes
    console.log("📝 Generando checklists e incidencias...");
    await prisma.checklist.deleteMany({ where: { eventId: evento.id } });
    await prisma.incident.deleteMany({ where: { eventId: evento.id } });

    const cl = await prisma.checklist.create({
        data: { name: "Revisión de Seguridad (Test)", eventId: evento.id }
    });
    await prisma.checklistItem.createMany({
        data: [
            { checklistId: cl.id, label: "Verificar extintores", completed: true, order: 1 },
            { checklistId: cl.id, label: "Inspección de tarima", completed: true, order: 2 },
            { checklistId: cl.id, label: "Prueba de sonido", completed: false, order: 3 },
        ]
    });

    await prisma.incident.createMany({
        data: [
            { title: "Falla eléctrica en zona B", severity: "ALTA", eventId: evento.id, resolved: true, resolvedAt: new Date() },
            { title: "Proveedor retrasado 30 min", severity: "MEDIA", eventId: evento.id, resolved: false },
        ]
    });

    console.log("✅ ¡Semilla de datos cargada exitosamente!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
