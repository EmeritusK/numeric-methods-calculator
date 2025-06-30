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
    // Inicialización
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
    if (!this.ctx) return;

    // No graficar si la función contiene 'y' y el método no es EDO
    const functionStr = this.functionForm.get('function')?.value || '';
    if (functionStr.includes('y') && this.selectedMethod !== 'edo') {
      // Limpiar el canvas
      const canvas = this.chartCanvas.nativeElement;
      this.ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const canvas = this.chartCanvas.nativeElement;
    const width = canvas.width;
    const height = canvas.height;

    // Limpiar canvas
    this.ctx.clearRect(0, 0, width, height);

    // Configurar estilos
    this.ctx.strokeStyle = '#2196F3';
    this.ctx.lineWidth = 2;
    this.ctx.fillStyle = '#333';
    this.ctx.font = '12px Arial';

    // Dibujar ejes
    this.ctx.beginPath();
    this.ctx.moveTo(50, height / 2);
    this.ctx.lineTo(width - 50, height / 2);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(width / 2, 50);
    this.ctx.lineTo(width / 2, height - 50);
    this.ctx.stroke();

    // Dibujar función
    this.ctx.strokeStyle = '#4CAF50';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();

    const xMin = this.functionForm.get('xMin')?.value || -5;
    const xMax = this.functionForm.get('xMax')?.value || 5;

    // Generar puntos para graficar
    this.plotPoints = this.numericService.generatePlotPoints(
      this.functionForm.get('function')?.value || 'x^2 - 4',
      xMin,
      xMax,
      200
    );

    if (this.plotPoints.length > 0) {
      const yMin = Math.min(...this.plotPoints.map(p => p.y));
      const yMax = Math.max(...this.plotPoints.map(p => p.y));
      const yRange = yMax - yMin;

      // Ajustar rango Y si es muy pequeño
      const adjustedYMin = yRange < 0.1 ? yMin - 1 : yMin;
      const adjustedYMax = yRange < 0.1 ? yMax + 1 : yMax;

      this.ctx.moveTo(
        this.mapX(this.plotPoints[0].x, xMin, xMax, 50, width - 50),
        this.mapY(this.plotPoints[0].y, adjustedYMin, adjustedYMax, height - 50, 50)
      );

      for (let i = 1; i < this.plotPoints.length; i++) {
        const point = this.plotPoints[i];
        const canvasX = this.mapX(point.x, xMin, xMax, 50, width - 50);
        const canvasY = this.mapY(point.y, adjustedYMin, adjustedYMax, height - 50, 50);

        if (isFinite(canvasX) && isFinite(canvasY)) {
          this.ctx.lineTo(canvasX, canvasY);
        }
      }

      this.ctx.stroke();
    }

    // Dibujar etiquetas
    this.ctx.fillStyle = '#333';
    this.ctx.fillText('x', width - 30, height / 2 + 20);
    this.ctx.fillText('f(x)', width / 2 - 20, 30);

    // Dibujar valores en los ejes
    this.ctx.font = '10px Arial';
    this.ctx.fillText(xMin.toString(), 50, height / 2 + 15);
    this.ctx.fillText(xMax.toString(), width - 60, height / 2 + 15);
  }

  mapX(x: number, xMin: number, xMax: number, canvasMin: number, canvasMax: number): number {
    return ((x - xMin) / (xMax - xMin)) * (canvasMax - canvasMin) + canvasMin;
  }

  mapY(y: number, yMin: number, yMax: number, canvasMin: number, canvasMax: number): number {
    return ((y - yMin) / (yMax - yMin)) * (canvasMax - canvasMin) + canvasMin;
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
