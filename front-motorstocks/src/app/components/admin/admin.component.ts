import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VentasService } from '../../services/ventas.service';
import { CarrosService } from '../../services/carros.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styles: [`@keyframes slideIn { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }`]
})
export class AdminComponent implements OnInit {
  @Input() usuarioLogueado: any = null;

  listaCarros: any[] = [];
  listaUsuarios: any[] = [];
  listaOrdenes: any[] = [];
  listaCitas: any[] = [];
  citaDetalle: any = null;
  procesandoVenta: string | null = null;
  ventaConfirmada: any = null;

  // Vista de registro de auto
  vistaAdmin: 'panel' | 'registrar' = 'panel';
  toastAutoRegistrado: string | null = null;
  private toastTimer: any = null;
  kilometrajeRaw: string = '';
  nuevoAuto = {
    marca: '',
    modelo: '',
    precio: '',
    ano: '',
    kilometraje: '',
    imagen: '',
    motor: '',
    transmision: '',
    blindaje: '',
    color: '',
    tipo: '',
    combustible: '',
    vin: ''
  };

  get carrosReservados(): any[] {
    return this.listaOrdenes.filter(o => o.estado === 'Reservado');
  }

  constructor(
    private cdr: ChangeDetectorRef,
    private ventasService: VentasService,
    private carrosService: CarrosService
  ) {}

  ngOnInit() {
    this.cargarUsuarios();
    this.cargarOrdenes();
    this.cargarCitas();
    this.cargarCarros();
  }

  cargarCarros() {
    this.carrosService.getCarros().subscribe(data => {
      this.listaCarros = data;
      this.cdr.detectChanges();
    });
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

  cerrarVentaConfirmada() {
    this.ventaConfirmada = null;
    this.cdr.detectChanges();
  }

  // --- Vista Registrar Vehículo ---
  irARegistrarAuto() {
    this.vistaAdmin = 'registrar';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.cdr.detectChanges();
  }

  volverAlPanel() {
    this.vistaAdmin = 'panel';
    this.cdr.detectChanges();
  }

  mostrarToastExito(nombreAuto: string) {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastAutoRegistrado = nombreAuto;
    this.cdr.detectChanges();
    this.toastTimer = setTimeout(() => {
      this.toastAutoRegistrado = null;
      this.cdr.detectChanges();
    }, 5000);
  }

  cerrarToast() {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastAutoRegistrado = null;
    this.cdr.detectChanges();
  }

  formatearPrecioInput(valor: string) {
    let numerico = valor.replace(/\D/g, '');
    if (numerico === '') {
      this.nuevoAuto.precio = '';
      return;
    }
    this.nuevoAuto.precio = '$' + parseInt(numerico, 10).toLocaleString('en-US');
  }

  onKilometrajeKeydown(event: KeyboardEvent) {
    const permitidas = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
                        'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    if (permitidas.includes(event.key) || event.ctrlKey || event.metaKey) return;
    if (!/^\d$/.test(event.key)) event.preventDefault();
  }

  onKilometrajeChange() {
    const numerico = this.kilometrajeRaw.replace(/\D/g, '');
    if (numerico === '') {
      this.kilometrajeRaw = '';
      this.nuevoAuto.kilometraje = '';
      return;
    }
    const num = parseInt(numerico, 10);
    this.kilometrajeRaw = num.toLocaleString('en-US');          // "15,000"  en el input
    this.nuevoAuto.kilometraje = num === 0                      // "15,000 km" guardado
      ? '0 km (Nuevo)'
      : num.toLocaleString('en-US') + ' km';
  }

  agregarAuto(evento: Event) {
    evento.preventDefault();

    const auto = this.nuevoAuto;
    if (!auto.marca || !auto.modelo || !auto.precio || !auto.ano || !auto.imagen || !auto.vin) {
      alert('Por favor, completa los campos obligatorios: Marca, Modelo, Precio, Año, Número de VIN e Imagen.');
      return;
    }

    const precioNumerico = parseFloat(auto.precio.replace(/[^0-9.-]+/g, ''));
    if (isNaN(precioNumerico) || precioNumerico <= 0) {
      alert('Por favor, ingresa un precio válido y mayor a 0.');
      return;
    }

    const anoNumerico = parseInt(auto.ano, 10);
    const anoMaximo = new Date().getFullYear() + 1;
    if (isNaN(anoNumerico) || anoNumerico < 1900 || anoNumerico > anoMaximo) {
      alert(`Por favor, ingresa un año válido entre 1900 y ${anoMaximo}.`);
      return;
    }

    const nombreAuto = `${this.nuevoAuto.marca} ${this.nuevoAuto.modelo} ${this.nuevoAuto.ano}`.trim();
    this.carrosService.registrarCarro({ ...this.nuevoAuto, reservado: false }).subscribe(
      () => {
        this.cargarCarros();
        this.nuevoAuto = {
          marca: '', modelo: '', precio: '', ano: '', kilometraje: '', imagen: '',
          motor: '', transmision: '', blindaje: '', color: '', tipo: '', combustible: '', vin: ''
        };
        this.kilometrajeRaw = '';
        this.vistaAdmin = 'panel';
        this.mostrarToastExito(nombreAuto);
        this.cdr.detectChanges();
      },
      (error: any) => {
        if (error.error && error.error.mensaje) {
          alert(error.error.mensaje);
        } else {
          alert('Error al conectar con la base de datos JSON.');
        }
      }
    );
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
        this.ventaConfirmada = { ...data.venta, _orden: orden };
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
