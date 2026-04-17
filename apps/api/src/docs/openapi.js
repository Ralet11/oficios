function buildOpenApiDocument() {
  return {
    openapi: '3.0.0',
    info: {
      title: 'Oficios Marketplace API',
      version: '1.0.0',
      description: 'REST API para el MVP de marketplace de oficios en Argentina.',
    },
    servers: [{ url: 'http://localhost:4000' }],
    tags: [
      { name: 'Health' },
      { name: 'Auth' },
      { name: 'Categories' },
      { name: 'Professionals' },
      { name: 'Service Requests' },
      { name: 'Reviews' },
      { name: 'Notifications' },
      { name: 'Admin' },
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
      '/auth/login': { post: { tags: ['Auth'], summary: 'Login con email/password' } },
      '/auth/social': { post: { tags: ['Auth'], summary: 'Login social Google/Apple' } },
      '/auth/me': { get: { tags: ['Auth'], summary: 'Usuario autenticado' } },
      '/professionals': { get: { tags: ['Professionals'], summary: 'Búsqueda pública de profesionales' } },
      '/professionals/{id}': { get: { tags: ['Professionals'], summary: 'Detalle público de profesional' } },
      '/service-requests': {
        get: { tags: ['Service Requests'], summary: 'Listado de solicitudes del usuario' },
        post: { tags: ['Service Requests'], summary: 'Crear solicitud de servicio' },
      },
      '/service-requests/{id}': {
        get: { tags: ['Service Requests'], summary: 'Detalle de solicitud' },
      },
      '/service-requests/{id}/status': {
        patch: { tags: ['Service Requests'], summary: 'Cambiar estado de solicitud' },
      },
      '/service-requests/{id}/messages': {
        post: { tags: ['Service Requests'], summary: 'Enviar mensaje dentro de una solicitud' },
      },
      '/reviews': {
        get: { tags: ['Reviews'], summary: 'Listar reseñas' },
        post: { tags: ['Reviews'], summary: 'Crear reseña' },
      },
      '/notifications': {
        get: { tags: ['Notifications'], summary: 'Listar notificaciones' },
      },
      '/admin/overview': {
        get: { tags: ['Admin'], summary: 'Métricas generales admin' },
      },
    },
  };
}

module.exports = {
  buildOpenApiDocument,
};
