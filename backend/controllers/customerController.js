import Customer from "../models/customerModel.js";
import generateToken from "../utils/generateToken.js";
import Product from '../models/productModel.js';
import { sendResetPasswordEmail } from '../utils/sendEmail.js';
import crypto from 'crypto';

//@desc dang ky khach hang moi
//@route POST/api/customers
const registerCustomer = async (req, res, next)=>{
    const {email, name, phone, password} = req.body;

    try{
        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                message: "Vui lòng điền email và mật khẩu"
            });
        }

        const customerExists = await Customer.findOne({email});
        if(customerExists){
            return res.status(400).json({message : "Email da ton tai"});
        }
        
        //tao customer
        const customer = await Customer.create({email, name, phone, password});

        res.status(201).json({
            _id: customer._id,
            name: customer.name,
            email: customer.email,
            token: generateToken(customer._id),
        });
    }catch(error){
        // Pass error to error handler middleware
        next(error);
    }
};

//desc dang nhap khach hang
//route POST/api/customer/login
const loginCustomer = async (req, res)=>{
    const {email, password}= req.body;

    try{
        const customer = await Customer.findOne({email});

        if(customer && (await customer.matchPassword(password))){
            res.json({
                _id: customer._id,
                name: customer.name,
                email: customer.email,
                isAdmin: customer.isAdmin,
                token: generateToken(customer._id),
            });
        }else{
            res.status(401).json({message: "Email hoac mat khau khong chinh xac"});
        }
    }catch(error){
        res.status(500).json({message: "Loi may chu"});
    }
};

const getCustomerCart = async (req, res)=>{
    try {
        const customer = await Customer.findById(req.user._id).populate('cart.product');
        
        if(!customer){
            res.status(404);
            throw new Error('Không tìm thấy khách hàng');
        }

        // Lọc các sản phẩm không còn tồn tại
        const validCart = customer.cart.filter(item => item.product);
        
        res.json(validCart);
    } catch (error) {
        console.error('❌ Lỗi getCustomerCart:', error);
        res.status(500).json({ message: error.message });
    }
};

//@desc Them/cap nhat san pham trong gio hang
//@route POST /api/customer/cart
//@access Private
const addItemToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    
    console.log("👉 1. Backend nhận yêu cầu thêm giỏ:", { productId, quantity, user: req.user._id });

    const customer = await Customer.findById(req.user._id);
    const product = await Product.findById(productId);

    if (!product) {
      console.log("❌ Lỗi: Không tìm thấy sản phẩm với ID:", productId);
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    // ✅ KIỂM TRA TỒN KHO
    if (product.countInStock === 0) {
      return res.status(400).json({ message: 'Sản phẩm đã hết hàng' });
    }

    console.log("👉 2. Tìm thấy sản phẩm:", product.name, "Tồn kho:", product.countInStock);

    const cartItemIndex = customer.cart.findIndex(
      (item) => item.product.toString() === productId
    );

    if (cartItemIndex > -1) {
      // Sản phẩm đã có trong giỏ - cộng dồn số lượng
      const newQuantity = customer.cart[cartItemIndex].quantity + Number(quantity);
      
      // ✅ KIỂM TRA VƯỢT QUÁ TỒN KHO
      if (newQuantity > product.countInStock) {
        return res.status(400).json({ 
          message: `Chỉ còn ${product.countInStock} sản phẩm. Bạn đã có ${customer.cart[cartItemIndex].quantity} trong giỏ.` 
        });
      }
      
      customer.cart[cartItemIndex].quantity = newQuantity;
      console.log("👉 3. Sản phẩm đã có, cập nhật số lượng mới:", newQuantity);
    } else {
      // ✅ KIỂM TRA SỐ LƯỢNG THÊM MỚI
      if (Number(quantity) > product.countInStock) {
        return res.status(400).json({ 
          message: `Chỉ còn ${product.countInStock} sản phẩm` 
        });
      }
      
      const newItem = {
        product: productId,
        name: product.name,
        image: product.image,
        price: product.price,
        quantity: Number(quantity),
      };
      customer.cart.push(newItem);
      console.log("👉 3. Thêm sản phẩm mới vào mảng cart:", newItem);
    }

    console.log("👉 4. Đang lưu vào MongoDB...");
    await customer.save();
    await customer.populate('cart.product');
    
    console.log("✅ 5. Lưu thành công! Giỏ hàng hiện tại:", customer.cart.length, "món");

    res.status(201).json(customer.cart);

  } catch (error) {
    console.error("❌ LỖI NGHIÊM TRỌNG TRONG CONTROLLER:", error.message);
    if (error.name === 'ValidationError') {
        console.error("Chi tiết lỗi Validate:", error.errors);
    }
    res.status(400).json({ message: error.message });
  }
};

//@desc xoa san pham khoi gio hang
//@route DELETE /api/customer/cart/:productId
//@access Private
const removeItemFromCart = async(req, res)=>{
    try {
        const {productId} = req.params;
        const customer = await Customer.findById(req.user._id);

        if(!customer){
            res.status(404);
            throw new Error('Không tìm thấy khách hàng');
        }

        customer.cart = customer.cart.filter(
            (item) => item.product.toString() !== productId
        );
        
        await customer.save();
        await customer.populate('cart.product');
        
        res.json(customer.cart);
    } catch (error) {
        console.error('❌ Lỗi removeItemFromCart:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Lấy thông tin hồ sơ người dùng
// @route   GET /api/customers/profile
// @access  Private
const getCustomerProfile = async (req, res) => {
  const customer = await Customer.findById(req.user._id);

  if (customer) {
    res.json({
      _id: customer._id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      isAdmin: customer.isAdmin,
    });
  } else {
    res.status(404);
    throw new Error('Không tìm thấy người dùng');
  }
};

// @desc    Cập nhật hồ sơ người dùng
// @route   PUT /api/customers/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  const customer = await Customer.findById(req.user._id);

  if (customer) {
    customer.name = req.body.name || customer.name;
    customer.phone = req.body.phone || customer.phone;

    if (req.body.password) {
      customer.password = req.body.password;
    }

    const updatedCustomer = await customer.save();

    res.json({
      _id: updatedCustomer._id,
      name: updatedCustomer.name,
      email: updatedCustomer.email,
      isAdmin: updatedCustomer.isAdmin,
      phone: updatedCustomer.phone,
      token: generateToken(updatedCustomer._id),
    });
  } else {
    res.status(404);
    throw new Error('Không tìm thấy người dùng');
  }
};

// @desc    Cập nhật số lượng sản phẩm trong giỏ hàng
// @route   PUT /api/customer/cart
// @access  Private
const updateCartItemQuantity = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    const customer = await Customer.findById(req.user._id);

    if (customer) {
      const itemIndex = customer.cart.findIndex(
        (item) => item.product.toString() === productId
      );

      if (itemIndex > -1) {
        customer.cart[itemIndex].quantity = Number(quantity);
        await customer.save();
        await customer.populate('cart.product');
        res.json(customer.cart);
      } else {
        res.status(404);
        throw new Error('Sản phẩm không có trong giỏ hàng');
      }
    } else {
      res.status(404);
      throw new Error('Không tìm thấy khách hàng');
    }
  } catch (error) {
    console.error('❌ Lỗi updateCartItemQuantity:', error);
    res.status(500).json({ message: error.message });
  }
};

const clearCart = async(req, res)=>{
    try {
        const customer = await Customer.findById(req.user._id);

        if(!customer){
            res.status(404);
            throw new Error('Không tìm thấy khách hàng');
        }

        customer.cart = [];
        await customer.save();
        res.json({ message: 'Đã xóa giỏ hàng' });
    } catch (error) {
        console.error('❌ Lỗi clearCart:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Gửi mã xác nhận qua email để đặt lại mật khẩu
// @route   POST /api/customers/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Vui lòng nhập email' });
    }

    const customer = await Customer.findOne({ email });

    if (!customer) {
      // Không tiết lộ email có tồn tại hay không (bảo mật)
      return res.status(200).json({ 
        message: 'Nếu email tồn tại, mã xác nhận đã được gửi đến email của bạn' 
      });
    }

    // Tạo mã xác nhận 6 chữ số
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash mã xác nhận trước khi lưu vào database
    const hashedCode = crypto
      .createHash('sha256')
      .update(resetCode)
      .digest('hex');

    // Lưu mã đã hash và thời gian hết hạn (10 phút)
    customer.resetPasswordToken = hashedCode;
    customer.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 phút

    await customer.save();

    // Gửi email với mã xác nhận
    try {
      await sendResetPasswordEmail(customer.email, resetCode);
      console.log(`✅ Mã xác nhận đã được gửi đến: ${customer.email}`);
    } catch (emailError) {
      console.error('❌ Lỗi gửi email:', emailError);
      // Xóa token nếu gửi email thất bại
      customer.resetPasswordToken = undefined;
      customer.resetPasswordExpires = undefined;
      await customer.save();
      
      // Trả về thông báo lỗi chi tiết hơn
      const errorMessage = emailError.message || 'Không thể gửi email. Vui lòng kiểm tra cấu hình email trong file .env';
      return res.status(500).json({ 
        message: errorMessage 
      });
    }

    res.status(200).json({ 
      message: 'Mã xác nhận đã được gửi đến email của bạn' 
    });
  } catch (error) {
    console.error('❌ Lỗi forgotPassword:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Xác nhận mã và đặt lại mật khẩu
// @route   POST /api/customers/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { email, resetCode, newPassword } = req.body;

    if (!email || !resetCode || !newPassword) {
      return res.status(400).json({ 
        message: 'Vui lòng nhập đầy đủ thông tin: email, mã xác nhận và mật khẩu mới' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: 'Mật khẩu phải có ít nhất 6 ký tự' 
      });
    }

    // Hash mã xác nhận để so sánh
    const hashedCode = crypto
      .createHash('sha256')
      .update(resetCode)
      .digest('hex');

    // Tìm customer với mã xác nhận hợp lệ và chưa hết hạn
    const customer = await Customer.findOne({
      email,
      resetPasswordToken: hashedCode,
      resetPasswordExpires: { $gt: Date.now() }, // Chưa hết hạn
    });

    if (!customer) {
      return res.status(400).json({ 
        message: 'Mã xác nhận không hợp lệ hoặc đã hết hạn' 
      });
    }

    // Đặt lại mật khẩu
    customer.password = newPassword;
    customer.resetPasswordToken = undefined;
    customer.resetPasswordExpires = undefined;

    await customer.save();

    console.log(`✅ Mật khẩu đã được đặt lại cho: ${customer.email}`);

    res.status(200).json({ 
      message: 'Mật khẩu đã được đặt lại thành công. Vui lòng đăng nhập lại.' 
    });
  } catch (error) {
    console.error('❌ Lỗi resetPassword:', error);
    res.status(500).json({ message: error.message });
  }
};

export{
    registerCustomer,
    loginCustomer,
    getCustomerCart,
    addItemToCart,
    removeItemFromCart,
    getCustomerProfile,
    updateUserProfile,
    updateCartItemQuantity,
    clearCart,
    forgotPassword,
    resetPassword,
};