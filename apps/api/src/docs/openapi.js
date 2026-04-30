function buildOpenApiDocument() {
  return {
    openapi: '3.0.0',
    info: {
      title: 'Oficios API',
      version: '1.0.0',
      description: 'REST API para el MVP de oficios en Argentina.',
    },
    servers: [{ url: 'http://localhost:4000' }],
    tags: [
      { name: 'Health' },
      { name: 'Auth' },
      { name: 'Categories' },
      { name: 'Professionals' },
      { name: 'Service Needs' },
      { name: 'Service Requests' },
      { name: 'Reviews' },
      { name: 'Notifications' },
      { name: 'Admin' },
      { name: 'Uploads' },
    ],
    paths: {
      '/health': {
        get: {
          tags: ['Health'],
          responses: {
            200: {
              description: 'API up',
            },
          },
        },
      },
      '/auth/register': { post: { tags: ['Auth'], summary: 'Registro con email/password' } },
      '/auth/phone/start': { post: { tags: ['Auth'], summary: 'Enviar codigo de acceso por telefono' } },
      '/auth/phone/verify': { post: { tags: ['Auth'], summary: 'Verificar codigo por telefono y crear/iniciar sesion' } },
      '/auth/login': { post: { tags: ['Auth'], summary: 'Login con email/password' } },
      '/auth/social': { post: { tags: ['Auth'], summary: 'Login social Google/Apple' } },
      '/auth/me': { get: { tags: ['Auth'], summary: 'Usuario autenticado' } },
      '/professionals': { get: { tags: ['Professionals'], summary: 'Busqueda publica de profesionales' } },
      '/professionals/{id}': { get: { tags: ['Professionals'], summary: 'Detalle publico de profesional' } },
      '/professionals/me': {
        get: { tags: ['Professionals'], summary: 'Perfil profesional propio' },
        put: { tags: ['Professionals'], summary: 'Guardar ficha profesional propia' },
      },
      '/professionals/me/categories': {
        put: { tags: ['Professionals'], summary: 'Guardar categorias del profesional' },
      },
      '/professionals/me/service-areas': {
        put: { tags: ['Professionals'], summary: 'Guardar zonas de servicio del profesional' },
      },
      '/professionals/me/work-posts': {
        put: { tags: ['Professionals'], summary: 'Guardar trabajos previos del profesional' },
      },
      '/professionals/me/submit': {
        post: { tags: ['Professionals'], summary: 'Enviar perfil profesional a aprobacion' },
      },
      '/uploads/images/intents': {
        post: { tags: ['Uploads'], summary: 'Crear una intencion de subida directa para imagenes de profesionales o clientes' },
      },
      '/service-needs': {
        get: { tags: ['Service Needs'], summary: 'Listado de problemas del cliente autenticado' },
        post: { tags: ['Service Needs'], summary: 'Crear borrador de problema del cliente' },
      },
      '/service-needs/{id}': {
        get: { tags: ['Service Needs'], summary: 'Detalle de un problema del cliente' },
        patch: { tags: ['Service Needs'], summary: 'Editar un borrador o problema abierto' },
      },
      '/service-needs/{id}/dispatches': {
        post: { tags: ['Service Needs'], summary: 'Enviar un problema a varios profesionales' },
      },
      '/service-needs/{id}/select-request': {
        post: { tags: ['Service Needs'], summary: 'Seleccionar un hilo candidato para esperar confirmacion del profesional' },
      },
      '/service-needs/{id}/cancel': {
        post: { tags: ['Service Needs'], summary: 'Cancelar un problema y sus hilos activos' },
      },
      '/service-requests': {
        get: { tags: ['Service Requests'], summary: 'Listado de solicitudes del usuario' },
        post: { tags: ['Service Requests'], summary: 'Wrapper compatible que crea un problema y un hilo implicito' },
      },
      '/service-requests/{id}': {
        get: { tags: ['Service Requests'], summary: 'Detalle de solicitud' },
      },
      '/service-requests/{id}/status': {
        patch: { tags: ['Service Requests'], summary: 'Cambiar estado de solicitud y confirmar o cerrar el hilo' },
      },
      '/service-requests/{id}/messages': {
        post: { tags: ['Service Requests'], summary: 'Enviar mensaje dentro de una solicitud' },
      },
      '/reviews': {
        get: { tags: ['Reviews'], summary: 'Listar resenas' },
        post: { tags: ['Reviews'], summary: 'Crear resena' },
      },
      '/notifications': {
        get: { tags: ['Notifications'], summary: 'Listar notificaciones' },
      },
      '/admin/overview': {
        get: { tags: ['Admin'], summary: 'Metricas generales admin' },
      },
    },
  };
}

module.exports = {
  buildOpenApiDocument,
};
