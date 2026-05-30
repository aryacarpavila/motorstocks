import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class OrdenesService {
  private apiUrl = 'http://localhost:3000/api';

  async generarOrden(payload: {
    usuarioId: any;
    usuarioNombre: string;
    usuarioApellido: string;
    usuarioCorreo: string;
    auto: any;
  }): Promise<{ ok: boolean; orden?: any; mensaje?: string }> {
    try {
      const respuesta = await fetch(`${this.apiUrl}/orden`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await respuesta.json();
    } catch {
      return { ok: false, mensaje: 'Error de conexión con el servidor. No se pudo generar la orden.' };
    }
  }

  async getOrdenes(): Promise<{ ok: boolean; ordenes?: any[]; mensaje?: string }> {
    try {
      const respuesta = await fetch(`${this.apiUrl}/ordenes`);
      return await respuesta.json();
    } catch {
      return { ok: false, mensaje: 'Error al cargar órdenes.' };
    }
  }

  async getMisOrdenes(usuarioId: any): Promise<{ ok: boolean; ordenes?: any[]; mensaje?: string }> {
    try {
      const respuesta = await fetch(`${this.apiUrl}/ordenes/cliente/${usuarioId}`);
      return await respuesta.json();
    } catch {
      return { ok: false, mensaje: 'Error al cargar tus órdenes.' };
    }
  }
}
