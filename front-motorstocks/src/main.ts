import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app'; // <-- Asegúrate de que apunte a AppComponent

bootstrapApplication(AppComponent, appConfig) // <-- Aquí también debe decir AppComponent
  .catch((err) => console.error(err));
