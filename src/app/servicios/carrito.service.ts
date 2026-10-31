import { Injectable, signal } from '@angular/core';

export interface ItemCarrito {
  id: number;
  nombre: string;
  categoria: string;
  precio: number;
  cantidad: number;
  subtotal: number;
  disponible: number;
}

@Injectable({
  providedIn: 'root'
})
export class CarritoService {
  private readonly STORAGE_KEY = 'erp_carrito_items';

  readonly items = signal<ItemCarrito[]>(this.cargarItemsStorage());

  totalArticulos(): number {
    return this.items().reduce((acc, it) => acc + it.cantidad, 0);
  }

  subtotal(): number {
    const sum = this.items().reduce((acc, it) => acc + (it.precio * it.cantidad), 0);
    return Number(sum.toFixed(2));
  }

  iva(): number {
    return Number((this.subtotal() * 0.16).toFixed(2));
  }

  total(): number {
    return Number((this.subtotal() + this.iva()).toFixed(2));
  }

  private cargarItemsStorage(): ItemCarrito[] {
    try {
      const guardado = localStorage.getItem(this.STORAGE_KEY);
      return guardado ? JSON.parse(guardado) : [];
    } catch {
      return [];
    }
  }

  private guardarStorage(items: ItemCarrito[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Error guardando carrito:', e);
    }
  }

  agregar(producto: any, cantidad: number = 1): { ok: boolean; mensaje?: string } {
    const cant = Number(cantidad);
    if (isNaN(cant) || cant <= 0) {
      return { ok: false, mensaje: 'La cantidad debe ser mayor a 0' };
    }

    const maxDisponible = Number(producto.cantidad ?? 9999);
    const actuales = [...this.items()];
    const index = actuales.findIndex(it => it.id === producto.id);

    if (index >= 0) {
      const nuevaCant = actuales[index].cantidad + cant;
      if (nuevaCant > maxDisponible) {
        return { ok: false, mensaje: `Stock maximo disponible alcanzado (${maxDisponible})` };
      }
      actuales[index].cantidad = nuevaCant;
      actuales[index].subtotal = Number((nuevaCant * actuales[index].precio).toFixed(2));
    } else {
      if (cant > maxDisponible) {
        return { ok: false, mensaje: `Solo hay ${maxDisponible} unidades disponibles en inventario` };
      }
      actuales.push({
        id: producto.id,
        nombre: producto.nombre,
        categoria: producto.categoria || 'General',
        precio: Number(producto.precio),
        cantidad: cant,
        subtotal: Number((cant * Number(producto.precio)).toFixed(2)),
        disponible: maxDisponible
      });
    }

    this.items.set(actuales);
    this.guardarStorage(actuales);
    return { ok: true };
  }

  actualizarCantidad(productoId: number, cantidad: number): void {
    const cant = Number(cantidad);
    if (cant <= 0) {
      this.eliminar(productoId);
      return;
    }

    const actuales = this.items().map(it => {
      if (it.id === productoId) {
        const cantFinal = Math.min(cant, it.disponible);
        return {
          ...it,
          cantidad: cantFinal,
          subtotal: Number((cantFinal * it.precio).toFixed(2))
        };
      }
      return it;
    });

    this.items.set(actuales);
    this.guardarStorage(actuales);
  }

  eliminar(productoId: number): void {
    const filtrados = this.items().filter(it => it.id !== productoId);
    this.items.set(filtrados);
    this.guardarStorage(filtrados);
  }

  vaciar(): void {
    this.items.set([]);
    this.guardarStorage([]);
  }
}
