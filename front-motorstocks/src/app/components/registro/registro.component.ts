import { Component, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './registro.component.html'
})
export class RegistroComponent {
  @Output() registroExitoso = new EventEmitter<void>();
  @Output() irALogin = new EventEmitter<void>();

  registroData = {
    nombre: '',
    apellido: '',
    correo: '',
    fechaNacimiento: '',
    password: '',
    aceptaTerminos: false
  };

  mensajeError: string | null = null;
  mensajeExito: string | null = null;
  errorCorreo: string | null = null;
  errorFechaNacimiento: string | null = null;
  errorPassword: string | null = null;
  errorTerminos: string | null = null;

  constructor(private authService: AuthService, private cdr: ChangeDetectorRef) {}

  async registrarUsuario(evento: Event) {
    evento.preventDefault();
    this.mensajeError = null;
    this.mensajeExito = null;
    this.errorCorreo = null;
    this.errorFechaNacimiento = null;
    this.errorPassword = null;
    this.errorTerminos = null;

    const data = await this.authService.registro(this.registroData);

    if (data.ok) {
      this.mensajeExito = data.mensaje || '';
      this.registroData = {
        nombre: '', apellido: '', correo: '', fechaNacimiento: '', password: '', aceptaTerminos: false
      };
      this.cdr.detectChanges();
      setTimeout(() => {
        this.mensajeExito = null;
        this.registroExitoso.emit();
        this.cdr.detectChanges();
      }, 2500);
    } else {
      if (data.errores && data.errores.length > 0) {
        data.errores.forEach((err: any) => {
          if (err.campo === 'correo') {
            this.errorCorreo = `${err.mensaje} Por favor, ingrese los datos de nuevo.`;
          } else if (err.campo === 'fechaNacimiento') {
            this.errorFechaNacimiento = `${err.mensaje} Por favor, ingrese los datos de nuevo.`;
          } else if (err.campo === 'password') {
            this.errorPassword = `${err.mensaje} Por favor, ingrese los datos de nuevo.`;
          } else if (err.campo === 'terminos') {
            this.errorTerminos = `${err.mensaje} Por favor, ingrese los datos de nuevo.`;
          } else if (err.campo === 'general') {
            this.mensajeError = `${err.mensaje} Por favor, revisa todos los campos.`;
          }
        });
      } else if (data.mensaje) {
        this.mensajeError = `${data.mensaje} Por favor, ingrese los datos de nuevo.`;
      } else {
        this.mensajeError = 'Ocurrió un error desconocido durante el registro.';
      }
      this.cdr.detectChanges();
    }
  }
}
