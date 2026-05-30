import { Component, ChangeDetectorRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { CarrosService } from './services/carros.service';
import { CatalogoComponent } from './components/catalogo/catalogo.component';
import { LoginComponent } from './components/login/login.component';
import { RegistroComponent } from './components/registro/registro.component';
import { AdminComponent } from './components/admin/admin.component';
import { PerfilComponent } from './components/perfil/perfil.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterOutlet,
    CatalogoComponent,
    LoginComponent,
    RegistroComponent,
    AdminComponent,
    PerfilComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent implements OnInit {
  @ViewChild(CatalogoComponent) catalogoRef!: CatalogoComponent;

  seccionActiva: 'catalogo' | 'registro' | 'login' | 'admin' | 'perfil' | 'route' | 'logout' = 'catalogo';
  usuarioLogueado: any = null;
  menuPerfilAbierto: boolean = false;
  _nombreLogout = '';
  listaCarrosAdmin: any[] = [];

  constructor(
    private cdr: ChangeDetectorRef,
    private router: Router,
    private authService: AuthService,
    private carrosService: CarrosService
  ) {
    this.router.events.subscribe((e) => {
      if (e instanceof NavigationEnd) {
        const url = e.urlAfterRedirects;
        if (url === '/' || url === '') {
          const pendingSection = localStorage.getItem('pendingSection');
          if (pendingSection) {
            localStorage.removeItem('pendingSection');
            this.seccionActiva = pendingSection as any;
          } else if (this.seccionActiva === 'route') {
            this.seccionActiva = 'catalogo';
          }
        } else {
          this.seccionActiva = 'route';
        }
        this.cdr.detectChanges();
      }
    });
  }

  ngOnInit() {
    const savedUser = localStorage.getItem('usuarioLogueado');
    if (savedUser) {
      this.usuarioLogueado = JSON.parse(savedUser);
      if (this.usuarioLogueado.rol === 'admin') {
        this.cambiarSeccion('admin');
        this.cargarCarrosAdmin();
      }
    }
  }

  cargarCarrosAdmin() {
    this.carrosService.getCarros().subscribe(data => {
      this.listaCarrosAdmin = data;
      this.cdr.detectChanges();
    });
  }

  cambiarSeccion(seccion: 'catalogo' | 'registro' | 'login' | 'admin' | 'perfil') {
    if (this.seccionActiva === 'route') {
      localStorage.setItem('pendingSection', seccion);
      this.router.navigate(['/']);
    } else {
      this.seccionActiva = seccion;
      this.menuPerfilAbierto = false;
      if (seccion === 'admin') {
        this.cargarCarrosAdmin();
      }
    }
    this.cdr.detectChanges();
  }

  irAHistorialCitas() {
    this.router.navigate(['/historial-citas']);
  }

  onLoginExitoso(usuario: any) {
    this.usuarioLogueado = usuario;
    if (usuario.rol === 'admin') {
      this.cambiarSeccion('admin');
    } else {
      this.seccionActiva = 'catalogo';
    }
    this.cdr.detectChanges();
  }

  onRegistroExitoso() {
    this.seccionActiva = 'catalogo';
    this.cdr.detectChanges();
  }

  toggleMenuPerfil() {
    this.menuPerfilAbierto = !this.menuPerfilAbierto;
    this.cdr.detectChanges();
  }

  cerrarSesion() {
    const nombre = this.authService.cerrarSesion();
    this.usuarioLogueado = null;
    this.menuPerfilAbierto = false;
    this.seccionActiva = 'logout';
    this._nombreLogout = nombre;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.seccionActiva = 'catalogo';
      this.router.navigate(['/']);
      this.cdr.detectChanges();
    }, 2000);
  }

  mostrarProximamente() {
    alert('Próximamente se hará, confía');
  }

  onSolicitarRegistroAuto() {
    // Abrir el modal de registro de auto en el componente catalogo
    if (this.catalogoRef) {
      this.catalogoRef.abrirModalRegistroAuto();
    }
  }
}
