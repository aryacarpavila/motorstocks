import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CitaService {
  private apiUrl = 'http://localhost:3000/api';

  // Obtener todas las citas de un usuario
  async getCitasByUsuario(idUsuario: string | number): Promise<any[]> {
    try {
      const res = await fetch(`${this.apiUrl}/citas/usuario/${idUsuario}`);
      const data = await res.json();
      return data.ok ? data.citas : [];
    } catch {
      return [];
    }
  }

  // Obtener citas activas de un usuario para un vehículo específico
  async getCitasByUsuarioYVehiculo(idUsuario: string | number, idVehiculo: string): Promise<any[]> {
    const citas = await this.getCitasByUsuario(idUsuario);
    return citas.filter((c: any) => c.idVehiculo === idVehiculo && c.estado === 'activa');
  }

  // Obtener los horarios disponibles para un vehículo en una fecha dada
  async getHorariosDisponibles(idVehiculo: string, fecha: string): Promise<string[]> {
    try {
      const res = await fetch(
        `${this.apiUrl}/horarios-disponibles?idVehiculo=${idVehiculo}&fecha=${encodeURIComponent(fecha)}`
      );
      const data = await res.json();
      return data.ok ? data.horarios : [];
    } catch {
      return [];
    }
  }

  // Registrar una nueva cita
  async registrarCita(cita: {
    idUsuario: string | number;
    idVehiculo: string;
    tipoCita: string;
    fecha: string;
    horario: string;
    cliente: string;
    auto: string;
  }): Promise<{ ok: boolean; mensaje: string; cita?: any }> {
    try {
      const res = await fetch(`${this.apiUrl}/citas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cita)
      });
      return await res.json();
    } catch {
      return { ok: false, mensaje: 'Error de conexión con el servidor.' };
    }
  }
}
