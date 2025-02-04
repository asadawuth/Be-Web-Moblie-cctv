module.exports = (req, res, next) => {
  res.status(404).json({ message: "path is not found" });
};
