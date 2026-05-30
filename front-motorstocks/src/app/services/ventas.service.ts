import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class VentasService {
  private baseUrl = 'http://localhost:3000/api';

  async formalizarVenta(idOrden: string, vendedor: string): Promise<any> {
    const res = await fetch(`${this.baseUrl}/ventas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idOrden, vendedor })
    });
    return res.json();
  }

  async getMisComprobantes(usuarioId: number): Promise<any> {
    const res = await fetch(`${this.baseUrl}/ventas/usuario/${usuarioId}`);
    return res.json();
  }
}
