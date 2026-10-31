import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { VentaService } from '../../../servicios/venta.service';
import { ProductoService } from '../../../servicios/producto.service';
import { AuthService } from '../../../servicios/auth.service';
import { validarTexto, validarNumero } from '../../../servicios/http-cliente';

export interface ResumenVentas {
  ventasHoy: number;
  totalDia: string;
  ivaAcumulado: string;
}

export interface Venta {
  folio: string;
  cliente: string;
  canal: string;
  total: string;
  iva: string;
  estadoFactura: string;
  claseEstado: string;
}

@Component({
  selector: 'app-ventas',
  styleUrl: './ventas.css',
  templateUrl: './ventas.html',
})
export class Ventas implements OnInit {
  protected readonly authService = inject(AuthService);
  private readonly ventaService = inject(VentaService);
  private readonly productoService = inject(ProductoService);
  private readonly cdr = inject(ChangeDetectorRef);

  // Resumen diario y listado de ventas realizadas
  resumen: ResumenVentas = {
    ventasHoy: 0,
    totalDia: '$0.00',
    ivaAcumulado: '$0.00'
  };

  ventas: Venta[] = [];
  productosLista: any[] = [];
  mostrarModal = false;
  cargando = false;
  errorMensaje = '';

  formNombreCliente = 'Público general';
  formProductoId: string = '';
  formCantidad: string = '';
  formPrecioUnitario: string = '';

  // Encargado de consultar y mostrar la factura XML de una venta
  mostrarModalFactura = false;
  facturaSeleccionada: any = null;

  ngOnInit(): void {
    this.cargarDatos();
  }

  esAdmin(): boolean {
    return this.authService.esAdmin();
  }

  cargarDatos(): void {
    if (this.esAdmin()) {
      this.ventaService.obtenerResumen((error, datos) => {
        if (!error && datos) {
          this.resumen = datos;
          this.cdr.detectChanges();
        }
      });
    }

    const propioId = this.esAdmin() ? undefined : (this.authService.obtenerUsuarioId() ?? undefined);
    this.ventaService.obtenerVentas((error, datos) => {
      if (!error && datos) {
        this.ventas = datos;
        this.cdr.detectChanges();
      }
    }, propioId);

    if (this.esAdmin()) {
      this.productoService.obtenerProductos((error, datos) => {
        if (!error && datos) {
          this.productosLista = datos;
          this.cdr.detectChanges();
        }
      });
    }
  }

  abrirModal(): void {
    this.formNombreCliente = 'Público general';
    this.formProductoId = '';
    this.formCantidad = '';
    this.formPrecioUnitario = '';
    this.errorMensaje = '';
    this.cargando = false;
    this.mostrarModal = true;
    this.cdr.detectChanges();
  }

  cerrarModal(): void {
    if (this.cargando) return;
    this.mostrarModal = false;
    this.cdr.detectChanges();
  }

  verFactura(item: Venta): void {
    const clienteId = this.esAdmin() ? undefined : this.authService.obtenerUsuarioId();
    this.ventaService.obtenerFactura(Number(item.folio), (error, datos) => {
      if (error || !datos) {
        alert('No se encontró la factura XML para este folio');
        return;
      }
      this.facturaSeleccionada = datos;
      this.mostrarModalFactura = true;
      this.cdr.detectChanges();
    }, clienteId);
  }

  cerrarModalFactura(): void {
    this.mostrarModalFactura = false;
    this.facturaSeleccionada = null;
    this.cdr.detectChanges();
  }

  // Descarga del archivo XML comercial (CFDI 4.0) (RQF30)
  descargarXML(): void {
    if (!this.facturaSeleccionada || !this.facturaSeleccionada.archivo_xml) {
      alert('No hay archivo XML disponible para descargar');
      return;
    }

    const contenido = this.facturaSeleccionada.archivo_xml;
    const blob = new Blob([contenido], { type: 'application/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const folio = this.facturaSeleccionada.id
      || this.facturaSeleccionada.folio
      || this.facturaSeleccionada.venta_id
      || 'CFDI';
    a.download = `Factura-Folio-${folio}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  guardarVenta(): void {
    if (this.cargando) return;

    const errCliente = validarTexto(this.formNombreCliente, 50);
    if (errCliente) {
      this.errorMensaje = `Cliente: ${errCliente}`;
      return;
    }

    if (!this.formProductoId) {
      this.errorMensaje = 'Debe seleccionar un producto';
      return;
    }

    const errCant = validarNumero(this.formCantidad, true);
    if (errCant) {
      this.errorMensaje = `Cantidad: ${errCant}`;
      return;
    }

    const errPrecio = validarNumero(this.formPrecioUnitario);
    if (errPrecio) {
      this.errorMensaje = `Precio unitario: ${errPrecio}`;
      return;
    }

    this.errorMensaje = '';
    this.cargando = true;

    this.ventaService.crearVenta({
      nombre_cliente: this.formNombreCliente.trim(),
      detalle: [{
        producto_id: Number(this.formProductoId),
        cantidad: Number(this.formCantidad),
        precio_unitario: Number(this.formPrecioUnitario)
      }]
    }, (error) => {
      this.cargando = false;
      if (error) {
        console.error('Error al crear venta:', error);
        this.errorMensaje = error.mensaje || 'Error al registrar venta';
        this.cdr.detectChanges();
        return;
      }
      this.mostrarModal = false;
      this.cargarDatos();
    });
  }
}