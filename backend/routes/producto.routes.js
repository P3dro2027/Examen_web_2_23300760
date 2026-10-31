const express = require('express');
const router = express.Router();
const productoService = require('../services/producto.service');
const { exigirSesion, soloPara } = require('../middleware/auth');

// Consulta el catálogo público de productos.
router.get('/', (req, res) => {
    productoService.obtenerProductos((error, productos) => {
        if (error) {
            return res.status(500).json({ mensaje: 'Error al consultar productos' });
        }
        res.json(productos);
    });
});

function validarTexto(str, max = 255) {
    if (!str || typeof str !== 'string' || !str.trim()) return 'El campo no puede estar vacío';
    if (str.trim().length > max) return `El texto no debe exceder ${max} caracteres`;
    if (/[<>;]|\-\-/.test(str)) return 'Carácter prohibido no permitido (<, >, ;, --)';
    return null;
}

function validarNumero(num) {
    const val = Number(num);
    if (num === undefined || num === null || isNaN(val) || val < 0) return 'Número inválido';
    return null;
}

// Crea un producto; solo el administrador puede modificar el catálogo.
router.post('/', exigirSesion, soloPara('administrador'), (req, res) => {
    const { nombre, categoria, precio } = req.body;
    const errNombre = validarTexto(nombre, 50);
    if (errNombre) return res.status(400).json({ mensaje: `Nombre: ${errNombre}` });

    const errCat = validarTexto(categoria, 50);
    if (errCat) return res.status(400).json({ mensaje: `Categoría: ${errCat}` });

    const errPrecio = validarNumero(precio);
    if (errPrecio) return res.status(400).json({ mensaje: 'Precio numérico inválido' });

    productoService.agregarProducto(req.body, (error, producto) => {
        if (error) {
            return res.status(500).json({ mensaje: 'Error al agregar producto' });
        }
        res.status(201).json(producto);
    });
});

// Actualiza los datos de un producto existente.
router.put('/:id', exigirSesion, soloPara('administrador'), (req, res) => {
    productoService.editarProducto(req.params.id, req.body, (error, producto) => {
        if (error) {
            return res.status(500).json({ mensaje: 'Error al editar producto' });
        }
        res.json(producto);
    });
});

// Elimina un producto del catálogo.
router.delete('/:id', exigirSesion, soloPara('administrador'), (req, res) => {
    productoService.eliminarProducto(req.params.id, (error, resultado) => {
        if (error) {
            return res.status(500).json({ mensaje: 'Error al eliminar producto' });
        }
        res.json(resultado);
    });
});

module.exports = router;
