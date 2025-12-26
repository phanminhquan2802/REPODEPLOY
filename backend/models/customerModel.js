import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { hashPassword } from "../utils/hashPassword.js";


//tao schema cho gio hang
const cartItemSchema = mongoose.Schema({
    name: {type: String, required: true},
    quantity: { type: Number, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: true },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Product', //tham chieu den model 'Product'
    },
});
const customerSchema = mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: false },
    phone: { type: String, required: false },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    cart: [cartItemSchema], // Sử dụng schema lồng
  },
  
  {
    timestamps: true,
  }
);
customerSchema.pre("save", async function (){
    // Only hash password if it's been modified (or is new)
    if(!this.isModified("password")){
        return;
    }
    
    // Hash the password
    this.password = await hashPassword(this.password);
    // Mongoose will automatically handle the promise from this async function
});

//ham matchpasword
customerSchema.methods.matchPassword = async function (enteredPassword){
    return await bcrypt.compare(enteredPassword, this.password);
};
const Customer= mongoose.model('Customer', customerSchema);
export default Customer;