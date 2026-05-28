import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CitaService } from '../services/cita.service';

@Component({
  selector: 'app-agendar-cita',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agendar-cita.component.html'
})
export class AgendarCitaComponent implements OnInit {
  usuario: any = null;
  vehiculo: any = null;
  idVehiculo: string = '';

  citaForm = { tipoCita: '', fecha: '', horario: '' };

  horariosDisponibles: string[] = [];
  cargandoHorarios = false;
  cargando = false;

  mensajeError: string | null = null;
  mensajeExito: string | null = null;
  listoParaMostrar = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private citaService: CitaService
  ) {}

  async ngOnInit() {
    this.idVehiculo = this.route.snapshot.paramMap.get('idVehiculo') || '';

    // Paso 2: verificar autenticación
    const savedUser = localStorage.getItem('usuarioLogueado');
    if (!savedUser) {
      this.mensajeError = 'Necesitas iniciar sesión para agendar una cita';
      setTimeout(() => {
        localStorage.setItem('pendingSection', 'login');
        this.router.navigate(['/']);
      }, 2000);
      return;
    }

    this.usuario = JSON.parse(savedUser);

    // Recuperar vehículo desde estado del router o sessionStorage
    const nav = this.router.getCurrentNavigation();
    this.vehiculo =
      nav?.extras?.state?.['vehiculo'] ||
      JSON.parse(sessionStorage.getItem('vehiculoParaCita') || 'null');
    sessionStorage.removeItem('vehiculoParaCita');

    if (!this.vehiculo) {
      localStorage.setItem('pendingSection', 'catalogo');
      this.router.navigate(['/']);
      return;
    }

    // Paso 3: verificar disponibilidad del vehículo
    if (!this.vehiculo.disponible) {
      this.mensajeError = 'Este vehículo ya no está disponible';
      setTimeout(() => {
        localStorage.setItem('pendingSection', 'catalogo');
        this.router.navigate(['/']);
      }, 2000);
      return;
    }

    // Paso 4: verificar cita duplicada activa
    const citasActivas = await this.citaService.getCitasByUsuarioYVehiculo(
      this.usuario.id,
      this.idVehiculo
    );
    if (citasActivas.length > 0) {
      this.mensajeError = 'Ya tienes una cita activa para este vehículo';
      setTimeout(() => {
        localStorage.setItem('pendingSection', 'catalogo');
        this.router.navigate(['/']);
      }, 2000);
      return;
    }

    this.listoParaMostrar = true;
  }

  get fechaMinima(): string {
    return new Date().toISOString().split('T')[0];
  }

  // Paso 6: filtrar horarios disponibles al cambiar fecha
  async onFechaChange() {
    this.citaForm.horario = '';
    this.horariosDisponibles = [];
    if (!this.citaForm.fecha) return;

    this.cargandoHorarios = true;
    const [y, m, d] = this.citaForm.fecha.split('-');
    const fechaFormateada = `${d}/${m}/${y}`;
    this.horariosDisponibles = await this.citaService.getHorariosDisponibles(
      this.idVehiculo,
      fechaFormateada
    );
    this.cargandoHorarios = false;
  }

  // Paso 7: cancelar → regresar al catálogo
  cancelar() {
    localStorage.setItem('pendingSection', 'catalogo');
    this.router.navigate(['/']);
  }

  // Pasos 8, 9, 10: validar, registrar y redirigir
  async confirmar() {
    this.mensajeError = null;

    // Paso 8: validar campos completos
    if (!this.citaForm.tipoCita || !this.citaForm.fecha || !this.citaForm.horario) {
      this.mensajeError = 'Completa todos los campos para continuar';
      return;
    }

    this.cargando = true;

    const [y, m, d] = this.citaForm.fecha.split('-');
    const fechaFormateada = `${d}/${m}/${y}`;

    // Paso 9: registrar cita
    const resultado = await this.citaService.registrarCita({
      idUsuario: this.usuario.id,
      idVehiculo: this.idVehiculo,
      tipoCita: this.citaForm.tipoCita,
      fecha: fechaFormateada,
      horario: this.citaForm.horario,
      cliente: `${this.usuario.nombre} ${this.usuario.apellido}`,
      auto: `${this.vehiculo.marca} ${this.vehiculo.modelo}`
    });

    this.cargando = false;

    if (resultado.ok) {
      // Paso 10: mostrar confirmación y redirigir al historial
      this.mensajeExito = resultado.mensaje;
      this.listoParaMostrar = false;
      setTimeout(() => this.router.navigate(['/historial-citas']), 2000);
    } else {
      this.mensajeError = resultado.mensaje;
    }
  }
}
