export const uploadPhoto = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  const photoUrl = `/uploads/${req.file.filename}`;
  return res.json({ photoUrl });
};
