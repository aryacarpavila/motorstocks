import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CitaService } from '../services/cita.service';

@Component({
  selector: 'app-historial-citas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './historial-citas.component.html'
})
export class HistorialCitasComponent implements OnInit {
  usuario: any = null;
  citas: any[] = [];
  cargando = true;

  constructor(private citaService: CitaService, private router: Router) {}

  async ngOnInit() {
    const savedUser = localStorage.getItem('usuarioLogueado');
    if (!savedUser) {
      localStorage.setItem('pendingSection', 'login');
      this.router.navigate(['/']);
      return;
    }
    this.usuario = JSON.parse(savedUser);
    this.citas = await this.citaService.getCitasByUsuario(this.usuario.id);
    this.cargando = false;
  }

  get tipoCitaLabel(): { [key: string]: string } {
    return {
      inspeccion: 'Inspección',
      prueba_de_manejo: 'Prueba de Manejo'
    };
  }

  estadoColor(estado: string): string {
    const colores: { [key: string]: string } = {
      activa: '#f59e0b',
      completada: '#16a34a',
      cancelada: '#dc2626'
    };
    return colores[estado] || '#777';
  }

  estadoLabel(estado: string): string {
    const labels: { [key: string]: string } = {
      activa: 'Activa',
      completada: 'Completada',
      cancelada: 'Cancelada'
    };
    return labels[estado] || estado;
  }

  volverAlCatalogo() {
    localStorage.setItem('pendingSection', 'catalogo');
    this.router.navigate(['/']);
  }

  agendarOtraCita() {
    localStorage.setItem('pendingSection', 'catalogo');
    this.router.navigate(['/']);
  }
}
