# Calculadora de Métodos Numéricos

Esta aplicación permite resolver problemas de raíces, integración y ecuaciones diferenciales usando los métodos de Newton-Raphson, Simpson 1/3 y Runge-Kutta 4 (RK4).

---

## ¿Cómo ingresar funciones?

Puedes escribir funciones matemáticas usando la siguiente notación:

### **Potencias**
- `x^2`  →  x al cuadrado
- `x^n`  →  x a la potencia n

### **Raíz cuadrada**
- `sqrt(x)`  →  raíz cuadrada de x
- `sqrt(x^2 + 1)`  →  raíz cuadrada de (x² + 1)

### **Raíz n-ésima**
- `x^(1/3)`  →  raíz cúbica de x
- `x^(1/4)`  →  raíz cuarta de x

### **Exponencial y logaritmos**
- `exp(x)`  →  e^x
- `exp(-x)`  →  e^(-x)
- `ln(x)`  →  logaritmo natural (base e)
- `log(x)`  →  logaritmo decimal (base 10)

### **Trigonométricas**
- `sin(x)`  →  seno de x (en radianes)
- `cos(x)`  →  coseno de x
- `tan(x)`  →  tangente de x

### **Combinaciones**
- Puedes combinar todas las funciones: `sin(x) + exp(-x^2) + sqrt(x)`

---

## ¿Qué parámetros pide cada método?

### **Newton-Raphson (Raíces)**
- Función f(x)
- Valor inicial x₀
- Tolerancia (precisión deseada)
- Máximo de iteraciones

### **Simpson 1/3 (Integración)**
- Función f(x)
- Límite inferior (a)
- Límite superior (b)
- Número de subintervalos (n, debe ser par)

### **Runge-Kutta 4 (RK4, EDOs)**
- Función f(x, y) (por ejemplo: `y + x^2`)
- Valor inicial x₀
- Valor final x
- Valor inicial y₀
- Tamaño de paso (h)

El número de pasos se calcula automáticamente como:
```
número de pasos = (x_final - x₀) / h
```

---

## Ejemplos de uso

### **Raíz cuadrada:**
- `sqrt(x)`
- `sqrt(x^2 + 4)`

### **Raíz cúbica:**
- `x^(1/3)`

### **Exponencial:**
- `exp(-x^2)`

### **EDO (RK4):**
- `y + x^2` (debes seleccionar el método RK4 para usar la variable y)

---

## Consejos
- Usa siempre paréntesis cuando sea necesario: `sqrt(x+1)`, `exp(-x^2)`
- Las funciones trigonométricas usan radianes
- Si usas la variable `y`, selecciona el método RK4 (EDO)
- Si tienes dudas, revisa los ejemplos o pregunta :)
