import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CitaService } from '../../services/cita.service';

@Component({
  selector: 'app-historial-citas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './historial-citas.component.html',
  styles: [`@keyframes spin { to { transform: rotate(360deg); } } .spinner { animation: spin 0.7s linear infinite; }`]
})
export class HistorialCitasComponent implements OnInit {
  usuario: any = null;
  citas: any[] = [];
  cargando = true;

  // Banner de éxito al venir desde agendar-cita
  bannerExito: string | null = null;

  // --- Reprogramar ---
  citaAReprogramar: any = null;
  nuevaFecha: string = '';
  nuevoHorario: string = '';
  horariosDisponibles: string[] = [];
  cargandoHorarios = false;
  horariosBuscados = false;
  reprogramando = false;
  private fechaCambioId = 0;
  mensajeFecha: string | null = null;
  mensajeReprogramar: string | null = null;
  mensajeExitoReprogramar: string | null = null;

  constructor(
    private citaService: CitaService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    const savedUser = localStorage.getItem('usuarioLogueado');
    if (!savedUser) {
      localStorage.setItem('pendingSection', 'login');
      this.router.navigate(['/']);
      return;
    }
    this.usuario = JSON.parse(savedUser);

    // Mostrar banner si venimos de agendar-cita
    const exito = sessionStorage.getItem('citaAgendadaExito');
    if (exito) {
      this.bannerExito = exito;
      sessionStorage.removeItem('citaAgendadaExito');
      // Ocultar el banner automáticamente después de 5 segundos
      setTimeout(() => { this.bannerExito = null; this.cdr.detectChanges(); }, 5000);
    }

    const raw = await this.citaService.getCitasByUsuario(this.usuario.id);
    this.citas = this.ordenarPorFecha(raw);
    this.cargando = false;
    this.cdr.detectChanges();
  }

  private ordenarPorFecha(citas: any[]): any[] {
    return [...citas].sort((a, b) => {
      const toDate = (fecha: string) => {
        const [d, m, y] = fecha.split('/');
        return new Date(Number(y), Number(m) - 1, Number(d)).getTime();
      };
      const fechaDiff = toDate(a.fecha) - toDate(b.fecha);
      if (fechaDiff !== 0) return fechaDiff;

      const toMinutes = (horario: string) => {
        if (!horario) return 0;
        const [h, m] = horario.split(':').map(Number);
        return (h || 0) * 60 + (m || 0);
      };
      return toMinutes(a.horario) - toMinutes(b.horario);
    });
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
      completada: 'Confirmada',
      cancelada: 'Cancelada'
    };
    return labels[estado] || estado;
  }

  get fechaMinima(): string {
    return new Date().toISOString().split('T')[0];
  }

  get nuevaFechaDisplay(): string {
    if (!this.nuevaFecha) return '';
    const [y, m, d] = this.nuevaFecha.split('-');
    return `${m}/${d}/${y}`;
  }

  // --- Abrir / cerrar modal ---
  abrirReprogramar(cita: any) {
    this.citaAReprogramar = cita;
    this.nuevaFecha = '';
    this.nuevoHorario = '';
    this.horariosDisponibles = [];
    this.horariosBuscados = false;
    this.mensajeFecha = null;
    this.mensajeReprogramar = null;
    this.mensajeExitoReprogramar = null;
  }

  cerrarReprogramar() {
    this.citaAReprogramar = null;
    this.nuevaFecha = '';
    this.nuevoHorario = '';
    this.horariosDisponibles = [];
    this.horariosBuscados = false;
    this.mensajeFecha = null;
    this.mensajeReprogramar = null;
    this.mensajeExitoReprogramar = null;
  }

  // --- Cargar horarios al elegir fecha ---
  async onNuevaFechaChange() {
    const id = ++this.fechaCambioId;
    this.nuevoHorario = '';
    this.horariosDisponibles = [];
    this.horariosBuscados = false;
    this.mensajeFecha = null;
    if (!this.nuevaFecha || !this.citaAReprogramar) {
      this.cargandoHorarios = false;
      this.cdr.detectChanges();
      return;
    }

    const yearStr = this.nuevaFecha.split('-')[0];
    if (yearStr.length < 4 || Number(yearStr) < 2000 || Number(yearStr) > 2100) {
      this.cargandoHorarios = false;
      this.cdr.detectChanges();
      return;
    }

    this.cargandoHorarios = true;
    this.cdr.detectChanges();

    const spinnerMinimo = new Promise(resolve => setTimeout(resolve, 400));

    if (this.nuevaFecha < new Date().toISOString().split('T')[0]) {
      await spinnerMinimo;
      if (id !== this.fechaCambioId) return;
      this.cargandoHorarios = false;
      this.mensajeFecha = 'La fecha no puede ser anterior a hoy.';
      this.cdr.detectChanges();
      return;
    }

    const [y, m, d] = this.nuevaFecha.split('-');
    const fechaFormateada = `${d}/${m}/${y}`;
    const [horarios] = await Promise.all([
      this.citaService.getHorariosDisponibles(this.citaAReprogramar.idVehiculo, fechaFormateada),
      spinnerMinimo
    ]);
    if (id !== this.fechaCambioId) return;
    this.horariosDisponibles = horarios;
    this.horariosBuscados = true;
    this.cargandoHorarios = false;
    this.cdr.detectChanges();
  }

  // --- Confirmar reprogramación ---
  async confirmarReprogramar() {
    this.mensajeReprogramar = null;

    if (!this.nuevaFecha || !this.nuevoHorario) {
      this.mensajeReprogramar = 'Selecciona una fecha y un horario para continuar.';
      return;
    }

    if (this.nuevaFecha < new Date().toISOString().split('T')[0]) {
      this.mensajeReprogramar = 'La fecha no puede ser anterior a hoy.';
      return;
    }

    this.reprogramando = true;
    const [y, m, d] = this.nuevaFecha.split('-');
    const fechaFormateada = `${d}/${m}/${y}`;

    const resultado = await this.citaService.reprogramarCita(
      this.citaAReprogramar.id,
      fechaFormateada,
      this.nuevoHorario
    );

    this.reprogramando = false;

    if (resultado.ok) {
      const cita = this.citas.find(c => c.id === this.citaAReprogramar.id);
      if (cita) {
        cita.fecha = fechaFormateada;
        cita.horario = this.nuevoHorario;
      }
      this.citas = this.ordenarPorFecha(this.citas);
      this.mensajeExitoReprogramar = resultado.mensaje;
      this.cdr.detectChanges();
    } else {
      this.mensajeReprogramar = resultado.mensaje;
      this.cdr.detectChanges();
    }
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
