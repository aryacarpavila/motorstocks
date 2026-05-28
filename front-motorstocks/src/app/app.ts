import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent implements OnInit {
  constructor(private cdr: ChangeDetectorRef, private http: HttpClient) {}

  ngOnInit() {
    this.cargarAutos();
    const savedUser = localStorage.getItem('usuarioLogueado');
    if (savedUser) {
      this.usuarioLogueado = JSON.parse(savedUser);
      if (this.usuarioLogueado.rol === 'admin') {
        this.cambiarSeccion('admin');
      }
    }
  }

  cargarAutos() {
    this.http.get<any[]>('http://localhost:3000/api/carros').subscribe(data => {
      this.listaCarros = data.reverse();
      this.cdr.detectChanges();
    });
  }

  // Control de navegación entre pantallas
  seccionActiva: 'catalogo' | 'registro' | 'login' | 'usuarios' | 'admin' = 'catalogo';
  tituloCatalogo = 'Concesionario Premium MotorStocks';
  subtitulo = 'Tu próximo auto de altas prestaciones está aquí';

  // Datos extendidos de los autos para el Concesionario
  listaCarros: any[] = [];
  listaUsuarios: any[] = [];
  listaCitas: any[] = [
    { cliente: 'Juan Pérez', auto: 'Tesla Model S', fecha: '2026-06-01', hora: '10:00 AM', estado: 'Pendiente' },
    { cliente: 'María Gómez', auto: 'Porsche 911', fecha: '2026-06-05', hora: '02:30 PM', estado: 'Confirmada' }
  ];

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
    direccion: '',
    combustible: '',
    vin: ''
  };
   autoConEspecificacionesVisibles: string | null = null;
   carroModal: any = null;
   mostrarModalRegistroAuto: boolean = false;

   abrirModal(carro: any) {
     this.carroModal = carro;
   }

   cerrarModal() {
     this.carroModal = null;
   }

   abrirModalRegistroAuto() {
     this.mostrarModalRegistroAuto = true;
   }

   cerrarModalRegistroAuto() {
     this.mostrarModalRegistroAuto = false;
   }
  // NUEVAS VARIABLES PARA MOSTRAR MENSAJES EN LA INTERFAZ
  mensajeError: string | null = null;
  mensajeExito: string | null = null;
  errorCorreo: string | null = null;
  errorFechaNacimiento: string | null = null;
  errorPassword: string | null = null;
  errorTerminos: string | null = null;

  registroData = {
    nombre: '',
    apellido: '',
    correo: '',
    fechaNacimiento: '',
    password: '',
    aceptaTerminos: false
  };

  // Variables para el inicio de sesión
  usuarioLogueado: any = null;
  menuPerfilAbierto: boolean = false;
  errorLogin: string | null = null;
  loginData = {
    correo: '',
    password: ''
  };

  // Cambiar entre vistas
  cambiarSeccion(seccion: 'catalogo' | 'registro' | 'login' | 'admin') {
    this.seccionActiva = seccion;
    this.menuPerfilAbierto = false; // Cierra el menú al navegar
    if (seccion === 'admin') {
      this.cargarUsuarios();
    }
  }

    verDetalles(modelo: string) {
       // Si vuelves a dar clic en el mismo auto, se ocultan. Si no, se muestran las del nuevo auto.
       if (this.autoConEspecificacionesVisibles === modelo) {
         this.autoConEspecificacionesVisibles = null;
      } else {
        this.autoConEspecificacionesVisibles = modelo;
     }
   }


  cotizar(modelo: string) {
    alert(`¡Solicitud recibida! Un asesor de VestIA Motors te contactará para cotizar el ${modelo}.`);
  }

  // Capturar los datos del Formulario de Registro
  async registrarUsuario(evento: Event) {
    evento.preventDefault();
    this.mensajeError = null; // Limpiar errores anteriores
    this.mensajeExito = null;
    this.errorCorreo = null;
    this.errorFechaNacimiento = null;
    this.errorPassword = null;
    this.errorTerminos = null;

    try {
      const respuesta = await fetch('http://localhost:3000/api/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.registroData)
      });
      
      const data = await respuesta.json();

      if (data.ok) {
        // TODO SALIÓ PERFECTO -> SE CREA EL USUARIO
        this.mensajeExito = data.mensaje;
        
        // Limpiar formulario
        this.registroData = {
          nombre: '',
          apellido: '',
          correo: '',
          fechaNacimiento: '',
          password: '',
          aceptaTerminos: false
        };

        this.cdr.detectChanges(); // Fuerza a Angular a pintar la pantalla inmediatamente

        // Redirigir al catálogo después de 2 segundos para que lea el mensaje verde
        setTimeout(() => {
          this.seccionActiva = 'catalogo';
          this.mensajeExito = null;
          this.cdr.detectChanges(); // Fuerza actualización al cambiar de sección
        }, 2500);

      } else {
        // 🔴 ALGO SALIÓ MAL: El servidor no creó nada y pintamos los errores en rojo en la pantalla
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
        this.cdr.detectChanges(); // Fuerza a Angular a mostrar los errores
      }
    } catch (error) {
      this.mensajeError = 'Error crítico: No hay conexión con las políticas de seguridad de la plataforma.';
      this.cdr.detectChanges(); // Fuerza a Angular a mostrar el error
    }
  }

  // ==========================================
  // LÓGICA DE INICIO Y CIERRE DE SESIÓN
  // ==========================================
  async iniciarSesion(evento: Event) {
    evento.preventDefault();
    this.errorLogin = null;

    try {
      const respuesta = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.loginData)
      });
      
      const data = await respuesta.json();

      if (data.ok) {
        // Guardamos el usuario en memoria y localStorage
        this.usuarioLogueado = data.usuario;
        localStorage.setItem('usuarioLogueado', JSON.stringify(data.usuario));
        
        // Limpiamos los campos
        this.loginData = { correo: '', password: '' };
        
        // Redirigimos según el rol
        if (this.usuarioLogueado.rol === 'admin') {
          this.cambiarSeccion('admin');
        } else {
          this.seccionActiva = 'catalogo';
        }
        this.cdr.detectChanges();
      } else {
        this.errorLogin = data.mensaje;
        this.cdr.detectChanges();
      }
    } catch (error) {
      this.errorLogin = 'Error de conexión con el servidor.';
      this.cdr.detectChanges();
    }
  }

  toggleMenuPerfil() {
    this.menuPerfilAbierto = !this.menuPerfilAbierto;
    this.cdr.detectChanges();
  }

  cerrarSesion() {
    this.usuarioLogueado = null;
    localStorage.removeItem('usuarioLogueado');
    this.menuPerfilAbierto = false;
    this.seccionActiva = 'catalogo';
    this.cdr.detectChanges();
  }

  // ==========================================
  // FUNCIONES DE ADMINISTRADOR
  // ==========================================
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

  formatearPrecioInput(valor: string) {
    let numerico = valor.replace(/\D/g, '');
    if (numerico === '') {
      this.nuevoAuto.precio = '';
      return;
    }
    this.nuevoAuto.precio = '$' + parseInt(numerico, 10).toLocaleString('en-US');
  }

  agregarAuto(evento: Event) {
    evento.preventDefault();
    
    // Validación de campos obligatorios
    const auto = this.nuevoAuto;
    if (!auto.marca || !auto.modelo || !auto.precio || !auto.ano || !auto.imagen || !auto.vin) {
      alert('Por favor, completa los campos obligatorios: Marca, Modelo, Precio, Año, Número de VIN e Imagen.');
      return;
    }

    // Validación de precio positivo
    const precioNumerico = parseFloat(auto.precio.replace(/[^0-9.-]+/g, ""));
    if (isNaN(precioNumerico) || precioNumerico <= 0) {
      alert('Por favor, ingresa un precio válido y mayor a 0.');
      return;
    }

    // Validación de año (entre 1900 y el año actual + 1)
    const anoNumerico = parseInt(auto.ano, 10);
    const anoMaximo = new Date().getFullYear() + 1;
    if (isNaN(anoNumerico) || anoNumerico < 1900 || anoNumerico > anoMaximo) {
      alert(`Por favor, ingresa un año válido entre 1900 y ${anoMaximo}.`);
      return;
    }

    // Añadimos el auto a la base de datos JSON
    this.http.post('http://localhost:3000/api/carros', this.nuevoAuto).subscribe(() => {
      this.cargarAutos();
      
      // Limpiamos el formulario
      this.nuevoAuto = {
        marca: '', modelo: '', precio: '', ano: '', kilometraje: '', imagen: '', motor: '', transmision: '', blindaje: '', color: '', direccion: '', combustible: '', vin: ''
      };
      alert('¡Auto agregado exitosamente a la base de datos!');
      this.mostrarModalRegistroAuto = false;
      this.cdr.detectChanges();
    }, error => {
      if (error.error && error.error.mensaje) {
        alert(error.error.mensaje);
      } else {
        alert('Error al conectar con la base de datos JSON.');
      }
    });
  }

  mostrarProximamente() {
    alert('Próximamente se hará, confía');
  }

  cambiarEstadoCita(cita: any, estado: string) {
    cita.estado = estado;
    this.cdr.detectChanges();
  }

  verDetallesCita(cita: any) {
    alert(`Cargando información completa de la cita con ${cita.cliente}...`);
  }
}