import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:3000/api';

  usuarioLogueado: any = null;

  constructor() {
    const savedUser = localStorage.getItem('usuarioLogueado');
    if (savedUser) {
      this.usuarioLogueado = JSON.parse(savedUser);
    }
  }

  async login(data: { correo: string; password: string }): Promise<{ ok: boolean; usuario?: any; mensaje?: string }> {
    try {
      const respuesta = await fetch(`${this.apiUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await respuesta.json();
      if (result.ok) {
        this.usuarioLogueado = result.usuario;
        localStorage.setItem('usuarioLogueado', JSON.stringify(result.usuario));
      }
      return result;
    } catch {
      return { ok: false, mensaje: 'Error de conexión con el servidor.' };
    }
  }

  async registro(data: {
    nombre: string;
    apellido: string;
    correo: string;
    fechaNacimiento: string;
    password: string;
    aceptaTerminos: boolean;
  }): Promise<{ ok: boolean; mensaje?: string; errores?: any[] }> {
    try {
      const respuesta = await fetch(`${this.apiUrl}/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await respuesta.json();
    } catch {
      return { ok: false, mensaje: 'Error crítico: No hay conexión con las políticas de seguridad de la plataforma.' };
    }
  }

  cerrarSesion(): string {
    const nombre = this.usuarioLogueado?.nombre || '';
    this.usuarioLogueado = null;
    localStorage.removeItem('usuarioLogueado');
    return nombre;
  }
}
