import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CarritoService } from '../../../servicios/carrito.service';
import { ProductoService } from '../../../servicios/producto.service';
import { AuthService } from '../../../servicios/auth.service';
import { PaypalService } from '../../../servicios/paypal.service';
import { LegalService } from '../../../servicios/legal.service';
import { validarTexto, validarCorreo } from '../../../servicios/http-cliente';

const RFC_REGEX = /^[A-ZÑ&]{3,4}\d{6}[A-Z\d]{3}$/;

@Component({
  selector: 'app-carrito',
  templateUrl: './carrito.html',
  styleUrl: './carrito.css'
})
export class Carrito implements OnInit {
  // Lista de productos del catálogo y estado del carrito
  productos: any[] = [];
  filtroTexto = '';
  cargando = false;

  mostrarCheckout = false;
  procesandoPago = false;
  errorMensaje = '';

  // Respuesta de la compra con PayPal
  estadoPago: 'NINGUNO' | 'APROBADO' | 'RECHAZADO' = 'NINGUNO';
  mensajeResultado = '';
  folioVenta: string | number | null = null;
  correoEnviado = false;

  // Datos para la orden, facturación y entrega
  nombreCliente = '';
  rfcCliente = 'XAXX010101000';
  correoCliente = '';
  telefonoCliente = '';
  direccionEntrega = 'Entrega en tienda';
  aceptoTerminos = false;

  cantidades: { [id: number]: number } = {};

  constructor(
    public carritoService: CarritoService,
    public legalService: LegalService,
    private productoService: ProductoService,
    private authService: AuthService,
    private paypalService: PaypalService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarCatalogo();
    this.nombreCliente = this.authService.obtenerNombre();
    const correoGuardado = localStorage.getItem('usuarioCorreo');
    if (correoGuardado) {
      this.correoCliente = correoGuardado;
    }

    // Comprobar si PayPal regresa con el token de orden aprobada
    const orderID = this.route.snapshot.queryParamMap.get('token');
    const pagoCancelado = this.route.snapshot.queryParamMap.get('cancel');

    if (pagoCancelado) {
      this.errorMensaje = 'El pago fue cancelado en PayPal.';
      this.mostrarCheckout = true;
    } else if (orderID) {
      const datosGuardados = sessionStorage.getItem('paypal_datos_venta');
      sessionStorage.removeItem('paypal_datos_venta');
      this.mostrarCheckout = true;
      this.procesandoPago = true;
      this.router.navigate([], { queryParams: {}, replaceUrl: true });
      this.capturarPago(orderID, datosGuardados ? JSON.parse(datosGuardados) : null);
    }
  }

  cargarCatalogo(): void {
    this.cargando = true;
    this.productoService.obtenerProductos((error, datos) => {
      this.cargando = false;
      if (!error && Array.isArray(datos)) {
        this.productos = datos.map(p => ({
          ...p,
          precio: Number(p.precio ?? 0),
          cantidad: Number(p.cantidad ?? 0)
        }));
        for (const p of this.productos) {
          if (!this.cantidades[p.id]) {
            this.cantidades[p.id] = 1;
          }
        }
      }
      this.cdr.detectChanges();
    });
  }

  formatoMoneda(val: any): string {
    const num = Number(val || 0);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  }

  productosFiltrados(): any[] {
    const texto = this.filtroTexto.toLowerCase().trim();
    if (!texto) return this.productos;
    return this.productos.filter(p =>
      (p.nombre || '').toLowerCase().includes(texto) ||
      (p.categoria || '').toLowerCase().includes(texto)
    );
  }

  actualizarCantidadDirecta(productoId: number, event: any): void {
    const val = parseInt(event.target.value, 10);
    this.cantidades[productoId] = isNaN(val) || val < 1 ? 1 : val;
  }

  agregarAlCarrito(producto: any): void {
    const cantidad = this.cantidades[producto.id] || 1;
    const res = this.carritoService.agregar(producto, cantidad);
    if (!res.ok) {
      alert(res.mensaje);
      return;
    }

    this.cantidades[producto.id] = 1;
    this.cdr.detectChanges();
  }

  abrirCheckout(): void {
    if (this.carritoService.items().length === 0) {
      alert('El carrito está vacío. Selecciona productos para continuar.');
      return;
    }
    this.errorMensaje = '';
    this.estadoPago = 'NINGUNO';
    this.mensajeResultado = '';
    this.mostrarCheckout = true;
    this.cdr.detectChanges();
  }

  cerrarCheckout(): void {
    if (this.procesandoPago) return;
    this.mostrarCheckout = false;
    this.cdr.detectChanges();
  }

  // Validación completa antes de proceder al pago
  private validarDatos(): string | null {
    if (this.carritoService.items().length === 0) {
      return 'El carrito está vacío';
    }
    const errNombre = validarTexto(this.nombreCliente, 50);
    if (errNombre || this.nombreCliente.trim().length < 3) {
      return 'Escribe el nombre para el comprobante (mínimo 3 caracteres)';
    }
    const rfcLimpio = this.rfcCliente.trim().toUpperCase();
    if (!RFC_REGEX.test(rfcLimpio) && rfcLimpio !== 'XAXX010101000') {
      return 'El RFC no tiene un formato válido (ej. RFC SAT)';
    }
    const errCorreo = validarCorreo(this.correoCliente);
    if (errCorreo) {
      return `Correo inválido: ${errCorreo}`;
    }
    if (!this.aceptoTerminos) {
      return 'Debes aceptar los términos y condiciones y el aviso de privacidad';
    }
    return null;
  }

  // Procesar orden y redirigir a PayPal
  pagarConPaypal(): void {
    const problema = this.validarDatos();
    if (problema) {
      this.errorMensaje = problema;
      return;
    }

    this.errorMensaje = '';
    this.procesandoPago = true;

    const productos = this.carritoService.items().map(it => ({
      id: it.id,
      producto_id: it.id,
      nombre: it.nombre,
      cantidad: it.cantidad,
      precio: Number(it.precio || 0)
    }));

    const datosCliente = {
      cliente_id: this.authService.obtenerUsuarioId(),
      nombreReceptor: this.nombreCliente.trim(),
      nombre_cliente: this.nombreCliente.trim(),
      rfcReceptor: this.rfcCliente.trim().toUpperCase(),
      rfc_cliente: this.rfcCliente.trim().toUpperCase(),
      correo: this.correoCliente.trim(),
      correo_cliente: this.correoCliente.trim(),
      telefono_cliente: this.telefonoCliente.trim(),
      direccion_entrega: this.direccionEntrega.trim(),
      detalle: productos
    };

    // Crear orden con la API de PayPal
    this.paypalService.crearOrden({
      productos,
      items: productos,
      ...datosCliente
    }, (error, resOrden) => {
      if (error || (!resOrden?.urlPago && !resOrden?.approveUrl)) {
        this.procesandoPago = false;
        this.errorMensaje = error?.mensaje || 'Error al conectar con PayPal Sandbox';
        this.cdr.detectChanges();
        return;
      }

      // Guardar datos temporalmente para asociar la venta al volver
      sessionStorage.setItem('paypal_datos_venta', JSON.stringify(datosCliente));

      // Redirigir al cliente a PayPal para autorizar y pagar
      const urlDestino = resOrden.urlPago || resOrden.approveUrl;
      window.location.href = urlDestino;
    });
  }

  // Capturar orden al regresar de PayPal
  private capturarPago(orderID: string, datosVenta: any): void {
    this.paypalService.capturarOrden({ orderID, datosVenta }, (errCaptura, resCaptura) => {
      this.procesandoPago = false;

      // Si hubo error HTTP o estado explícito de rechazado
      if (errCaptura || resCaptura?.estado === 'RECHAZADO') {
        this.estadoPago = 'RECHAZADO';
        this.mensajeResultado = resCaptura?.mensaje || errCaptura?.mensaje || 'El pago fue rechazado por PayPal';
      } else if (resCaptura?.folio || resCaptura?.estado === 'APROBADO' || resCaptura?.estado === 'PAGADA' || resCaptura?.captureId || resCaptura?.venta) {
        // Confirmacion de pago exitoso
        this.estadoPago = 'APROBADO';
        this.folioVenta = resCaptura.folio || resCaptura.venta?.folio || resCaptura.venta?.id || orderID;
        this.correoEnviado = !!resCaptura.correoEnviado;

        this.mensajeResultado = `${resCaptura.mensaje || 'Pago completado con éxito'}. Folio #${this.folioVenta}. ` +
          (this.correoEnviado
            ? 'Te hemos enviado por correo el recibo con el archivo XML adjunto y los datos generales.'
            : 'Tu comprobante XML fue generado y registrado correctamente.');

        this.carritoService.vaciar();
        this.cargarCatalogo();
      } else {
        this.estadoPago = 'RECHAZADO';
        this.mensajeResultado = resCaptura?.mensaje || 'No se pudo confirmar la aprobación del pago en PayPal';
      }

      this.cdr.detectChanges();
    });
  }

  irAVentas(): void {
    this.mostrarCheckout = false;
    this.router.navigate(['/ventas']);
  }
}
