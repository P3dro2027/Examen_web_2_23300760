export type CallbackHttp = (error: any, datos: any) => void;

function peticion(metodo: string, url: string, datos: any, callback: CallbackHttp): void {
  const xhr = new XMLHttpRequest();
  xhr.open(metodo, url, true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  const token = localStorage.getItem('token');
  if (token) {
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
  }

  xhr.onload = function () {
    let cuerpo: any = null;
    try {
      cuerpo = xhr.responseText ? JSON.parse(xhr.responseText) : null;
    } catch (errorParseo) {
      callback(errorParseo, null);
      return;
    }

    if (xhr.status >= 200 && xhr.status < 300) {
      callback(null, cuerpo);
    } else {
      const mensaje = (cuerpo && cuerpo.mensaje) ? cuerpo.mensaje : 'Error en la petición (' + xhr.status + ')';
      callback({ status: xhr.status, mensaje: mensaje }, null);
    }
  };

  xhr.onerror = function () {
    callback({ mensaje: 'No se pudo conectar con el servidor' }, null);
  };

  xhr.send(datos !== undefined && datos !== null ? JSON.stringify(datos) : undefined);
}

export function obtenerJSON(url: string, callback: CallbackHttp): void {
  peticion('GET', url, null, callback);
}

export function postJSON(url: string, datos: any, callback: CallbackHttp): void {
  peticion('POST', url, datos, callback);
}

export function putJSON(url: string, datos: any, callback: CallbackHttp): void {
  peticion('PUT', url, datos, callback);
}

export function eliminarJSON(url: string, callback: CallbackHttp): void {
  peticion('DELETE', url, null, callback);
}

//Validaciones
export function validarTexto(texto: string | null | undefined, maxLongitud: number = 255): string | null {
  if (!texto || !texto.trim()) {
    return 'Este campo no puede estar vacío';
  }
  const limpio = texto.trim();
  if (limpio.length > maxLongitud) {
    return `La longitud máxima permitida es de ${maxLongitud} caracteres`;
  }
  if (/[<>;]|\-\-/.test(limpio)) {
    return 'No se permiten caracteres especiales prohibidos (<, >, ;, --)';
  }
  return null;
}

export function validarCorreo(correo: string | null | undefined): string | null {
  const err = validarTexto(correo, 100);
  if (err) return err;
  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regexEmail.test(correo!.trim())) {
    return 'El correo electrónico debe tener formato válido (usuario@dominio.com)';
  }
  return null;
}

export function validarNumero(val: number | string | null | undefined, esEntero: boolean = false): string | null {
  if (val === null || val === undefined || val === '') {
    return 'Este campo numérico no puede estar vacío';
  }
  const num = Number(val);
  if (isNaN(num) || num < 0) {
    return 'Debe ingresar un número válido mayor o igual a 0';
  }
  if (esEntero && !Number.isInteger(num)) {
    return 'Debe ingresar un número entero';
  }
  return null;
}
