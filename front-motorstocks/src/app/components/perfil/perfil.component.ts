import { Component, Input, OnInit, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrdenesService } from '../../services/ordenes.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.component.html'
})
export class PerfilComponent implements OnInit {
  @Input() usuarioLogueado: any = null;
  @Output() irACatalogo = new EventEmitter<void>();

  misOrdenes: any[] = [];

  constructor(private ordenesService: OrdenesService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.cargarMisOrdenes();
  }

  async cargarMisOrdenes() {
    if (!this.usuarioLogueado) return;
    const data = await this.ordenesService.getMisOrdenes(this.usuarioLogueado.id);
    if (data.ok) {
      this.misOrdenes = data.ordenes || [];
      this.cdr.detectChanges();
    }
  }
}
