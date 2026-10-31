import { Component, OnInit, ChangeDetectorRef, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../servicios/dashboard.service';
import { ReporteService } from '../../servicios/reporte.service';

export interface TarjetaDashboard {
  id: string;
  titulo: string;
  subtitulo: string;
  icono: string;
  esImagen: boolean;
  metrica1: { valor: string; etiqueta: string; };
  metrica2: { valor: string; etiqueta: string; esAlerta?: boolean; };
}

@Component({
  imports: [RouterLink],
  selector: 'app-dashboard',
  styleUrl: './dashboard.css',
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  // Lista de métricas y tarjetas principales del sistema
  tarjetas: TarjetaDashboard[] = [
    {
      id: 'finanzas', titulo: 'Contabilidad y Finanzas', subtitulo: 'Estadísticas y balance.',
      icono: 'Finanzas.png', esImagen: true,
      metrica1: { valor: '$0.00', etiqueta: 'Ingresos mes' },
      metrica2: { valor: '---', etiqueta: 'Reportes' }
    },
    {
      id: 'inventario', titulo: 'Gestión de Inventario', subtitulo: 'Existencias de insumos.',
      icono: 'Hexagono.png', esImagen: true,
      metrica1: { valor: '---', etiqueta: 'Productos' },
      metrica2: { valor: '---', etiqueta: 'Stock bajo', esAlerta: true }
    },
    {
      id: 'ventas', titulo: 'Ventas y Facturación', subtitulo: 'Ventas locales y online.',
      icono: 'Cuadrado.png', esImagen: true,
      metrica1: { valor: '---', etiqueta: 'Ventas hoy' },
      metrica2: { valor: '$0.00', etiqueta: 'Total día' }
    },
    {
      id: 'rh', titulo: 'Recursos Humanos', subtitulo: 'Plantilla de personal.',
      icono: 'Usuario.png', esImagen: true,
      metrica1: { valor: '---', etiqueta: 'Empleados' },
      metrica2: { valor: '---', etiqueta: 'Turnos hoy' }
    }
  ];

  constructor(
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef,
    private reporteService: ReporteService
  ) {
    effect(() => {
      const tarjeta = this.tarjetas.find(t => t.id === 'finanzas');
      if (tarjeta) {
        tarjeta.metrica2.valor = String(this.reporteService.generados());
      }
      this.cdr.detectChanges();
    });
  }

  // Encargado de cargar el resumen general al iniciar
  ngOnInit(): void {
    this.dashboardService.obtenerResumen((error, data) => {
      if (error || !data) {
        console.error('Error al obtener resumen del dashboard:', error);
        return;
      }
      this.actualizarTarjeta('finanzas', data.finanzas.ingresosMes, String(this.reporteService.generados()));
      this.actualizarTarjeta('inventario', String(data.inventario.productos), String(data.inventario.stockBajo));
      this.actualizarTarjeta('ventas', String(data.ventas.ventasHoy), data.ventas.totalDia);
      this.actualizarTarjeta('rh', String(data.rh.empleados), String(data.rh.turnosHoy));
      this.cdr.detectChanges();
    });
  }

  // Actualiza los valores de una tarjeta específica
  private actualizarTarjeta(id: string, valor1: string, valor2: string): void {
    const tarjeta = this.tarjetas.find(t => t.id === id);
    if (!tarjeta) return;
    tarjeta.metrica1.valor = valor1;
    tarjeta.metrica2.valor = valor2;
  }
}
