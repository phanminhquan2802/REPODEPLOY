import mongoose from "mongoose";

const productSchema = mongoose.Schema(
    {
        name: { type: String, required: true },
        image: { type: String, required: true },
        category: { type: String, required: true },
        description: { type: String, required: true },
        language: { type: String, default: 'Tiếng Việt' },
        
        price: { type: Number, required: true, default: 0 },
        
        // Trường tồn kho
        countInStock: { type: Number, required: true, default: 0 },
        
        // ========================================
        // ✅ THÊM: Hỗ trợ Abstract Factory Pattern
        // ========================================
        productType: { 
            type: String, 
            enum: ['Book', 'Electronic', 'Clothing', 'Other'],
            default: 'Other'
        },
        shippingFee: { 
            type: Number, 
            default: 0 
        },
        
        // Thông tin riêng cho từng loại sản phẩm
        // Book
        author: { type: String },
        publisher: { type: String },
        pageCount: { type: Number },
        isbn: { type: String },
        
        // Electronic
        brand: { type: String },
        warranty: { type: String },
        specs: { type: Object },
        
        // Clothing
        size: { type: String },
        color: { type: String },
        material: { type: String },
        
        // SEO
        metaTitle: { type: String },
        metaDescription: { type: String },
        metaKeywords: { type: String },
    },
    {
        timestamps: true,
    }
);

// ========================================
// ✅ Method: Tính shipping fee dựa trên productType
// ========================================
productSchema.methods.calculateShippingFee = function() {
    switch(this.productType) {
        case 'Book':
            return this.price > 100000 ? 0 : 15000;
        case 'Electronic':
            return this.price > 500000 ? 0 : 30000;
        case 'Clothing':
            return this.price > 200000 ? 0 : 20000;
        default:
            return this.price > 100000 ? 0 : 15000;
    }
};

const Product = mongoose.model('Product', productSchema);
export default Product;