import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ProductoService } from '../../../servicios/producto.service';
import { DistribuidorService } from '../../../servicios/distribuidor.service';
import { validarTexto, validarNumero } from '../../../servicios/http-cliente';

interface Distribuidor {
  id: number;
  nombre: string;
}

export interface ProductoInventario {
  id: number;
  nombre: string;
  categoria: string;
  cantidad: string;
  precio: string;
  imagen?: string;
  estado: string;
  claseEstado: string;
}

@Component({
  imports: [],
  selector: 'app-inventario',
  styleUrl: './inventario.css',
  templateUrl: './inventario.html',
})
export class Inventario implements OnInit {
  // Productos en inventario y estado del modal
  productos: ProductoInventario[] = [];
  distribuidores: Distribuidor[] = [];
  mostrarModal = false;
  mostrarModalDistribuidor = false;
  cargando = false;
  cargandoDistribuidor = false;
  errorMensaje = '';
  errorDistribuidor = '';
  productoEditandoId: number | null = null;
  distribuidorEditandoId: number | null = null;

  formNombre = '';
  formCategoria = '';
  formPrecio: string = '';
  formCantidad: string = '';
  formImagen = '';
  formNombreDistribuidor = '';

  constructor(
    private productoService: ProductoService,
    private distribuidorService: DistribuidorService,
    private cdr: ChangeDetectorRef
  ) {}

  // Encargado de cargar la lista de productos al iniciar
  ngOnInit(): void {
    this.cargarProductos();
    this.cargarDistribuidores();
  }

  cargarDistribuidores(): void {
    this.distribuidorService.obtenerDistribuidores((error, datos) => {
      if (error) {
        console.error('Error al obtener distribuidores:', error);
        this.errorDistribuidor = error.mensaje || 'No se pudieron cargar los distribuidores';
      } else {
        this.distribuidores = Array.isArray(datos) ? datos : [];
      }
      this.cdr.detectChanges();
    });
  }

  cargarProductos(): void {
    this.productoService.obtenerProductos((error, datos) => {
      if (error) {
        console.error('Error al obtener productos:', error);
        return;
      }
      this.productos = datos || [];
      this.cdr.detectChanges();
    });
  }

  esAdmin(): boolean {
    return localStorage.getItem('rol') === 'administrador';
  }

  // Encargado de abrir y cerrar la ventana emergente
  abrirModal(): void {
    this.productoEditandoId = null;
    this.formNombre = '';
    this.formCategoria = '';
    this.formPrecio = '';
    this.formCantidad = '';
    this.formImagen = '';
    this.errorMensaje = '';
    this.cargando = false;
    this.mostrarModal = true;
    this.cdr.detectChanges();
  }

  editarProducto(producto: ProductoInventario): void {
    this.productoEditandoId = producto.id;
    this.formNombre = producto.nombre;
    this.formCategoria = producto.categoria;
    this.formPrecio = producto.precio;
    this.formCantidad = producto.cantidad;
    this.formImagen = producto.imagen || '';
    this.errorMensaje = '';
    this.cargando = false;
    this.mostrarModal = true;
    this.cdr.detectChanges();
  }

  eliminarProducto(producto: ProductoInventario): void {
    if (!window.confirm(`¿Eliminar "${producto.nombre}" del inventario?`)) {
      return;
    }

    this.cargando = true;
    this.productoService.eliminarProducto(producto.id, error => {
      this.cargando = false;
      if (error) {
        console.error('Error al eliminar producto:', error);
        this.errorMensaje = error.mensaje || 'Error al eliminar producto';
        this.cdr.detectChanges();
        return;
      }
      this.productos = this.productos.filter(item => item.id !== producto.id);
      this.cdr.detectChanges();
    });
  }

  cerrarModal(): void {
    if (this.cargando) return;
    this.mostrarModal = false;
    this.cdr.detectChanges();
  }

  abrirModalDistribuidor(): void {
    this.distribuidorEditandoId = null;
    this.formNombreDistribuidor = '';
    this.errorDistribuidor = '';
    this.mostrarModalDistribuidor = true;
  }

  editarDistribuidor(distribuidor: Distribuidor): void {
    this.distribuidorEditandoId = distribuidor.id;
    this.formNombreDistribuidor = distribuidor.nombre;
    this.errorDistribuidor = '';
    this.mostrarModalDistribuidor = true;
  }

  cerrarModalDistribuidor(): void {
    if (!this.cargandoDistribuidor) this.mostrarModalDistribuidor = false;
  }

  eliminarDistribuidor(distribuidor: Distribuidor): void {
    if (!window.confirm(`¿Eliminar "${distribuidor.nombre}"?`)) return;

    this.cargandoDistribuidor = true;
    this.distribuidorService.eliminarDistribuidor(distribuidor.id, error => {
      this.cargandoDistribuidor = false;
      if (error) {
        this.errorDistribuidor = error.mensaje || 'No se pudo eliminar el distribuidor';
      } else {
        this.distribuidores = this.distribuidores.filter(item => item.id !== distribuidor.id);
      }
      this.cdr.detectChanges();
    });
  }

  guardarDistribuidor(): void {
    const errorNombre = validarTexto(this.formNombreDistribuidor, 100);
    if (errorNombre) {
      this.errorDistribuidor = `Nombre: ${errorNombre}`;
      return;
    }

    this.cargandoDistribuidor = true;
    const datos = { nombre: this.formNombreDistribuidor.trim() };
    const finalizar = (error: any): void => {
      this.cargandoDistribuidor = false;
      if (error) {
        this.errorDistribuidor = error.mensaje || 'No se pudo guardar el distribuidor';
      } else {
        this.mostrarModalDistribuidor = false;
        this.cargarDistribuidores();
      }
      this.cdr.detectChanges();
    };

    if (this.distribuidorEditandoId === null) {
      this.distribuidorService.agregarDistribuidor(datos, finalizar);
    } else {
      this.distribuidorService.editarDistribuidor(this.distribuidorEditandoId, datos, finalizar);
    }
  }

  // Encargado de cargar foto directamente desde la computadora
  seleccionarFoto(event: any): void {
    const archivo = event.target.files && event.target.files[0];
    if (archivo) {
      const lector = new FileReader();
      lector.onload = () => {
        this.formImagen = lector.result as string;
        this.cdr.detectChanges();
      };
      lector.readAsDataURL(archivo);
    }
  }

  // Encargado de validar y guardar un nuevo producto
  guardarProducto(): void {
    if (this.cargando) return;

    const errNombre = validarTexto(this.formNombre, 50);
    if (errNombre) {
      this.errorMensaje = `Nombre: ${errNombre}`;
      return;
    }

    const errCat = validarTexto(this.formCategoria, 50);
    if (errCat) {
      this.errorMensaje = `Categoría: ${errCat}`;
      return;
    }

    const errPrecio = validarNumero(this.formPrecio);
    if (errPrecio) {
      this.errorMensaje = `Precio: ${errPrecio}`;
      return;
    }

    const errCantidad = validarNumero(this.formCantidad, true);
    if (errCantidad) {
      this.errorMensaje = `Cantidad: ${errCantidad}`;
      return;
    }

    this.errorMensaje = '';
    this.cargando = true;

    const datosProducto = {
      nombre: this.formNombre.trim(),
      categoria: this.formCategoria.trim(),
      precio: Number(this.formPrecio),
      cantidad: Number(this.formCantidad),
      imagen: this.formImagen
    };

    const finalizarGuardado = (error: any): void => {
      this.cargando = false;
      if (error) {
        console.error('Error al guardar producto:', error);
        this.errorMensaje = error.mensaje || 'Error al guardar producto';
        this.cdr.detectChanges();
        return;
      }
      this.mostrarModal = false;
      this.cargarProductos();
    };

    if (this.productoEditandoId === null) {
      this.productoService.agregarProducto(datosProducto, finalizarGuardado);
    } else {
      this.productoService.editarProducto(this.productoEditandoId, datosProducto, finalizarGuardado);
    }
  }
}
