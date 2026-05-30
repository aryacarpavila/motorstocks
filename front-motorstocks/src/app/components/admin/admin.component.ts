import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VentasService } from '../../services/ventas.service';

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
  procesandoVenta: string | null = null;

  get carrosReservados(): any[] {
    return this.listaOrdenes.filter(o => o.estado === 'Reservado');
  }

  constructor(private cdr: ChangeDetectorRef, private ventasService: VentasService) {}

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

  async formalizarVenta(orden: any) {
    if (this.procesandoVenta) return;
    this.procesandoVenta = orden.idOrden;
    this.cdr.detectChanges();

    try {
      const vendedor = `${this.usuarioLogueado?.nombre || 'Administrador'} ${this.usuarioLogueado?.apellido || ''}`.trim();
      const data = await this.ventasService.formalizarVenta(orden.idOrden, vendedor);

      if (data.ok) {
        orden.estado = 'Vendido';
        alert('Venta formalizada exitosamente. El inventario ha sido actualizado');
      } else {
        alert(data.mensaje || 'Error al formalizar la venta.');
      }
    } catch (e) {
      alert('Error de conexión con el servidor. Verifica que el backend esté corriendo.');
    } finally {
      this.procesandoVenta = null;
      this.cdr.detectChanges();
    }
  }
}
