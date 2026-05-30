import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CarrosService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  getCarros(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/carros`);
  }

  registrarCarro(carro: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/carros`, carro);
  }
}
