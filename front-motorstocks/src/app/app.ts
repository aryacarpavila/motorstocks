import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent {
  // Control de navegación entre pantallas
  seccionActiva: 'catalogo' | 'registro' = 'catalogo';
  tituloCatalogo = 'Concesionario Premium MotorStocks';
  subtitulo = 'Tu próximo auto de altas prestaciones está aquí';

  // Datos extendidos de los autos para el Concesionario
  listaCarros = [
    {
      marca: 'Tesla',
      modelo: 'Model S Plaid',
      precio: '$89,990',
      ano: '2025',
      kilometraje: '0 km (Nuevo)',
      imagen: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=600',
      motor: 'Eléctrico (1,020 hp)',
      transmision: 'Automática'
    },
    {
      marca: 'Porsche',
      modelo: '911 Carrera GTS',
      precio: '$140,900',
      ano: '2024',
      kilometraje: '4,200 km',
      imagen: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=600',
      motor: '3.0L Twin-Turbo Flat-6',
      transmision: 'PDK 8 vel.'
    },
    {
      marca: 'BMW',
      modelo: 'M4 Competition',
      precio: '$78,100',
      ano: '2025',
      kilometraje: '0 km (Nuevo)',
      imagen: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=600',
      motor: '3.0L TwinPower Turbo',
      transmision: 'Aut. M 8 vel.'
    },
    {
      marca: 'Audi',
      modelo: 'RS e-tron GT',
      precio: '$106,500',
      ano: '2023',
      kilometraje: '12,500 km',
      imagen: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&q=80&w=600',
      motor: 'Eléctrico (637 hp)',
      transmision: 'Automática'
    }
  ];

  // Cambiar entre la vista de catálogo y la de registro
  cambiarSeccion(seccion: 'catalogo' | 'registro') {
    this.seccionActiva = seccion;
  }

  verDetalles(modelo: string) {
    alert(`Cargando ficha técnica completa del ${modelo}...`);
  }

  cotizar(modelo: string) {
    alert(`¡Solicitud recibida! Un asesor de VestIA Motors te contactará para cotizar el ${modelo}.`);
  }

  // Capturar los datos del Formulario de Registro
  registrarUsuario(evento: Event) {
    evento.preventDefault(); // Evita que la página se recargue por el formulario
    
    // Obtenemos los valores de los inputs usando JS nativo
    const nombreInput = document.getElementById('nombre') as HTMLInputElement;
    const correoInput = document.getElementById('correo') as HTMLInputElement;
    const passwordInput = document.getElementById('password') as HTMLInputElement;

    const datosUsuario = {
      nombre: nombreInput.value,
      correo: correoInput.value,
      password: passwordInput.value
    };

    fetch('http://localhost:3000/api/registro', {
      method: 'POST', // Método que definimos en Node.js
      headers: {
        'Content-Type': 'application/json' // Le avisamos al servidor que va un JSON
      },
      body: JSON.stringify(datosUsuario) // Convertimos el objeto a texto plano para el envío
    })
    .then(respuesta => respuesta.json()) // Convertimos la respuesta del servidor a un objeto legible
    .then(data => {
      // Si el backend responde con éxito
      if (data.ok) {
        alert(`¡Servidor Node.js responde!: ${data.mensaje}`);
        
        // Limpiamos los campos del formulario para que queden vacíos
        nombreInput.value = '';
        correoInput.value = '';
        passwordInput.value = '';

        // Redirigimos al usuario al catálogo automáticamente
        this.seccionActiva = 'catalogo';
      } else {
        alert(`Error en el servidor: ${data.mensaje}`);
      }
    })
    .catch(error => {
      // Si el servidor está apagado o no se puede conectar
      console.error('Error de conexión:', error);
      alert('No se pudo conectar con el Backend. ¿Te aseguraste de encenderlo con "node server.js"?');
    });
    
    this.seccionActiva = 'catalogo';
  }
}