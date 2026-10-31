import { Injectable, signal } from '@angular/core';

export type TipoDocumentoLegal = 'terminos' | 'privacidad' | null;

@Injectable({
  providedIn: 'root'
})
export class LegalService {
  readonly documentoActivo = signal<TipoDocumentoLegal>(null);

  abrirTerminos(): void {
    this.documentoActivo.set('terminos');
  }

  abrirPrivacidad(): void {
    this.documentoActivo.set('privacidad');
  }

  cerrar(): void {
    this.documentoActivo.set(null);
  }
}
