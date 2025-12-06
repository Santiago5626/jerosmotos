import Swal from 'sweetalert2';

const useAlert = () => {
  // Alerta de éxito
  const showSuccess = (title, text = '', options = {}) => {
    return Swal.fire({
      icon: 'success',
      title,
      text,
      confirmButtonColor: '#28a745',
      timer: 3000,
      timerProgressBar: true,
      ...options
    });
  };

  // Alerta de error
  const showError = (title, text = '', options = {}) => {
    return Swal.fire({
      icon: 'error',
      title,
      text,
      confirmButtonColor: '#dc3545',
      ...options
    });
  };

  // Alerta de advertencia
  const showWarning = (title, text = '', options = {}) => {
    return Swal.fire({
      icon: 'warning',
      title,
      text,
      confirmButtonColor: '#ffc107',
      ...options
    });
  };

  // Alerta informativa
  const showInfo = (title, text = '', options = {}) => {
    return Swal.fire({
      icon: 'info',
      title,
      text,
      confirmButtonColor: '#17a2b8',
      ...options
    });
  };

  // Confirmación
  const showConfirm = (title, text = '', options = {}) => {
    return Swal.fire({
      icon: 'question',
      title,
      text,
      showCancelButton: true,
      confirmButtonColor: '#007bff',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'Cancelar',
      ...options
    });
  };

  // Confirmación de eliminación
  const showDeleteConfirm = (title = '¿Estás seguro?', text = 'Esta acción no se puede deshacer', options = {}) => {
    return Swal.fire({
      icon: 'warning',
      title,
      text,
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      ...options
    });
  };

  // Alerta de carga/loading
  const showLoading = (title = 'Procesando...', text = 'Por favor espera') => {
    return Swal.fire({
      title,
      text,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  };

  // Cerrar alerta de carga
  const closeLoading = () => {
    Swal.close();
  };

  // Toast (notificación pequeña)
  const showToast = (icon, title, options = {}) => {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });

    return Toast.fire({
      icon,
      title,
      ...options
    });
  };

  // Input personalizado
  const showInput = (title, inputType = 'text', options = {}) => {
    return Swal.fire({
      title,
      input: inputType,
      inputAttributes: {
        autocapitalize: 'off'
      },
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#007bff',
      cancelButtonColor: '#6c757d',
      showLoaderOnConfirm: true,
      ...options
    });
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
    showDeleteConfirm,
    showLoading,
    closeLoading,
    showToast,
    showInput
  };
};

export default useAlert;
