import { Component, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  @Output() loginExitoso = new EventEmitter<any>();
  @Output() irARegistro = new EventEmitter<void>();

  loginData = {
    correo: '',
    password: ''
  };
  errorLogin: string | null = null;

  constructor(private authService: AuthService, private cdr: ChangeDetectorRef) {}

  async iniciarSesion(evento: Event) {
    evento.preventDefault();
    this.errorLogin = null;

    const result = await this.authService.login(this.loginData);

    if (result.ok) {
      this.loginData = { correo: '', password: '' };
      this.loginExitoso.emit(result.usuario);
    } else {
      this.errorLogin = result.mensaje || 'Error de conexión con el servidor.';
    }
    this.cdr.detectChanges();
  }
}
