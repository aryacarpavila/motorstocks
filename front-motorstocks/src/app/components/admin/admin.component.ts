import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html'
})
export class AdminComponent implements OnInit {
  @Input() usuarioLogueado: any = null;
  @Input() listaCarros: any[] = [];
  @Output() solicitarRegistroAuto = new EventEmitter<void>();

  listaUsuarios: any[] = [];
  listaOrdenes: any[] = [];
  listaCitas: any[] = [];
  citaDetalle: any = null;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.cargarUsuarios();
    this.cargarOrdenes();
    this.cargarCitas();
  }

  async cargarUsuarios() {
    try {
      const respuesta = await fetch('http://localhost:3000/api/usuarios');
      const data = await respuesta.json();
      if (data.ok) {
        this.listaUsuarios = data.usuarios;
        this.cdr.detectChanges();
      }
    } catch (error) {
      console.error('Error cargando usuarios', error);
    }
  }

  async cargarOrdenes() {
    try {
      const respuesta = await fetch('http://localhost:3000/api/ordenes');
      const data = await respuesta.json();
      if (data.ok) {
        this.listaOrdenes = data.ordenes;
        this.cdr.detectChanges();
      }
    } catch (error) {
      console.error('Error cargando órdenes', error);
    }
  }

  async cargarCitas() {
    try {
      const respuesta = await fetch('http://localhost:3000/api/citas');
      const data = await respuesta.json();
      if (data.ok) {
        this.listaCitas = data.citas;
        this.cdr.detectChanges();
      }
    } catch (error) {
      console.error('Error cargando citas', error);
    }
  }

  async cambiarEstadoCita(cita: any, estado: string) {
    try {
      const respuesta = await fetch(`http://localhost:3000/api/citas/${cita.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado })
      });
      const data = await respuesta.json();
      if (data.ok) {
        cita.estado = estado;
        this.cdr.detectChanges();
      }
    } catch {
      cita.estado = estado;
      this.cdr.detectChanges();
    }
  }

  verDetallesCita(cita: any) {
    this.citaDetalle = cita;
    this.cdr.detectChanges();
  }

  cerrarDetalleCita() {
    this.citaDetalle = null;
    this.cdr.detectChanges();
  }

  abrirRegistroAuto() {
    this.solicitarRegistroAuto.emit();
  }
}
