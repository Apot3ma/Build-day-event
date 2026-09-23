import { Router } from "express";

const router = Router();



router.post('/', async (req, res) => {
    const pool = req.app.locals.pool;
    const { numeroCelular, usuario, correo, contrasena } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO usuarios (numero_de_celular, usuario, correo, contrasena) VALUES (?, ?, ?, ?)',
            [numeroCelular, usuario, correo, contrasena]
        );
        res.status(201).json({ numeroCelular, usuario, correo });
    } catch (err) {
        res.status(500).json({ error: 'Error al crear el usuario', details: err.message });
    }
});

router.get('/:usuario/:contrasena', async (req, res) => {
    const pool = req.app.locals.pool;
    const { usuario, contrasena } = req.params;
    try {
        const [rows] = await pool.query(
            'SELECT numero_de_celular, usuario, correo FROM usuarios WHERE usuario = ? AND contrasena = ?',
            [usuario, contrasena]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Contraseña o usuario erróneo' });
        }
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener el usuario', details: err.message });
    }
});

router.put('/:numeroCelular', async (req, res) => {
    const pool = req.app.locals.pool;
    const { numeroCelular } = req.params;
    const { usuario, correo, contrasena } = req.body;
    try {
        const [result] = await pool.query(
            'UPDATE usuarios SET usuario = ?, correo = ?, contrasena = ? WHERE numero_de_celular = ?',
            [usuario, correo, contrasena, numeroCelular]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        } else {
            res.json({ message: 'Usuario actualizado' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Error al actualizar el usuario', details: err.message });
    }
});

router.delete('/:numeroCelular', async (req, res) => {
    const pool = req.app.locals.pool;
    const { numeroCelular } = req.params;
    try {
        const [result] = await pool.query(
            'DELETE FROM usuarios WHERE numero_de_celular = ?',
            [numeroCelular]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        } else {
            res.json({ message: 'Usuario eliminado' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Error al eliminar el usuario', details: err.message });
    }
});

export default router;