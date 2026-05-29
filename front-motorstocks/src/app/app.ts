import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent implements OnInit {
  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    const savedUser = localStorage.getItem('usuarioLogueado');
    if (savedUser) {
      this.usuarioLogueado = JSON.parse(savedUser);
      if (this.usuarioLogueado.rol === 'admin') {
        this.cambiarSeccion('admin');
      }
    }
  }

  // Control de navegación entre pantallas
  seccionActiva: 'catalogo' | 'registro' | 'login' | 'usuarios' | 'admin' = 'catalogo';

  // Estado de orden de compra
  mostrarModalOrden: boolean = false;
  carroSeleccionadoParaCompra: any = null;
  procesandoOrden: boolean = false;
  errorOrden: string | null = null;
  ordenConfirmada: any = null;
  tituloCatalogo = 'Concesionario Premium MotorStocks';
  subtitulo = 'Tu próximo auto de altas prestaciones está aquí';

  // Datos extendidos de los autos para el Concesionario
  listaCarros: any[] = [
    {
      marca: 'Tesla',
      modelo: 'Model S Plaid',
      precio: '$89,990',
      ano: '2025',
      kilometraje: '0 km (Nuevo)',
      imagen: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=600',
      motor: 'Eléctrico (1,020 hp)',
      transmision: 'Automática',
      blindaje: 'Ninguno',
      color: 'Blanco',
      direccion: 'Electrica',
      combustible: 'Electrico',
      reservado: false
    },
    {
      marca: 'Porsche',
      modelo: '911 Carrera GTS',
      precio: '$140,900',
      ano: '2024',
      kilometraje: '4,200 km',
      imagen: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=600',
      motor: '3.0L Twin-Turbo Flat-6',
      transmision: 'PDK 8 vel.',
      blindaje: 'Ninguno',
      color: 'Negro',
      direccion: 'Hidraulica',
      combustible: 'Gasolina',
      reservado: false
    },
    {
      marca: 'BMW',
      modelo: 'M4 Competition',
      precio: '$78,100',
      ano: '2025',
      kilometraje: '0 km (Nuevo)',
      imagen: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=600',
      motor: '3.0L TwinPower Turbo',
      transmision: 'Aut. M 8 vel.',
      blindaje: 'Ninguno',
      color: 'Blanco',
      direccion: 'Hidraulica',
      combustible: 'Gasolina',
      reservado: false
    },
    {
      marca: 'Audi',
      modelo: 'RS e-tron GT',
      precio: '$106,500',
      ano: '2023',
      kilometraje: '12,500 km',
      imagen: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&q=80&w=600',
      motor: 'Eléctrico (637 hp)',
      transmision: 'Automática',
      blindaje: 'Ninguno',
      color: 'Gris',
      direccion: 'Hidraulica',
      combustible: 'Gasolina',
      reservado: false
    }
  ];
  listaUsuarios: any[] = [];
  listaOrdenes: any[] = [];
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
    this.menuPerfilAbierto = false;
    if (seccion === 'admin') {
      this.cargarUsuarios();
      this.cargarOrdenes();
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

  agregarAuto(evento: Event) {
    evento.preventDefault();
    
    // Validación de campos obligatorios
    const auto = this.nuevoAuto;
    if (!auto.marca || !auto.modelo || !auto.precio || !auto.ano || !auto.imagen || !auto.vin) {
      alert('Por favor, completa los campos obligatorios: Marca, Modelo, Precio, Año, Número de VIN e Imagen.');
      return;
    }

    // Añadimos el auto al principio de la lista (con estado de reserva en false)
    this.listaCarros.unshift({ ...this.nuevoAuto, reservado: false });
    
    // Limpiamos el formulario
    this.nuevoAuto = {
      marca: '', modelo: '', precio: '', ano: '', kilometraje: '', imagen: '', motor: '', transmision: '', blindaje: '', color: '', direccion: '', combustible: '', vin: ''
    };
    alert('¡Auto agregado exitosamente al catálogo!');
    this.mostrarModalRegistroAuto = false;
    this.cdr.detectChanges();
  }

  // ==========================================
  // LÓGICA DE ORDEN DE COMPRA
  // ==========================================
  iniciarCompra(carro: any) {
    if (!this.usuarioLogueado) {
      // Si no está logueado, lo redirigimos al login
      this.carroModal = null;
      this.cambiarSeccion('login');
      return;
    }
    if (carro.reservado) {
      return; // No hacer nada si ya está reservado
    }
    this.carroSeleccionadoParaCompra = carro;
    this.errorOrden = null;
    this.ordenConfirmada = null;
    this.mostrarModalOrden = true;
    this.carroModal = null; // Cerramos el modal de especificaciones
    this.cdr.detectChanges();
  }

  cerrarModalOrden() {
    this.mostrarModalOrden = false;
    this.carroSeleccionadoParaCompra = null;
    this.errorOrden = null;
    this.ordenConfirmada = null;
    this.cdr.detectChanges();
  }

  cerrarRecibo() {
    this.ordenConfirmada = null;
    this.mostrarModalOrden = false;
    this.carroSeleccionadoParaCompra = null;
    this.cdr.detectChanges();
  }

  async generarOrden() {
    if (!this.usuarioLogueado || !this.carroSeleccionadoParaCompra) return;

    this.procesandoOrden = true;
    this.errorOrden = null;
    this.cdr.detectChanges();

    try {
      const payload = {
        usuarioId: this.usuarioLogueado.id,
        usuarioNombre: this.usuarioLogueado.nombre,
        usuarioApellido: this.usuarioLogueado.apellido,
        usuarioCorreo: this.usuarioLogueado.correo,
        auto: this.carroSeleccionadoParaCompra
      };

      const respuesta = await fetch('http://localhost:3000/api/orden', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await respuesta.json();

      if (data.ok) {
        // Marcar el auto como reservado localmente en la lista
        const carroEnLista = this.listaCarros.find(
          c => c.marca === this.carroSeleccionadoParaCompra.marca &&
               c.modelo === this.carroSeleccionadoParaCompra.modelo
        );
        if (carroEnLista) {
          carroEnLista.reservado = true;
        }
        // Guardar la orden para mostrar el recibo
        this.ordenConfirmada = data.orden;
      } else {
        this.errorOrden = data.mensaje;
      }
    } catch (error) {
      this.errorOrden = 'Error de conexión con el servidor. No se pudo generar la orden.';
    } finally {
      this.procesandoOrden = false;
      this.cdr.detectChanges();
    }
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