import { Routes } from '@angular/router';
import { AgendarCitaComponent } from './agendar-cita/agendar-cita.component';
import { HistorialCitasComponent } from './historial-citas/historial-citas.component';

export const routes: Routes = [
  { path: 'agendar-cita/:idVehiculo', component: AgendarCitaComponent },
  { path: 'historial-citas',          component: HistorialCitasComponent }
];
