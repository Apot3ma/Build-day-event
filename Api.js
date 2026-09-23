import pkg from "whatsapp-web.js";
const { Client, LocalAuth, MessageMedia, Poll } = pkg;
import qrcode from "qrcode-terminal";
import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";
import pool from "./Conexion.js";

// ─── Importar rutas ───────────────────────────────────────────────────────────
import usuariosRouter   from "./FrontApi/usuarios.js";
import mensajesRouter   from "./FrontApi/mensajes.js";
import visibilidad      from "./FrontApi/visibilidad.js";
import cotizacionRouter from "./FrontApi/Cotizacion.js";

// ─── Inicializar ──────────────────────────────────────────────────────────────
const app    = express();
const genAI  = new GoogleGenerativeAI("AIzaSyBPpilqePyu8EWg7YyCRKyg4OSlrNCioSQ");

const NUMERO_ADMIN = "5216682272112@c.us";
const sesiones     = {};

// ─── WhatsApp Client ──────────────────────────────────────────────────────────
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
});

client.on("qr", (qr) => {
    console.log("Escanea este QR con tu WhatsApp:");
    qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
    console.log("¡Bot conectado y listo para operar!");
});

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

// ─── Middlewares ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Compartir pool y client con todas las rutas
app.use((req, res, next) => {
    req.app.locals.pool    = pool;
    req.app.locals.client  = client;
    req.app.locals.sesiones = sesiones;
    next();
});

// ─── Endpoint WhatsApp ────────────────────────────────────────────────────────
// Función helper para obtener el WID correcto (LID o fallback a @c.us)
async function resolverDestinatario(telefono) {
    const numeroFormateado = `${telefono}@c.us`;
    
    try {
        const resultado = await client.pupPage.evaluate(async (numero) => {
            try {
                // Intentar obtener el LID desde el store de contactos
                const wid = window.Store.WidFactory.createWid(numero);
                const contact = await window.Store.Contact.findFirst({ id: wid });
                
                if (contact?.lid?._serialized) {
                    return contact.lid._serialized;
                }

                // Si no está en caché, hacer lookup en el servidor
                const result = await window.Store.QueryExist(numero);
                if (result?.wid?._serialized) {
                    return result.wid._serialized;
                }

                return null;
            } catch (e) {
                return null;
            }
        }, numeroFormateado);

        return resultado || numeroFormateado;
    } catch (e) {
        return numeroFormateado;
    }
}

app.post("/enviar-cotizacion", async (req, res) => {
    const { telefono, urlPdf, datosCotizacion } = req.body;

    if (!telefono || !urlPdf) {
        return res.status(400).json({ error: "Falta teléfono o URL" });
    }

    try {
        const destinatario = await resolverDestinatario(telefono);
        console.log("Enviando a:", destinatario);

        const media = MessageMedia.fromFilePath(urlPdf);
        const msgMedia = await client.sendMessage(destinatario, media, {
            caption: "Hola, aquí tienes la cotización solicitada.",
        });

        console.log("msgMedia:", JSON.stringify(msgMedia));

        if (!msgMedia) {
            return res.status(500).json({ 
                error: "sendMessage retornó null — el chat no pudo resolverse",
                destinatario 
            });
        }

        const encuesta = new Poll(
            "¿Deseas concretar la compra de esta cotización?",
            ["Sí", "No"],
            { allowMultipleAnswers: false }
        );
        const msgEncuesta = await client.sendMessage(destinatario, encuesta);

        console.log("msgEncuesta:", JSON.stringify(msgEncuesta));

        if (!msgEncuesta?.id?._serialized) {
            return res.status(500).json({ 
                error: "Poll enviado pero sin ID — revisar logs",
                destinatario 
            });
        }

        sesiones[destinatario] = {
            fase:            "ESPERANDO_VOTO",
            pollId:          msgEncuesta.id._serialized,
            historial:       [],
            datosCotizacion: datosCotizacion || "Datos no especificados",
            timeoutId:       null,
        };

        res.status(200).json({ success: true, message: "PDF y encuesta enviados", destinatario });
    } catch (error) {
        console.error("Error completo:", error);
        res.status(500).json({ error: "Error al enviar la cotización", details: error.message });
    }
});

// ─── Rutas API ────────────────────────────────────────────────────────────────
app.use("/api/usuarios",    usuariosRouter);
app.use("/api/mensajes",    mensajesRouter);
app.use("/api/cotizacion",  cotizacionRouter);
app.use("/api/visibilidad", visibilidad);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
    res.json({ status: "OK", message: "API AgroSoluciones corriendo" });
});

// ─── Ruta no encontrada ───────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: `Ruta ${req.method} ${req.originalUrl} no encontrada` });
});

// ─── Eventos WhatsApp ─────────────────────────────────────────────────────────
client.on("vote_update", async (vote) => {
    console.log("=== VOTE UPDATE ===");
    console.log("pollIdVotado:", vote.parentMessage?.id?._serialized);
    console.log("voter:", vote.voter);
    console.log("selectedOptions:", vote.selectedOptions);
    console.log("Sesiones activas:", JSON.stringify(Object.entries(sesiones).map(([k,v]) => ({ key: k, pollId: v.pollId, fase: v.fase }))));
    console.log("===================");

    const pollIdVotado = vote.parentMessage?.id?._serialized;
    if (!pollIdVotado) return;

    let numeroVotante = null;
    let sesion        = null;

    // Buscar por pollId exacto
    for (const [numero, datosSesion] of Object.entries(sesiones)) {
        if (datosSesion.pollId === pollIdVotado) {
            numeroVotante = numero;
            sesion        = datosSesion;
            break;
        }
    }

    // Si no encontró, buscar comparando solo la parte del ID (sin prefijo)
    if (!sesion) {
        const pollIdCorto = pollIdVotado.split("_").slice(-1)[0];
        for (const [numero, datosSesion] of Object.entries(sesiones)) {
            if (datosSesion.pollId?.includes(pollIdCorto)) {
                numeroVotante = numero;
                sesion        = datosSesion;
                break;
            }
        }
    }

    

    if (!sesion || sesion.fase !== "ESPERANDO_VOTO") {
        console.log("Sesión no encontrada o fase incorrecta:", sesion?.fase);
        return;
    }
    if (vote.selectedOptions.length === 0) return;


    const respuesta = vote.selectedOptions[0].name;
    console.log("Respuesta:", respuesta, "| Votante:", numeroVotante);

    if (respuesta === "Sí") {
        sesion.fase = "CONCRETADA";
        await client.sendMessage(numeroVotante, "¡Excelente! Estamos procesando tu solicitud.");

        try {
            const fechaAceptacion = new Date().toLocaleString("es-MX");
            const prompt = `Actúa como un asistente de ventas. El usuario con número ${numeroVotante} acaba de aceptar una cotización el ${fechaAceptacion}.
            Los datos de la cotización que aceptó son: ${JSON.stringify(sesion.datosCotizacion)}.
            Historial de chat previo: ${JSON.stringify(sesion.historial)}.
            Genera un resumen muy breve y directo (máximo 4 líneas) para el administrador de ventas.
            Debes incluir: qué usuario es, qué productos/servicios aceptó (con cantidades y precios si están disponibles), y la fecha y hora de aceptación. No uses saludos largos.`;

            const model           = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const resultadoIA     = await model.generateContent(prompt);
            const resumenGenerado = resultadoIA.response.text();

            await client.sendMessage(NUMERO_ADMIN, `*✅ VENTA CONCRETADA*\n\n${resumenGenerado}`);
        } catch (error) {
            console.error("Error al generar resumen con IA:", error);
            await client.sendMessage(NUMERO_ADMIN,
                `*✅ VENTA CONCRETADA*\nUsuario: ${numeroVotante}\n(Nota: Hubo un error al generar el resumen detallado con IA).`
            );
        }

        delete sesiones[numeroVotante];

    } else if (respuesta === "No") {
        sesion.fase        = "ESPERANDO_FEEDBACK";
        sesion.lidAsociado = vote.voter;

        await client.sendMessage(
            numeroVotante,
            "Lamentamos su decisión, ¿Le importaría decirnos el porqué de su decisión? Su opinión nos ayuda a mejorar."
        );

        sesion.timeoutId = setTimeout(async () => {
            if (sesiones[numeroVotante]?.fase === "ESPERANDO_FEEDBACK") {
                delete sesiones[numeroVotante];
            }
        }, 3600000);
    }
});

client.on("message_create", async (msg) => {
    if (msg.fromMe) return;

    let claveGuardada = null;
    let sesion        = null;

    for (const [clave, datos] of Object.entries(sesiones)) {
        if (datos.lidAsociado === msg.from) {
            claveGuardada = clave;
            sesion        = datos;
            break;
        }

        const claveNormalizada    = clave.split("@")[0].replace(/^521/, "52");
        const entranteNormalizado = msg.from.split("@")[0].replace(/^521/, "52");
        if (claveNormalizada === entranteNormalizado) {
            claveGuardada = clave;
            sesion        = datos;
            break;
        }
    }

    if (sesion && sesion.fase === "ESPERANDO_FEEDBACK") {
        if (sesion.timeoutId) clearTimeout(sesion.timeoutId);

        const retroalimentacion = msg.body;

        await client.sendMessage(msg.from, "Muchas gracias por sus comentarios. Que tenga un excelente día.");

        try {
            const prompt = `Actúa como analista de ventas. El usuario ha rechazado una cotización y al preguntarle el motivo respondió esto: "${retroalimentacion}".
            Genera un resumen claro y directo para el administrador indicando el motivo principal del rechazo. Dame 3 propuestas concisas que le puedo dar al usuario para intentar concretar la venta, mantente en un limite razonable.
            No incluyas más texto del necesario, responde solo con lo solicitado, no presentaciones ni explicaciones adicionales.`;

            const model        = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const resultadoIA  = await model.generateContent(prompt);
            const resumenRechazo = resultadoIA.response.text();

            await client.sendMessage(NUMERO_ADMIN, `*❌ VENTA NO CONCRETADA*\n\n${resumenRechazo}`);
        } catch (error) {
            console.error("Error al generar resumen de rechazo con IA:", error);
            await client.sendMessage(NUMERO_ADMIN,
                `*❌ VENTA NO CONCRETADA*\nUsuario: ${claveGuardada}\nMotivo (literal): "${retroalimentacion}"`
            );
        }

        delete sesiones[claveGuardada];

    } else if (sesion) {
        sesion.historial.push({ rol: "usuario", texto: msg.body });
    }
});

// ─── Arranque ─────────────────────────────────────────────────────────────────
client.initialize();

app.listen(3000, "0.0.0.0", () => {
    console.log("🚀 Servidor corriendo en http://localhost:3000");
});

export default app;