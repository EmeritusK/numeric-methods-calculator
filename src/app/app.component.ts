import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTableModule } from '@angular/material/table';
import { NumericMethodsService, NewtonRaphsonResult, SimpsonResult, EDOResult } from './numeric-methods.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as Plotly from 'plotly.js-dist-min';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    FormsModule,
    ReactiveFormsModule,
    MatSidenavModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatListModule,
    MatDividerModule,
    MatIconModule,
    MatExpansionModule,
    MatTabsModule,
    MatToolbarModule,
    MatTableModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, AfterViewInit {
  title = 'Calculadora de Métodos Numéricos';

  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;

  // Formularios
  functionForm: FormGroup;
  methodForm: FormGroup;

  // Métodos numéricos disponibles
  numericMethods = [
    { id: 'newton', name: 'Método de Newton-Raphson', description: 'Método iterativo para encontrar raíces' },
    { id: 'simpson', name: 'Método de Simpson 1/3', description: 'Integración numérica con límites' },
    { id: 'edo', name: 'Runge-Kutta 4', description: 'Solución de ecuaciones diferenciales' }
  ];

  selectedMethod = 'newton';

  // Resultados
  results: any[] = [];
  plotPoints: { x: number, y: number }[] = [];

  constructor(
    private fb: FormBuilder,
    private numericService: NumericMethodsService,
    private snackBar: MatSnackBar
  ) {
    this.functionForm = this.fb.group({
      function: ['x^2 - 4', Validators.required],
      xMin: [-5, Validators.required],
      xMax: [5, Validators.required]
    });

    this.methodForm = this.fb.group({
      tolerance: [0.0001, [Validators.required, Validators.min(0.000001)]],
      maxIterations: [100, [Validators.required, Validators.min(1), Validators.max(1000)]],
      initialGuess: [1, Validators.required],
      intervalA: [-2, Validators.required],
      intervalB: [2, Validators.required],
      // Parámetros adicionales para Simpson y EDO
      n: [10, [Validators.required, Validators.min(2), Validators.max(1000)]],
      stepSize: [0.1, [Validators.required, Validators.min(0.001)]],
      initialY: [0, Validators.required],
      finalX: [1, Validators.required]
    });
  }

  ngOnInit() {
    this.functionForm.valueChanges.subscribe(() => {
      this.updateChart();
    });
  }

  ngAfterViewInit() {
    this.initChart();
  }

  initChart() {
    if (this.chartCanvas) {
      const canvas = this.chartCanvas.nativeElement;
      this.ctx = canvas.getContext('2d')!;
      this.updateChart();
    }
  }

  updateChart() {
    const functionStr = this.functionForm.get('function')?.value || '';
    // No graficar si es una ecuación diferencial y el método no es EDO
    if (functionStr.includes('y') && this.selectedMethod !== 'edo') {
      Plotly.purge('plotlyChart'); // Limpia el gráfico si existe
      return;
    }
    const xMin = this.functionForm.get('xMin')?.value || -5;
    const xMax = this.functionForm.get('xMax')?.value || 5;
    const plotPoints = this.numericService.generatePlotPoints(functionStr, xMin, xMax, 200);

    const x = plotPoints.map(p => p.x);
    const y = plotPoints.map(p => p.y);

    const layout = {
      margin: { t: 30, l: 50, r: 30, b: 50 },
      xaxis: { title: 'x' },
      yaxis: { title: 'f(x)' },
      autosize: true
    };

    Plotly.newPlot('plotlyChart', [{
      x, y, type: 'scatter', mode: 'lines', line: { color: '#4CAF50' }
    }], {
      ...layout,
      width: document.getElementById('plotlyChart')?.offsetWidth || 800,
      height: document.getElementById('plotlyChart')?.offsetHeight || 400
    }, { responsive: true, scrollZoom: true });
  }

  onMethodChange(methodId: string) {
    this.selectedMethod = methodId;
  }

  calculate() {
    const functionStr = this.functionForm.get('function')?.value;
    const tolerance = this.methodForm.get('tolerance')?.value;
    const maxIterations = this.methodForm.get('maxIterations')?.value;

    // Control: si la función contiene 'y' y el método no es EDO, mostrar snackbar y salir inmediatamente
    if (functionStr.includes('y') && this.selectedMethod !== 'edo') {
      this.snackBar.open('¡Error! Has ingresado la variable "y". Selecciona el método de EDO (RK4) para ecuaciones diferenciales.', 'Cerrar', {
        duration: 4000,
        panelClass: ['snackbar-error']
      });
      this.results = [];
      // Limpiar la gráfica si existe
      if (this.ctx && this.chartCanvas) {
        const canvas = this.chartCanvas.nativeElement;
        this.ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    try {
      switch (this.selectedMethod) {
        case 'newton':
          const x0 = this.methodForm.get('initialGuess')?.value;
          this.results = this.numericService.newtonRaphson(functionStr, x0, tolerance, maxIterations);
          break;

        case 'simpson':
          const a = this.methodForm.get('intervalA')?.value;
          const b = this.methodForm.get('intervalB')?.value;
          const n = this.methodForm.get('n')?.value;
          const simpsonResult = this.numericService.simpsonOneThird(functionStr, a, b, n);
          this.results = [{
            iteration: 1,
            x: simpsonResult.integral,
            fx: simpsonResult.error,
            error: simpsonResult.h
          }];
          break;

        case 'edo':
          const x0Edo = this.methodForm.get('initialGuess')?.value;
          const y0 = this.methodForm.get('initialY')?.value;
          const h = this.methodForm.get('stepSize')?.value;
          const xFinal = this.methodForm.get('finalX')?.value;
          const steps = Math.round((xFinal - x0Edo) / h);
          const edoResults = this.numericService.rungeKutta4(functionStr, x0Edo, y0, h, steps);
          this.results = edoResults.map((result, index) => ({
            iteration: index + 1,
            x: result.x,
            fx: result.y,
            error: result.k1,
            k2: result.k2,
            k3: result.k3,
            k4: result.k4
          }));
          break;
      }

      // Actualizar gráfico
      this.updateChart();

    } catch (error) {
      console.error('Error en el cálculo:', error);
      this.results = [];
    }
  }

  clearResults() {
    this.results = [];
  }

  // Método para obtener las columnas de la tabla según el método seleccionado
  getTableColumns(): string[] {
    switch (this.selectedMethod) {
      case 'newton':
        return ['iteration', 'x', 'fx', 'fPrimeX', 'nmr', 'error'];
      case 'simpson':
        return ['iteration', 'x', 'fx', 'error'];
      case 'edo':
        return ['iteration', 'x', 'fx', 'error', 'k2', 'k3', 'k4'];
      default:
        return ['iteration', 'x', 'fx', 'error'];
    }
  }

  // Método para obtener el nombre del método seleccionado
  getMethodName(methodId: string): string {
    const method = this.numericMethods.find(m => m.id === methodId);
    return method ? method.name : '';
  }
}
