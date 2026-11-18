// Cliente API reutilizable con manejo de respuestas y notificaciones toast

const API = {
  async peticion(url, opciones = {}) {
    try {
      const token = localStorage.getItem('token_carniceria');
      const config = {
        ...opciones,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(opciones.headers || {})
        }
      };

      const respuesta = await fetch(url, config);
      const texto = await respuesta.text();
      let datos = {};
      try {
        datos = texto ? JSON.parse(texto) : {};
      } catch (e) {
        datos = { mensaje: texto.slice(0, 200) || 'Respuesta inválida del servidor' };
      }

      if (respuesta.status === 401 && !url.includes('/api/auth/login')) {
        localStorage.removeItem('token_carniceria');
        localStorage.removeItem('usuario_carniceria');
        const vistaLogin = document.getElementById('vista-login');
        const appPrivada = document.getElementById('app-privada');
        if (vistaLogin) vistaLogin.style.display = 'flex';
        if (appPrivada) appPrivada.style.display = 'none';
        API.mostrarToast('Tu sesión expiró. Inicia sesión de nuevo.', 'info');
      }

      if (!respuesta.ok) {
        throw new Error(datos.mensaje || 'Error en la solicitud');
      }

      return datos;
    } catch (error) {
      console.error(`Error en API [${url}]:`, error);
      API.mostrarToast(error.message, 'error');
      throw error;
    }
  },

  get(url) {
    return this.peticion(url, { method: 'GET' });
  },

  post(url, body) {
    return this.peticion(url, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  put(url, body) {
    return this.peticion(url, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  },

  patch(url, body) {
    return this.peticion(url, {
      method: 'PATCH',
      body: JSON.stringify(body)
    });
  },

  delete(url) {
    return this.peticion(url, { method: 'DELETE' });
  },

  mostrarToast(mensaje, tipo = 'info') {
    let contenedor = document.getElementById('toast-contenedor');
    if (!contenedor) {
      contenedor = document.createElement('div');
      contenedor.id = 'toast-contenedor';
      document.body.appendChild(contenedor);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.innerText = mensaje;
    contenedor.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 4000);
  },

  formatoMoneda(cantidad) {
    const formateado = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(cantidad || 0);
    return `${formateado} MXN`;
  },

  formatoKg(cantidad) {
    return `${Number(cantidad || 0).toFixed(2)} kg`;
  },

  formatoFecha(fecha) {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
};

