const { NotificationType } = require('@oficios/domain');

async function createNotification(models, payload) {
  return models.Notification.create({
    userId: payload.userId,
    type: payload.type || NotificationType.ADMIN_ACTION,
    title: payload.title,
    body: payload.body,
    payload: payload.payload || {},
  });
}

async function createServiceRequestNotification(models, serviceRequest, userId, title, body) {
  return createNotification(models, {
    userId,
    title,
    body,
    type: NotificationType.SERVICE_REQUEST_UPDATED,
    payload: {
      serviceRequestId: serviceRequest.id,
      status: serviceRequest.status,
    },
  });
}

module.exports = {
  createNotification,
  createServiceRequestNotification,
};
