import { Component, Input, Output, EventEmitter, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CarrosService } from '../../services/carros.service';
import { OrdenesService } from '../../services/ordenes.service';
import { CitaService } from '../../services/cita.service';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './catalogo.component.html'
})
export class CatalogoComponent implements OnInit {
  @Input() usuarioLogueado: any = null;
  @Output() irALogin = new EventEmitter<void>();
  @Output() irASeccion = new EventEmitter<string>();

  listaCarros: any[] = [];

  // Filtros
  busqueda: string = '';
  filtroMarca: string = '';
  filtroCombustible: string = '';
  filtroPrecioMin: string = '';
  filtroPrecioMax: string = '';
  soloDisponibles: boolean = false;
  filtroTipo: string = '';
  ordenarPor: string = 'precio_asc';

  get marcasDisponibles(): string[] {
    const marcas = this.listaCarros.map(c => c.marca).filter(m => m);
    return [...new Set(marcas)].sort();
  }

  get carrosFiltrados(): any[] {
    const filtrados = this.listaCarros.filter(carro => {
      if (this.busqueda) {
        const texto = this.busqueda.toLowerCase();
        if (!carro.marca?.toLowerCase().includes(texto) && !carro.modelo?.toLowerCase().includes(texto)) return false;
      }
      if (this.filtroMarca && carro.marca !== this.filtroMarca) return false;
      if (this.filtroTipo && carro.tipo !== this.filtroTipo) return false;
      if (this.filtroCombustible && !carro.combustible?.toLowerCase().includes(this.filtroCombustible.toLowerCase())) return false;
      if (this.soloDisponibles && carro.reservado) return false;
      const precio = parseFloat(carro.precio?.replace(/[^0-9.]+/g, '') || '0');
      if (this.filtroPrecioMin && precio < parseFloat(this.filtroPrecioMin)) return false;
      if (this.filtroPrecioMax && precio > parseFloat(this.filtroPrecioMax)) return false;
      return true;
    });

    if (!this.ordenarPor) return filtrados;

    const parsePrecio = (c: any) => parseFloat(c.precio?.replace(/[^0-9.]+/g, '') || '0');
    const parseKm    = (c: any) => parseInt(c.kilometraje?.replace(/[^0-9]/g, '') || '0', 10);

    return [...filtrados].sort((a, b) => {
      switch (this.ordenarPor) {
        case 'precio_asc':  return parsePrecio(a) - parsePrecio(b);
        case 'precio_desc': return parsePrecio(b) - parsePrecio(a);
        case 'km_asc':      return parseKm(a) - parseKm(b);
        case 'km_desc':     return parseKm(b) - parseKm(a);
        default: return 0;
      }
    });
  }

  get hayFiltrosSidebar(): boolean {
    return !!(this.busqueda || this.filtroMarca || this.filtroTipo || this.filtroCombustible || this.filtroPrecioMin || this.filtroPrecioMax || this.soloDisponibles);
  }

  get hayFiltrosActivos(): boolean {
    return this.hayFiltrosSidebar;
  }

  limpiarFiltros() {
    this.busqueda = '';
    this.filtroMarca = '';
    this.filtroTipo = '';
    this.filtroCombustible = '';
    this.filtroPrecioMin = '';
    this.filtroPrecioMax = '';
    this.soloDisponibles = false;
    this.ordenarPor = 'precio_asc';
    this.cdr.detectChanges();
  }

  carroModal: any = null;

  // Modal orden de compra
  mostrarModalOrden: boolean = false;
  carroSeleccionadoParaCompra: any = null;
  procesandoOrden: boolean = false;
  errorOrden: string | null = null;
  ordenConfirmada: any = null;

  constructor(
    private cdr: ChangeDetectorRef,
    private router: Router,
    private carrosService: CarrosService,
    private ordenesService: OrdenesService,
    private citaService: CitaService
  ) {}

  ngOnInit() {
    this.cargarAutos();
  }

  cargarAutos() {
    this.carrosService.getCarros().subscribe(data => {
      this.listaCarros = data.reverse();
      this.cdr.detectChanges();
    });
  }

  abrirModal(carro: any) {
    this.carroModal = carro;
  }

  cerrarModal() {
    this.carroModal = null;
  }

  mostrarProximamente() {
    alert('Próximamente se hará, confía');
  }

  irAAgendarCita(carro: any) {
    if (!this.usuarioLogueado) {
      this.irALogin.emit();
      return;
    }
    this.citaService.vehiculoSeleccionado = carro;
    this.router.navigate(['/agendar-cita', carro.id]);
  }

  iniciarCompra(carro: any) {
    if (!this.usuarioLogueado) {
        this.irALogin.emit();
      return;
    }
    if (carro.reservado) {
      return;
    }
    this.carroSeleccionadoParaCompra = carro;
    this.errorOrden = null;
    this.ordenConfirmada = null;
    this.mostrarModalOrden = true;
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

    const payload = {
      usuarioId: this.usuarioLogueado.id,
      usuarioNombre: this.usuarioLogueado.nombre,
      usuarioApellido: this.usuarioLogueado.apellido,
      usuarioCorreo: this.usuarioLogueado.correo,
      auto: this.carroSeleccionadoParaCompra
    };

    const data = await this.ordenesService.generarOrden(payload);

    if (data.ok) {
      const carroEnLista = this.listaCarros.find(
        c => c.marca === this.carroSeleccionadoParaCompra.marca &&
             c.modelo === this.carroSeleccionadoParaCompra.modelo
      );
      if (carroEnLista) {
        carroEnLista.reservado = true;
      }
      this.ordenConfirmada = data.orden;
    } else {
      this.errorOrden = data.mensaje || null;
    }

    this.procesandoOrden = false;
    this.cdr.detectChanges();
  }

}
