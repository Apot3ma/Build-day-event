import { Router } from "express";

const router = Router();

router.post('/', async (req, res) => {
    const pool = req.app.locals.pool;
    const { nombre, visualizaciones } = req.body;
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    try {
        const [result] = await pool.query(
            'INSERT INTO producto (nombre, visualizaciones, date) VALUES (?, ?, ?)',
            [nombre, visualizaciones ?? 0, date]
        );
        res.status(201).json({ id: result.insertId, nombre, visualizaciones, date });
    } catch (err) {
        res.status(500).json({ error: 'Error al crear el producto', details: err.message });
    }
});

router.get('/', async (req, res) => {
    const pool = req.app.locals.pool;
    try {
        const [rows] = await pool.query(
            'SELECT idproducto, nombre, visualizaciones, date FROM producto'
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'No hay productos' });
        }
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener los productos', details: err.message });
    }
});

router.get('/:idproducto', async (req, res) => {
    const pool = req.app.locals.pool;
    const { idproducto } = req.params;
    try {
        const [rows] = await pool.query(
            'SELECT idproducto, nombre, visualizaciones, date FROM producto WHERE idproducto = ?',
            [idproducto]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener el producto', details: err.message });
    }
});

// ✅ Endpoint especial: incrementa visualizaciones del día de hoy por nombre
// Si no existe un registro de hoy, crea uno nuevo con visualizaciones = 1
router.patch('/visualizaciones/:nombre', async (req, res) => {
    const pool = req.app.locals.pool;
    const { nombre } = req.params;
    const hoy = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    try {
        // Buscar si ya existe un registro del producto con fecha de hoy
        const [rows] = await pool.query(
            'SELECT idproducto, visualizaciones FROM producto WHERE nombre = ? AND date = ?',
            [nombre, hoy]
        );

        if (rows.length === 0) {
            // No existe registro de hoy → crear uno nuevo
            const [result] = await pool.query(
                'INSERT INTO producto (nombre, visualizaciones, date) VALUES (?, ?, ?)',
                [nombre, 1, hoy]
            );
            return res.status(201).json({
                message: `Registro de hoy creado para "${nombre}"`,
                idproducto: result.insertId,
                visualizaciones: 1,
                date: hoy
            });
        }

        // Ya existe → incrementar en 1
        const { idproducto, visualizaciones } = rows[0];
        await pool.query(
            'UPDATE producto SET visualizaciones = visualizaciones + 1 WHERE idproducto = ?',
            [idproducto]
        );
        res.json({
            message: `Visualizaciones actualizadas para "${nombre}"`,
            idproducto,
            visualizaciones: visualizaciones + 1,
            date: hoy
        });
    } catch (err) {
        res.status(500).json({ error: 'Error al actualizar visualizaciones', details: err.message });
    }
});

router.put('/:idproducto', async (req, res) => {
    const pool = req.app.locals.pool;
    const { idproducto } = req.params;
    const { nombre, visualizaciones, date } = req.body;
    try {
        const [result] = await pool.query(
            'UPDATE producto SET nombre = ?, visualizaciones = ?, date = ? WHERE idproducto = ?',
            [nombre, visualizaciones, date, idproducto]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        } else {
            res.json({ message: 'Producto actualizado' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Error al actualizar el producto', details: err.message });
    }
});

router.delete('/:idproducto', async (req, res) => {
    const pool = req.app.locals.pool;
    const { idproducto } = req.params;
    try {
        const [result] = await pool.query(
            'DELETE FROM producto WHERE idproducto = ?',
            [idproducto]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        } else {
            res.json({ message: 'Producto eliminado' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Error al eliminar el producto', details: err.message });
    }
});

export default router;