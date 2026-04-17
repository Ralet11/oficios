async function listCategories(req, res) {
  const categories = await req.models.Category.findAll({
    where: { isActive: true },
    order: [['name', 'ASC']],
  });

  res.json({
    data: categories,
  });
}

module.exports = {
  listCategories,
};
