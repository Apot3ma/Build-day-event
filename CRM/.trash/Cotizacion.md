---
tipo: cotizacion

id: COT-0001

estado: enviada

fecha_creacion: <% tp.date.now("YYYY-MM-DD HH:mm") %>

cliente:
  nombre: ""
  telefono: ""
  correo: ""

empresa: ""

productos:
  - nombre: ""
    cantidad: 0
    unidad: ""
    precio_unitario: 0

subtotal: 0
iva: 0
total: 0

moneda: MXN

vendedor: agente_ia

pdf: "[[COT-0001.pdf]]"

fecha_vencimiento:

seguimiento:
  requerido: true
  fecha: ""

---

# Cotización <% tp.file.title %>

## Cliente

- Nombre:
- Empresa:
- Teléfono:
- Correo:

---

## Productos cotizados

| Producto | Cantidad | Precio |
|---|---|---|
| | | |

---

## Observaciones

-

---

## Estado comercial

- [ ] Enviada
- [ ] Revisada
- [ ] Aprobada
- [ ] Rechazada

---

## Archivo PDF

[[COT-0001.pdf]]