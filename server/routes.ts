import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import path from "path";
import { fileURLToPath } from "url";

// Importar as rotas existentes do sistema de autenticação
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function registerRoutes(app: Express): Promise<Server> {
  // Importar dinamicamente as rotas do Node.js existentes
  try {
    // Rota de health check
    app.get("/health", (req, res) => {
      res.status(200).json({ status: "ok", message: "Servidor funcionando!" });
    });

    // Importar e registrar rotas de autenticação
    const authRoutes = await import("../routes/auth.js");
    const userRoutes = await import("../routes/users.js");
    const indexRoutes = await import("../routes/index.js");
    const serviceRoutes = await import("../routes/services.js");
    const businessHourRoutes = await import("../routes/businessHours.js");
    const availabilityRoutes = await import("../routes/availability.js");
    const appointmentRoutes = await import("../routes/appointments.js");
    const reportRoutes = await import("../routes/reports.js");
    const v1Routes = await import("../routes/v1/index.js");

    // Registrar todas as rotas com prefixo /api
    app.use("/api", indexRoutes.default);
    app.use("/api/auth", authRoutes.default);
    app.use("/api/users", userRoutes.default);
    app.use("/api/services", serviceRoutes.default);
    app.use("/api/business-hours", businessHourRoutes.default);
    app.use("/api/availability", availabilityRoutes.default);
    app.use("/api/appointments", appointmentRoutes.default);
    app.use("/api/reports", reportRoutes.default);
    app.use("/api/v1", v1Routes.default);

    console.log("✅ Todas as rotas da API registradas com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao registrar rotas:", error);
  }

  const httpServer = createServer(app);

  return httpServer;
}
