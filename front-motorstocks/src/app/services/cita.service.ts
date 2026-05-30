import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CitaService {
  private apiUrl = 'http://localhost:3000/api';

  // Vehículo compartido entre app.ts y AgendarCitaComponent
  vehiculoSeleccionado: any = null;

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

  // Verificar que un vehículo existe y está disponible en el catálogo (dependencia HU5)
  // Si se pasa idUsuario, el backend permite disponibilidad para el dueño de la reserva
  async getVehiculo(idVehiculo: string, idUsuario?: string | number): Promise<{ ok: boolean; vehiculo?: any; mensaje?: string }> {
    try {
      const url = idUsuario
        ? `${this.apiUrl}/vehiculos/${idVehiculo}?idUsuario=${idUsuario}`
        : `${this.apiUrl}/vehiculos/${idVehiculo}`;
      const res = await fetch(url);
      return await res.json();
    } catch {
      return { ok: false, mensaje: 'Error de conexión con el servidor.' };
    }
  }

  // Reprogramar una cita existente
  async reprogramarCita(idCita: string, fecha: string, horario: string): Promise<{ ok: boolean; mensaje: string }> {
    try {
      const res = await fetch(`${this.apiUrl}/citas/${idCita}/reprogramar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha, horario })
      });
      return await res.json();
    } catch {
      return { ok: false, mensaje: 'Error de conexión con el servidor.' };
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
    imagen: string;
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
