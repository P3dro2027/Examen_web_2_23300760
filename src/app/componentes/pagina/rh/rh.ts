import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { EmpleadoService } from '../../../servicios/empleado.service';
import { validarTexto, validarNumero } from '../../../servicios/http-cliente';

export interface Empleado {
  id: number;
  nombre: string;
  puesto: string;
  salario: string;
  turno: string;
}

export interface DiaCalendario {
  numero: number;
  activo: boolean;
}

function fechaLocalISO(): string {
  const ahora = new Date();
  const offset = ahora.getTimezoneOffset() * 60000;
  return new Date(ahora.getTime() - offset).toISOString().split('T')[0];
}

@Component({
  imports: [],
  selector: 'app-rh',
  styleUrl: './rh.css',
  templateUrl: './rh.html',
})
export class Rh implements OnInit {
  // Lista de empleados y días de asistencia
  empleados: Empleado[] = [];
  mostrarModal = false;
  cargando = false;
  errorMensaje = '';

  formNombre = '';
  formPuesto = '';
  formHorario = '';

  // Asistencia de empleados
  mostrarModalAsistencia = false;
  empleadoSeleccionado: Empleado | null = null;
  formAsistenciaFecha = fechaLocalISO();
  formAsistenciaHoraEntrada = '08:00';
  formAsistenciaHoraSalida = '16:00';
  formAsistenciaEstado = 'Presente';

  // Nómina de empleados
  mostrarModalNomina = false;
  formNominaPeriodo = 'Quincenal';
  formNominaMonto = '';

  diasCalendario: DiaCalendario[] = [
    { numero: 1, activo: false },
    { numero: 2, activo: true },
    { numero: 3, activo: false },
    { numero: 4, activo: true },
    { numero: 5, activo: false },
    { numero: 6, activo: false },
    { numero: 7, activo: false }
  ];

  constructor(
    private empleadoService: EmpleadoService,
    private cdr: ChangeDetectorRef
  ) {}

  // Encargado de cargar los empleados al iniciar
  ngOnInit(): void {
    this.cargarEmpleados();
  }

  cargarEmpleados(): void {
    this.empleadoService.obtenerEmpleados((error, datos) => {
      if (error) {
        console.error('Error al obtener empleados:', error);
        return;
      }
      this.empleados = datos || [];
      this.cdr.detectChanges();
    });
  }

  // Encargado de abrir y cerrar el modal de empleado
  abrirModal(): void {
    this.formNombre = '';
    this.formPuesto = '';
    this.formHorario = '';
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

  guardarEmpleado(): void {
    if (this.cargando) return;

    const errNom = validarTexto(this.formNombre, 50);
    if (errNom) {
      this.errorMensaje = `Nombre: ${errNom}`;
      return;
    }

    const errPuesto = validarTexto(this.formPuesto, 50);
    if (errPuesto) {
      this.errorMensaje = `Puesto: ${errPuesto}`;
      return;
    }

    const errHorario = validarTexto(this.formHorario, 50);
    if (errHorario) {
      this.errorMensaje = `Horario/Turno: ${errHorario}`;
      return;
    }

    this.errorMensaje = '';
    this.cargando = true;

    this.empleadoService.agregarEmpleado({
      nombre: this.formNombre.trim(),
      puesto: this.formPuesto.trim(),
      horario: this.formHorario.trim()
    }, (error) => {
      this.cargando = false;
      if (error) {
        console.error('Error al agregar empleado:', error);
        this.errorMensaje = error.mensaje || 'Error al agregar empleado';
        this.cdr.detectChanges();
        return;
      }
      this.mostrarModal = false;
      this.cargarEmpleados();
    });
  }

  // Encargado de abrir y registrar asistencia del empleado
  abrirModalAsistencia(emp: Empleado): void {
    this.empleadoSeleccionado = emp;
    this.formAsistenciaFecha = fechaLocalISO();
    this.formAsistenciaHoraEntrada = '08:00';
    this.formAsistenciaHoraSalida = '16:00';
    this.formAsistenciaEstado = 'Presente';
    this.errorMensaje = '';
    this.cargando = false;
    this.mostrarModalAsistencia = true;
    this.cdr.detectChanges();
  }

  cerrarModalAsistencia(): void {
    if (this.cargando) return;
    this.mostrarModalAsistencia = false;
    this.empleadoSeleccionado = null;
    this.cdr.detectChanges();
  }

  guardarAsistencia(): void {
    if (this.cargando || !this.empleadoSeleccionado) return;

    if (!this.formAsistenciaFecha) {
      this.errorMensaje = 'Seleccione una fecha de asistencia';
      return;
    }

    this.errorMensaje = '';
    this.cargando = true;

    this.empleadoService.registrarAsistencia(this.empleadoSeleccionado.id, {
      fecha: this.formAsistenciaFecha,
      hora_entrada: this.formAsistenciaHoraEntrada,
      hora_salida: this.formAsistenciaHoraSalida,
      estado: this.formAsistenciaEstado
    }, (error) => {
      this.cargando = false;
      if (error) {
        this.errorMensaje = error.mensaje || 'Error al registrar asistencia';
        this.cdr.detectChanges();
        return;
      }
      this.mostrarModalAsistencia = false;
      this.empleadoSeleccionado = null;
      this.cargarEmpleados();
    });
  }

  // Encargado de abrir y generar nomina del empleado
  abrirModalNomina(emp: Empleado): void {
    this.empleadoSeleccionado = emp;
    this.formNominaPeriodo = 'Quincenal';
    const salarioLimpio = emp.salario.replace(/[^0-9.]/g, '');
    this.formNominaMonto = salarioLimpio || '1500';
    this.errorMensaje = '';
    this.cargando = false;
    this.mostrarModalNomina = true;
    this.cdr.detectChanges();
  }

  cerrarModalNomina(): void {
    if (this.cargando) return;
    this.mostrarModalNomina = false;
    this.empleadoSeleccionado = null;
    this.cdr.detectChanges();
  }

  guardarNomina(): void {
    if (this.cargando || !this.empleadoSeleccionado) return;

    const errMonto = validarNumero(this.formNominaMonto);
    if (errMonto) {
      this.errorMensaje = `Monto: ${errMonto}`;
      return;
    }

    this.errorMensaje = '';
    this.cargando = true;

    this.empleadoService.generarNomina(this.empleadoSeleccionado.id, {
      periodo: this.formNominaPeriodo,
      monto_a_pagar: Number(this.formNominaMonto)
    }, (error) => {
      this.cargando = false;
      if (error) {
        this.errorMensaje = error.mensaje || 'Error al generar nómina';
        this.cdr.detectChanges();
        return;
      }
      this.mostrarModalNomina = false;
      this.empleadoSeleccionado = null;
      this.cargarEmpleados();
    });
  }
}
