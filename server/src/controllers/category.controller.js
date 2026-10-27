import * as categoryModel from "../models/category.js";

export async function listCategories(req, res) {
  const categories = await categoryModel.listCategories(req.user.id);
  return res.json({ data: categories });
}

export async function createCategory(req, res) {
  const { name } = req.validated;
  const categories = await categoryModel.listCategories(req.user.id);
  const exists = categories.some((category) => category.name.toLowerCase() === name.toLowerCase());

  if (exists) {
    return res.status(409).json({ error: "A category with this name already exists" });
  }

  const category = await categoryModel.createCategory(req.user.id, name);
  return res.status(201).json({ data: category });
}

export async function updateCategory(req, res) {
  const id = Number(req.params.id);
  const { name } = req.validated;

  const categories = await categoryModel.listCategories(req.user.id);
  const exists = categories.some(
    (category) => category.id !== id && category.name.toLowerCase() === name.toLowerCase()
  );

  if (exists) {
    return res.status(409).json({ error: "A category with this name already exists" });
  }

  const category = await categoryModel.updateCategory(id, req.user.id, name);
  if (!category) {
    return res.status(404).json({ error: "Category not found" });
  }

  return res.json({ data: category });
}

export async function deleteCategory(req, res) {
  const id = Number(req.params.id);
  const category = await categoryModel.deleteCategory(id, req.user.id);

  if (!category) {
    return res.status(404).json({ error: "Category not found" });
  }

  return res.json({ data: null });
}
