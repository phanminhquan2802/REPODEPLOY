import Product from "../models/productModel.js";
import Order from '../models/orderModel.js';
// ✅ THÊM: Import Abstract Factory
import { ProductFactoryProducer } from '../patterns/AbstractFactory.js';

// @desc    Lấy tất cả sản phẩm (Có tìm kiếm & lọc danh mục)
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  const keyword = req.query.keyword
    ? {
        name: { $regex: req.query.keyword, $options: 'i' }
      }
    : {};

  const category = req.query.category
    ? { category: req.query.category }
    : {};

  const products = await Product.find({ ...keyword, ...category });
  
  res.json(products);
};

// @desc    Lấy chi tiết một sản phẩm
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Không tìm thấy sách' });
    }
  } catch (error) {
    res.status(404).json({ message: 'Không tìm thấy sách' });
  }
};

// @desc    Lấy TẤT CẢ sản phẩm cho Admin (không filter, có sort)
// @route   GET /api/products/admin/all
// @access  Private/Admin
const getAllProductsAdmin = async (req, res) => {
  try {
    const products = await Product.find({})
      .sort({ createdAt: -1 })
      .select('-__v');
    
    res.json({
      success: true,
      count: products.length,
      products: products
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi lấy danh sách sản phẩm',
      error: error.message 
    });
  }
};

// ========================================
// ✅ CẬP NHẬT: Tạo sản phẩm với Abstract Factory
// ========================================
const createProduct = async (req, res) => {
  try {
    const {
      name,
      category,
      price,
      description,
      image,
      countInStock,
      language,
      // Thông tin riêng cho từng loại
      author,
      publisher,
      pageCount,
      isbn,
      brand,
      warranty,
      specs,
      size,
      color,
      material
    } = req.body;

    console.log('\n🏭 ABSTRACT FACTORY: Creating product...');
    
    // ✅ BƯỚC 1: Sử dụng Factory để tạo product object
    const factoryProduct = ProductFactoryProducer.createProduct({
      name: name || 'Tên sản phẩm mới',
      price: price || 0,
      category: category || 'Khác',
      // Thông tin riêng
      author,
      publisher,
      pageCount,
      isbn,
      brand,
      warranty,
      specs,
      size,
      color,
      material
    });

    // ✅ BƯỚC 2: Lấy thông tin từ Factory
    const details = factoryProduct.getDetails();
    const shippingFee = factoryProduct.calculateShipping();
    
    console.log('  ✓ Product Type:', details.type);
    console.log('  ✓ Shipping Fee:', shippingFee.toLocaleString() + '₫');

    // ✅ BƯỚC 3: Lưu vào Database với thông tin từ Factory
    const product = new Product({
      user: req.user._id,
      name: name || 'Tên sản phẩm mới',
      category: category || 'Khác',
      price: price || 0,
      description: description || '',
      image: image || '/images/sample.jpg',
      countInStock: countInStock || 0,
      language: language || 'Tiếng Việt',
      
      // ✅ Thông tin từ Factory
      productType: details.type,
      shippingFee: shippingFee,
      
      // Thông tin riêng cho từng loại
      author,
      publisher,
      pageCount,
      isbn,
      brand,
      warranty,
      specs,
      size,
      color,
      material
    });

    const createdProduct = await product.save();
    
    console.log('✅ Product created with Factory Pattern:', createdProduct.name);
    console.log('   Type:', createdProduct.productType);
    console.log('   Shipping Fee:', createdProduct.shippingFee.toLocaleString() + '₫\n');
    
    res.status(201).json(createdProduct);
  } catch (error) {
    console.error('❌ Error creating product:', error);
    res.status(500).json({ 
      message: error.message || 'Tạo sản phẩm thất bại' 
    });
  }
};

// ========================================
// ✅ CẬP NHẬT: Update sản phẩm với Abstract Factory
// ========================================
const updateProduct = async (req, res) => {
  try {
    const { 
        name, 
        price, 
        description, 
        image, 
        category, 
        countInStock,
        language,
        // Thông tin riêng
        author,
        publisher,
        pageCount,
        isbn,
        brand,
        warranty,
        specs,
        size,
        color,
        material
    } = req.body;

    console.log('📝 Update product request:', req.params.id, req.body);

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ 
        message: 'Không tìm thấy sản phẩm' 
      });
    }

    // Validate required fields
    if (name !== undefined && (!name || !name.trim())) {
      return res.status(400).json({ message: 'Tên sản phẩm không được để trống' });
    }
    if (category !== undefined && (!category || !category.trim())) {
      return res.status(400).json({ message: 'Danh mục không được để trống' });
    }

    // ✅ BƯỚC 1: Nếu có thay đổi category hoặc price, tính lại shipping fee
    const needRecalculateShipping = 
      (category && category !== product.category) || 
      (price && price !== product.price);

    if (needRecalculateShipping) {
      console.log('\n🏭 ABSTRACT FACTORY: Recalculating shipping fee...');
      
      const factoryProduct = ProductFactoryProducer.createProduct({
        name: name || product.name,
        price: price || product.price,
        category: category || product.category,
        author: author || product.author,
        brand: brand || product.brand,
        size: size || product.size
      });
      
      const details = factoryProduct.getDetails();
      const newShippingFee = factoryProduct.calculateShipping();
      
      product.productType = details.type;
      product.shippingFee = newShippingFee;
      
      console.log('  ✓ New Type:', details.type);
      console.log('  ✓ New Shipping Fee:', newShippingFee.toLocaleString() + '₫\n');
    }

    // ✅ BƯỚC 2: Cập nhật các trường thông thường
    if (name !== undefined && name.trim()) product.name = name.trim();
    if (price !== undefined && price >= 0) product.price = price;
    if (description !== undefined) product.description = description.trim() || product.description;
    if (image !== undefined) product.image = image.trim() || product.image;
    if (category !== undefined && category.trim()) product.category = category.trim();
    if (countInStock !== undefined && countInStock >= 0) product.countInStock = countInStock;
    if (language !== undefined) product.language = language || 'Tiếng Việt';
    
    // Cập nhật thông tin riêng
    if (author !== undefined) product.author = author;
    if (publisher !== undefined) product.publisher = publisher;
    if (pageCount !== undefined) product.pageCount = pageCount;
    if (isbn !== undefined) product.isbn = isbn;
    if (brand !== undefined) product.brand = brand;
    if (warranty !== undefined) product.warranty = warranty;
    if (specs !== undefined) product.specs = specs;
    if (size !== undefined) product.size = size;
    if (color !== undefined) product.color = color;
    if (material !== undefined) product.material = material;

    const updatedProduct = await product.save();
    console.log('✅ Product updated:', updatedProduct.name);
    res.json(updatedProduct);
  } catch (error) {
    console.error('❌ Error updating product:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message).join(', ');
      return res.status(400).json({ 
        message: `Lỗi validation: ${messages}` 
      });
    }
    
    res.status(error.statusCode || 500).json({ 
      message: error.message || 'Cập nhật sản phẩm thất bại' 
    });
  }
};

// (Các functions khác giữ nguyên...)
const updateProductStock = async (req, res) => {
  try {
    const { countInStock } = req.body;
    const product = await Product.findById(req.params.id);

    if (product) {
      product.countInStock = countInStock;
      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    await Product.deleteOne({ _id: product._id });
    res.json({ message: 'Sách đã được xóa' });
  } else {
    res.status(404);
    throw new Error('Không tìm thấy sách');
  }
};

export {
  getProducts,
  getProductById,
  getAllProductsAdmin,
  createProduct,
  updateProduct,
  updateProductStock,
  deleteProduct,
};