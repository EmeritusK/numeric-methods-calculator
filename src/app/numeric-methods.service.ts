import { Injectable } from '@angular/core';

export interface NewtonRaphsonResult {
  iteration: number;
  x: number;
  fx: number;
  fPrimeX: number;
  nmr: number;
  error: number;
}

export interface SimpsonResult {
  n: number;
  h: number;
  integral: number;
  error: number;
}

export interface EDOResult {
  x: number;
  y: number;
  k1: number;
  k2: number;
  k3: number;
  k4: number;
}

@Injectable({
  providedIn: 'root'
})
export class NumericMethodsService {

  constructor() { }

  // Evaluador de funciones matemáticas
  evaluateFunction(expression: string, x: number): number {
    try {
      // Limpiar la expresión
      let expr = expression.trim();

      // Validar que la expresión no esté vacía
      if (!expr || expr === '') {
        return 0;
      }

      // Primero: reemplazar funciones matemáticas
      expr = expr.replace(/sin\(/g, 'Math.sin(');
      expr = expr.replace(/cos\(/g, 'Math.cos(');
      expr = expr.replace(/tan\(/g, 'Math.tan(');
      expr = expr.replace(/exp\s*\(/g, 'Math.exp(');
      expr = expr.replace(/ln\(/g, 'Math.log(');
      expr = expr.replace(/log\(/g, 'Math.log10(');
      expr = expr.replace(/sqrt\(/g, 'Math.sqrt(');

      // Luego: reemplazar la variable x SOLO si es aislada
      expr = expr.replace(/\bx\b/g, `(${x})`);

      // Agregar multiplicación implícita entre números y paréntesis
      expr = expr.replace(/(\d+)\(/g, '$1*(');
      expr = expr.replace(/\)(\d+)/g, ')*$1');

      // Potencias (reemplazar ^ por **)
      expr = expr.replace(/\^/g, '**');

      // Validar que la expresión sea válida antes de evaluar
      if (expr.includes('undefined') || expr.includes('NaN') || expr.includes('Infinity')) {
        return 0;
      }

      const result = eval(expr);

      // Validar el resultado
      if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
        return 0;
      }

      return result;
    } catch (error) {
      console.error('Error evaluando función:', error, 'Expresión:', expression, 'x:', x);
      return 0;
    }
  }

  // Derivada numérica usando diferencia central
  evaluateDerivative(expression: string, x: number, h: number = 0.0001): number {
    const fxPlusH = this.evaluateFunction(expression, x + h);
    const fxMinusH = this.evaluateFunction(expression, x - h);
    return (fxPlusH - fxMinusH) / (2 * h);
  }

  // Método de Newton-Raphson para encontrar raíces de ecuaciones no lineales
  // Recibe la función como string, un valor inicial, la tolerancia y el máximo de iteraciones
  newtonRaphson(
    expression: string,
    x0: number,
    tolerance: number,
    maxIterations: number
  ): NewtonRaphsonResult[] {
    const results: NewtonRaphsonResult[] = [];
    let x = x0;

    for (let i = 1; i <= maxIterations; i++) {
      // Evaluar la función y su derivada en el punto actual
      const fx = this.evaluateFunction(expression, x);
      const fPrimeX = this.evaluateDerivative(expression, x);

      // Si la derivada es muy pequeña, detenemos para evitar división por cero
      if (Math.abs(fPrimeX) < 1e-10) {
        break;
      }

      // Calculamos el nuevo valor de x usando la fórmula de Newton-Raphson
      const nmr = x - fx / fPrimeX;
      // Calculamos el error absoluto entre la nueva y la anterior aproximación
      const error = Math.abs(nmr - x);

      // Guardamos los resultados de esta iteración
      results.push({
        iteration: i,
        x: x,
        fx: fx,
        fPrimeX: fPrimeX,
        nmr: nmr,
        error: error
      });

      // Si el error es menor que la tolerancia, consideramos que hemos encontrado la raíz
      if (error < tolerance) {
        break;
      }

      // Actualizamos x para la siguiente iteración
      x = nmr;
    }

    return results;
  }

  // Método de Simpson 1/3 para calcular integrales definidas
  // Recibe la función, los límites de integración y el número de subintervalos (n debe ser par)
  simpsonOneThird(
    expression: string,
    a: number,
    b: number,
    n: number
  ): SimpsonResult {
    // Si n es impar, lo ajustamos al siguiente par
    if (n % 2 !== 0) {
      n = n + 1;
    }

    // Calculamos el tamaño del subintervalo
    const h = (b - a) / n;
    // Sumamos los valores de la función en los extremos
    let sum = this.evaluateFunction(expression, a) + this.evaluateFunction(expression, b);

    // Sumamos los valores intermedios, multiplicando por 4 o 2 según corresponda
    for (let i = 1; i < n; i++) {
      const x = a + i * h;
      const fx = this.evaluateFunction(expression, x);
      if (i % 2 === 0) {
        sum += 2 * fx;
      } else {
        sum += 4 * fx;
      }
    }

    // Calculamos la integral aproximada
    const integral = (h / 3) * sum;
    // Estimación simple del error (no es exacta, solo orientativa)
    const error = Math.abs(h * h * h * h / 180);

    return {
      n: n,
      h: h,
      integral: integral,
      error: error
    };
  }

  // Método de Simpson 1/3 sin límites (área bajo la curva)
  simpsonOneThirdUnbounded(
    expression: string,
    xMin: number,
    xMax: number,
    n: number
  ): SimpsonResult {
    return this.simpsonOneThird(expression, xMin, xMax, n);
  }

  // Evaluador de funciones matemáticas para EDOs (f(x,y))
  evaluateODE(expression: string, x: number, y: number): number {
    try {
      // Limpiar la expresión
      let expr = expression.trim();

      // Validar que la expresión no esté vacía
      if (!expr || expr === '') {
        return 0;
      }

      // Primero: reemplazar funciones matemáticas
      expr = expr.replace(/sin\(/g, 'Math.sin(');
      expr = expr.replace(/cos\(/g, 'Math.cos(');
      expr = expr.replace(/tan\(/g, 'Math.tan(');
      expr = expr.replace(/exp\s*\(/g, 'Math.exp(');
      expr = expr.replace(/ln\(/g, 'Math.log(');
      expr = expr.replace(/log\(/g, 'Math.log10(');
      expr = expr.replace(/sqrt\(/g, 'Math.sqrt(');

      // Luego: reemplazar las variables x e y SOLO si son aisladas
      expr = expr.replace(/\bx\b/g, `(${x})`);
      expr = expr.replace(/\by\b/g, `(${y})`);

      // Agregar multiplicación implícita entre números y paréntesis
      expr = expr.replace(/(\d+)\(/g, '$1*(');
      expr = expr.replace(/\)(\d+)/g, ')*$1');

      // Potencias (reemplazar ^ por **)
      expr = expr.replace(/\^/g, '**');

      // Validar que la expresión sea válida antes de evaluar
      if (expr.includes('undefined') || expr.includes('NaN') || expr.includes('Infinity')) {
        return 0;
      }

      const result = eval(expr);

      // Validar el resultado
      if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
        return 0;
      }

      return result;
    } catch (error) {
      console.error('Error evaluando EDO:', error, 'Expresión:', expression, 'x:', x, 'y:', y);
      return 0;
    }
  }

  // Método de Runge-Kutta de 4to orden (RK4) para resolver EDOs de la forma dy/dx = f(x, y)
  // Recibe la función, los valores iniciales de x e y, el tamaño de paso y el número de pasos
  rungeKutta4(
    expression: string,
    x0: number,
    y0: number,
    h: number,
    steps: number
  ): EDOResult[] {
    const results: EDOResult[] = [];
    let x = x0;
    let y = y0;

    for (let i = 0; i <= steps; i++) {
      // Calculamos los coeficientes k1, k2, k3 y k4 según la fórmula de RK4
      const k1 = h * this.evaluateODE(expression, x, y);
      const k2 = h * this.evaluateODE(expression, x + h/2, y + k1/2);
      const k3 = h * this.evaluateODE(expression, x + h/2, y + k2/2);
      const k4 = h * this.evaluateODE(expression, x + h, y + k3);

      // Guardamos los valores de esta iteración
      results.push({
        x: x,
        y: y,
        k1: k1,
        k2: k2,
        k3: k3,
        k4: k4
      });

      // Calculamos el nuevo valor de y usando la combinación ponderada de los k
      if (i < steps) {
        y = y + (k1 + 2*k2 + 2*k3 + k4) / 6;
        x = x + h;
      }
    }

    return results;
  }

  // Generar puntos para graficar
  generatePlotPoints(
    expression: string,
    xMin: number,
    xMax: number,
    points: number = 100
  ): { x: number, y: number }[] {
    const plotPoints: { x: number, y: number }[] = [];
    const step = (xMax - xMin) / points;

    for (let i = 0; i <= points; i++) {
      const x = xMin + i * step;
      const y = this.evaluateFunction(expression, x);

      if (isFinite(y) && !isNaN(y)) {
        plotPoints.push({ x, y });
      }
    }

    return plotPoints;
  }

  // Encontrar raíces usando método de bisección
  bisection(
    expression: string,
    a: number,
    b: number,
    tolerance: number,
    maxIterations: number
  ): NewtonRaphsonResult[] {
    const results: NewtonRaphsonResult[] = [];

    let fa = this.evaluateFunction(expression, a);
    let fb = this.evaluateFunction(expression, b);

    if (fa * fb > 0) {
      return results; // No hay raíz en el intervalo
    }

    for (let i = 1; i <= maxIterations; i++) {
      const c = (a + b) / 2;
      const fc = this.evaluateFunction(expression, c);
      const error = Math.abs(b - a) / 2;

      results.push({
        iteration: i,
        x: c,
        fx: fc,
        fPrimeX: 0, // No se calcula en bisección
        nmr: 0, // No aplica para bisección, pero la interfaz espera un número
        error: error
      });

      if (error < tolerance) {
        break;
      }

      if (fa * fc < 0) {
        b = c;
        fb = fc;
      } else {
        a = c;
        fa = fc;
      }
    }

    return results;
  }
}
