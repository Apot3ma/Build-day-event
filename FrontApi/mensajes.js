import { Router } from "express";

const router = Router();

router.post('/', async (req, res) => {
    const pool = req.app.locals.pool;
    const { numeroCelular, mensaje } = req.body;
    const fecha = new Date();
    try {
        const [result] = await pool.query(
            'INSERT INTO mensajes (numero_de_celular, mensaje, fecha) VALUES (?, ?, ?)',
            [numeroCelular, mensaje, fecha]
        );
        res.status(201).json({ id: result.insertId, numeroCelular, mensaje, fecha });
    } catch (err) {
        res.status(500).json({ error: 'Error al crear el mensaje', details: err.message });
    }
});

router.get('/', async (req, res) => {
    const pool = req.app.locals.pool;
    try {
        const [rows] = await pool.query(
            'SELECT idMensajes, numero_de_celular, mensaje, fecha FROM mensajes'
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'No hay mensajes' });
        }
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener los mensajes', details: err.message });
    }
});

// Obtener todos los mensajes de un número de celular específico
router.get('/:numeroCelular', async (req, res) => {
    const pool = req.app.locals.pool;
    const { numeroCelular } = req.params;
    try {
        const [rows] = await pool.query(
            'SELECT idMensajes, numero_de_celular, mensaje, fecha FROM mensajes WHERE numero_de_celular = ?',
            [numeroCelular]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'No se encontraron mensajes para este número' });
        }
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener los mensajes', details: err.message });
    }
});

router.put('/:idMensajes', async (req, res) => {
    const pool = req.app.locals.pool;
    const { idMensajes } = req.params;
    const { mensaje } = req.body;
    try {
        const [result] = await pool.query(
            'UPDATE mensajes SET mensaje = ? WHERE idMensajes = ?',
            [mensaje, idMensajes]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Mensaje no encontrado' });
        } else {
            res.json({ message: 'Mensaje actualizado' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Error al actualizar el mensaje', details: err.message });
    }
});

router.delete('/:idMensajes', async (req, res) => {
    const pool = req.app.locals.pool;
    const { idMensajes } = req.params;
    try {
        const [result] = await pool.query(
            'DELETE FROM mensajes WHERE idMensajes = ?',
            [idMensajes]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Mensaje no encontrado' });
        } else {
            res.json({ message: 'Mensaje eliminado' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Error al eliminar el mensaje', details: err.message });
    }
});

export default router;