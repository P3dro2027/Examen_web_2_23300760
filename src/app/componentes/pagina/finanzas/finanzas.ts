import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FinanzaService } from '../../../servicios/finanza.service';
import { ReporteService } from '../../../servicios/reporte.service';
import { validarTexto, validarNumero } from '../../../servicios/http-cliente';

export interface ResumenFinanzas {
  ingresosMes: string;
  egresosMes: string;
  utilidadNeta: string;
}

export interface GraficaSemanal {
  semana: string;
  porcentajeAltura: number;
}

export interface ReporteFinanciero {
  id: number;
  nombre: string;
  periodo: string;
  fecha: string;
  formato: string;
}

@Component({
  imports: [],
  selector: 'app-finanzas',
  styleUrl: './finanzas.css',
  templateUrl: './finanzas.html',
})
export class Finanzas implements OnInit {
  // Datos del resumen financiero, gráficas y reporte
  resumen: ResumenFinanzas = {
    ingresosMes: '$0.00',
    egresosMes: '$0.00',
    utilidadNeta: '$0.00'
  };

  datosGrafica: GraficaSemanal[] = [];
  reportes: ReporteFinanciero[] = [];
  mostrarModal = false;
  cargando = false;
  errorMensaje = '';

  formTipoMovimiento = 'ingreso';
  formMonto: string = '';
  formDescripcion = '';

  constructor(
    private finanzaService: FinanzaService,
    private reporteService: ReporteService,
    private cdr: ChangeDetectorRef
  ) {}

  // Encargado de cargar el resumen financiero al iniciar
  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.finanzaService.obtenerResumen((error, datos) => {
      if (!error && datos) {
        this.resumen = datos;
        this.cdr.detectChanges();
      }
    });

    this.finanzaService.obtenerGrafica((error, datos) => {
      if (!error && datos) {
        this.datosGrafica = datos;
        this.cdr.detectChanges();
      }
    });

    this.finanzaService.obtenerReportes((error, datos) => {
      if (!error && datos) {
        this.reportes = datos;
        this.cdr.detectChanges();
      }
    });
  }

  // Encargado de controlar la ventana del movimiento financiero
  abrirModal(): void {
    this.formTipoMovimiento = 'ingreso';
    this.formMonto = '';
    this.formDescripcion = '';
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

  guardarMovimiento(): void {
    if (this.cargando) return;

    const errMonto = validarNumero(this.formMonto);
    if (errMonto) {
      this.errorMensaje = `Monto: ${errMonto}`;
      return;
    }

    const errDesc = validarTexto(this.formDescripcion, 255);
    if (errDesc) {
      this.errorMensaje = `Descripción: ${errDesc}`;
      return;
    }

    this.errorMensaje = '';
    this.cargando = true;

    this.finanzaService.registrarMovimiento({
      tipo_movimiento: this.formTipoMovimiento,
      monto: Number(this.formMonto),
      descripcion: this.formDescripcion.trim()
    }, (error) => {
      this.cargando = false;
      if (error) {
        console.error('Error al registrar movimiento:', error);
        this.errorMensaje = error.mensaje || 'Error al registrar movimiento';
        this.cdr.detectChanges();
        return;
      }
      this.mostrarModal = false;
      this.cargarDatos();
    });
  }

  // Encargado de exportar reportes financieros a un archivo CSV/Excel
  exportarExcel(): void {
    let contenidoCsv = '\ufeffReporte,Periodo,Fecha,Formato\n';
    if (this.reportes && this.reportes.length > 0) {
      for (const rep of this.reportes) {
        contenidoCsv += `"${rep.nombre}","${rep.periodo}","${rep.fecha}","${rep.formato}"\n`;
      }
    } else {
      contenidoCsv += `"Ingresos Mes","${this.resumen.ingresosMes}","${new Date().toLocaleDateString()}","CSV"\n`;
      contenidoCsv += `"Egresos Mes","${this.resumen.egresosMes}","${new Date().toLocaleDateString()}","CSV"\n`;
      contenidoCsv += `"Utilidad Neta","${this.resumen.utilidadNeta}","${new Date().toLocaleDateString()}","CSV"\n`;
    }

    const blob = new Blob([contenidoCsv], { type: 'text/csv;charset=utf-8;' });
    const enlace = document.createElement('a');
    const url = URL.createObjectURL(blob);
    enlace.setAttribute('href', url);
    enlace.setAttribute('download', `Reporte_Financiero_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    this.reporteService.registrarGeneracion();
  }
}
