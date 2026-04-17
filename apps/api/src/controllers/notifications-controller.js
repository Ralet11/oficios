async function listNotifications(req, res) {
  const notifications = await req.models.Notification.findAll({
    where: { userId: req.auth.user.id },
    order: [['createdAt', 'DESC']],
  });

  res.json({
    data: notifications,
  });
}

async function markNotificationAsRead(req, res) {
  const notification = await req.models.Notification.findOne({
    where: {
      id: req.params.id,
      userId: req.auth.user.id,
    },
  });

  if (!notification) {
    return res.status(404).json({ error: 'Notification not found' });
  }

  await notification.update({
    readAt: new Date(),
  });

  res.json({
    data: notification,
  });
}

module.exports = {
  listNotifications,
  markNotificationAsRead,
};
