import { useState, useEffect } from 'react';
import { productsAPI } from '../utils/api';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

const AdminProducts = ({ onProductsChange }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    price: '',
    description: '',
    stock: '',
    image: '',
    language: 'Tiếng Việt',
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productsAPI.getAllProducts();
      // API trả về { success, count, products } hoặc array trực tiếp
      const productsData = response.data.products || response.data || [];
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]); // Đảm bảo products luôn là array
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate required fields
      if (!formData.name || !formData.name.trim()) {
        alert('Vui lòng nhập tên sản phẩm');
        return;
      }
      if (!formData.brand || !formData.brand.trim()) {
        alert('Vui lòng chọn danh mục');
        return;
      }
      if (!formData.price || Number(formData.price) < 0) {
        alert('Vui lòng nhập giá hợp lệ');
        return;
      }
      if (!formData.stock || Number(formData.stock) < 0) {
        alert('Vui lòng nhập số lượng tồn kho hợp lệ');
        return;
      }

      // Map formData sang format mà backend mong đợi
      const productData = {
        name: formData.name.trim(),
        category: formData.brand.trim(), // Map brand -> category
        price: Number(formData.price),
        description: formData.description?.trim() || '',
        image: formData.image?.trim() || '',
        countInStock: Number(formData.stock),
        language: formData.language || 'Tiếng Việt',
      };

      if (editingProduct) {
        await productsAPI.updateProduct(editingProduct._id, productData);
        alert('✅ Cập nhật sản phẩm thành công!');
      } else {
        await productsAPI.createProduct(productData);
        alert('✅ Thêm sản phẩm thành công!');
      }
      setShowModal(false);
      setEditingProduct(null);
      setFormData({
        name: '',
        brand: '',
        price: '',
        description: '',
        stock: '',
        image: '',
        language: 'Tiếng Việt',
      });
      fetchProducts();
      // Cập nhật tổng số sản phẩm ở trang Admin
      if (onProductsChange) {
        onProductsChange();
      }
    } catch (error) {
      console.error('Error saving product:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra';
      alert(`❌ ${errorMessage}`);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      brand: product.brand || product.category,
      price: product.price,
      description: product.description || '',
      stock: product.stock || product.countInStock || '',
      image: product.image || '',
      language: product.language || 'Tiếng Việt',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      return;
    }
    try {
      await productsAPI.deleteProduct(id);
      fetchProducts();
      // Cập nhật tổng số sản phẩm ở trang Admin
      if (onProductsChange) {
        onProductsChange();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Xóa sản phẩm thất bại');
    }
  };

  const handleToggleStock = async (id, inStock) => {
    try {
      await productsAPI.updateStock(id, !inStock);
      fetchProducts();
    } catch (error) {
      alert(error.response?.data?.message || 'Cập nhật thất bại');
    }
  };

  if (loading) {
    return <div className="text-center">Đang tải...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Danh sách sản phẩm</h2>
        <button
          onClick={() => {
            setEditingProduct(null);
            setFormData({
              name: '',
              brand: '',
              price: '',
              description: '',
              stock: '',
              image: '',
              language: 'Tiếng Việt',
            });
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <FaPlus />
          <span>Thêm sản phẩm</span>
        </button>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Sản phẩm
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Danh mục
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Giá
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Tồn kho
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.isArray(products) && products.length > 0 ? products.map((product) => (
              <tr key={product._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      {product.image ? (
                        <img
                          className="h-10 w-10 rounded object-contain"
                          src={product.image}
                          alt={product.name}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded bg-gray-200"></div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{product.brand || product.category}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {product.price.toLocaleString()} ₫
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{product.countInStock ?? product.stock ?? 0}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => handleEdit(product)}
                    className="text-blue-600 hover:text-blue-900"
                    title="Chỉnh sửa"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(product._id)}
                    className="text-red-600 hover:text-red-900 ml-2"
                    title="Xóa"
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  Không có sản phẩm nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              {editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên sản phẩm *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Danh mục *
                  </label>
                  <select
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Chọn danh mục</option>
                    <option value="Quần áo">Quần áo</option>
                    <option value="Phụ kiện">Phụ kiện</option>
                    <option value="Đồ điện tử">Đồ điện tử</option>
                    <option value="Giày dép">Giày dép</option>
                    <option value="Túi xách">Túi xách</option>
                    <option value="Đồng hồ">Đồng hồ</option>
                    <option value="Mỹ phẩm">Mỹ phẩm</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giá (₫) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    min="0"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tồn kho *
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    required
                    min="0"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL hình ảnh
                </label>
                <input
                  type="url"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngôn ngữ
                </label>
                <input
                  type="text"
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                >
                  {editingProduct ? 'Cập nhật' : 'Thêm'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingProduct(null);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
