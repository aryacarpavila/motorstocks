import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CitaService } from '../../services/cita.service';

@Component({
  selector: 'app-agendar-cita',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agendar-cita.component.html',
  styles: [`@keyframes spin { to { transform: rotate(360deg); } } .spinner { animation: spin 0.7s linear infinite; }`]
})
export class AgendarCitaComponent implements OnInit {
  usuario: any = null;
  carro: any = null;
  idVehiculo: string = '';

  citaForm = { tipoCita: '', fecha: '', horario: '' };

  horariosDisponibles: string[] = [];
  cargandoHorarios = false;
  horariosBuscados = false;
  mensajeFecha: string | null = null;
  private fechaCambioId = 0;
  cargando = false;

  verificando = true;
  mensajeError: string | null = null;
  mensajeExito: string | null = null;
  listoParaMostrar = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private citaService: CitaService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    this.idVehiculo = this.route.snapshot.paramMap.get('idVehiculo') || '';

    this.cdr.detectChanges();
    const spinnerMinimo = new Promise(resolve => setTimeout(resolve, 400));

    // Verificar autenticación
    const savedUser = localStorage.getItem('usuarioLogueado');
    if (!savedUser) {
      this.verificando = false;
      this.mensajeError = 'Necesitas iniciar sesión para agendar una cita';
      this.cdr.detectChanges();
      setTimeout(() => {
        localStorage.setItem('pendingSection', 'login');
        this.router.navigate(['/']);
      }, 2000);
      return;
    }
    this.usuario = JSON.parse(savedUser);

    // Admins no pueden agendar citas
    if (this.usuario.rol === 'admin') {
      localStorage.setItem('pendingSection', 'admin');
      this.router.navigate(['/']);
      return;
    }

    // Recuperar carro desde el servicio compartido
    this.carro = this.citaService.carroSeleccionado;
    if (!this.carro) {
      localStorage.setItem('pendingSection', 'catalogo');
      this.router.navigate(['/']);
      return;
    }

    // Verificar disponibilidad contra el backend (dependencia HU5)
    // Se pasa idUsuario para que el dueño de la reserva pueda agendar cita
    const verificacionCarro = await this.citaService.getCarro(this.idVehiculo, this.usuario.id);
    if (!verificacionCarro.ok || !verificacionCarro.vehiculo) {
      await spinnerMinimo;
      this.verificando = false;
      this.mensajeError = verificacionCarro.mensaje || 'Este carro no se encontró en el catálogo.';
      this.cdr.detectChanges();
      return;
    }
    if (!verificacionCarro.vehiculo.disponible) {
      await spinnerMinimo;
      this.verificando = false;
      this.mensajeError = 'Este carro ya no está disponible en el catálogo.';
      this.cdr.detectChanges();
      return;
    }

    // Verificar si ya tiene una cita activa para este carro
    const [citasActivas] = await Promise.all([
      this.citaService.getCitasByUsuarioYVehiculo(this.usuario.id, this.idVehiculo),
      spinnerMinimo
    ]);

    this.verificando = false;

    if (citasActivas.length > 0) {
      this.mensajeError = 'Ya tienes una cita activa para este carro.';
      this.cdr.detectChanges();
      return;
    }

    this.listoParaMostrar = true;
    this.cdr.detectChanges();
  }

  get fechaMinima(): string {
    return new Date().toISOString().split('T')[0];
  }

  get fechaDisplay(): string {
    if (!this.citaForm.fecha) return '';
    const [y, m, d] = this.citaForm.fecha.split('-');
    return `${d}/${m}/${y}`;
  }

  async onFechaChange() {
    const id = ++this.fechaCambioId;
    this.citaForm.horario = '';
    this.horariosDisponibles = [];
    this.horariosBuscados = false;
    this.mensajeFecha = null;
    if (!this.citaForm.fecha) {
      this.cargandoHorarios = false;
      this.cdr.detectChanges();
      return;
    }

    const yearStr = this.citaForm.fecha.split('-')[0];
    if (yearStr.length < 4 || Number(yearStr) < 2000 || Number(yearStr) > 2100) {
      this.cargandoHorarios = false;
      this.cdr.detectChanges();
      return;
    }

    this.cargandoHorarios = true;
    this.cdr.detectChanges();

    const spinnerMinimo = new Promise(resolve => setTimeout(resolve, 400));

    if (this.citaForm.fecha < new Date().toISOString().split('T')[0]) {
      await spinnerMinimo;
      if (id !== this.fechaCambioId) return;
      this.cargandoHorarios = false;
      this.mensajeFecha = 'La fecha no puede ser anterior a hoy.';
      this.cdr.detectChanges();
      return;
    }

    const [y, m, d] = this.citaForm.fecha.split('-');
    const fechaFormateada = `${d}/${m}/${y}`;
    const [horarios] = await Promise.all([
      this.citaService.getHorariosDisponibles(this.idVehiculo, fechaFormateada),
      spinnerMinimo
    ]);
    if (id !== this.fechaCambioId) return;
    this.horariosDisponibles = horarios;
    this.horariosBuscados = true;
    this.cargandoHorarios = false;
    this.cdr.detectChanges();
  }

  cancelar() {
    localStorage.setItem('pendingSection', 'catalogo');
    this.router.navigate(['/']);
  }

  irAHistorial() {
    this.router.navigate(['/historial-citas']);
  }

  async confirmar() {
    this.mensajeError = null;

    if (!this.citaForm.tipoCita || !this.citaForm.fecha || !this.citaForm.horario) {
      this.mensajeError = 'Completa todos los campos para continuar';
      this.cdr.detectChanges();
      return;
    }

    if (this.citaForm.fecha < new Date().toISOString().split('T')[0]) {
      this.mensajeError = 'La fecha no puede ser anterior a hoy.';
      this.cdr.detectChanges();
      return;
    }

    this.cargando = true;
    this.cdr.detectChanges();

    const [y, m, d] = this.citaForm.fecha.split('-');
    const fechaFormateada = `${d}/${m}/${y}`;

    const resultado = await this.citaService.registrarCita({
      idUsuario:  this.usuario.id,
      idVehiculo: this.idVehiculo,
      tipoCita:   this.citaForm.tipoCita,
      fecha:      fechaFormateada,
      horario:    this.citaForm.horario,
      cliente:    `${this.usuario.nombre} ${this.usuario.apellido}`,
      auto:       `${this.carro.marca} ${this.carro.modelo}`,
      imagen:     this.carro.imagen || ''
    });

    this.cargando = false;

    if (resultado.ok) {
      const tipoLabel = this.citaForm.tipoCita === 'inspeccion' ? 'Inspección' : 'Prueba de Manejo';
      const detalle = `${this.carro.marca} ${this.carro.modelo} · ${tipoLabel} · ${fechaFormateada} a las ${this.citaForm.horario}`;
      this.mensajeExito = detalle;
      this.listoParaMostrar = false;
      sessionStorage.setItem('citaAgendadaExito', detalle);
      this.cdr.detectChanges();
      setTimeout(() => this.router.navigate(['/historial-citas']), 2500);
    } else {
      this.mensajeError = resultado.mensaje;
      this.cdr.detectChanges();
    }
  }
}
