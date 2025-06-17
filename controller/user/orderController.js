const User = require("../../models/userSchema")
const Address = require("../../models/addressSchema")
const OrderItem = require("../../models/orderItemSchema");
const Order = require("../../models/orderSchema");
const Product = require("../../models/productSchema")
const Wallet = require("../../models/walletSchema")
const path = require("path");
const PDFDocument = require("pdfkit");
const { constrainedMemory } = require("process");
const { Console } = require("console");


function generateOrderId() {
  const prefix = "#ORD";
  const timestamp = Date.now(); // milliseconds since epoch
  const randomNum = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
  return `${prefix}-ID${timestamp}-${randomNum}`;
}




const getOrder = async (req,res)=> {

  try {
      const userId = req.session.user;

      const user = await User.findOne({_id : userId});
       
      const fullname = user.name;

       const order = await Order.find({user_id:userId}).populate('order_items.product_id address_id').sort({createdAt:-1});
       
 
    
      res.render("orders",{layout:"../layout/userAccount", active:"order" ,user, firstName: fullname , orders:order})

  } catch (error) {
      console.log("error in loading order list", error)
      res.redirect("/pageNotFound")
  }
      
}


async function updateProductStock(productId, quantityPurchased) {
  try{ 
  const product = await Product.findById(productId);

  const newStock = product.stock - quantityPurchased;
  const isOutOfStock = newStock <= 0;

  await Product.findByIdAndUpdate(productId, {
    stock: newStock,
    stock_status: !isOutOfStock
  });
} 
catch(error){
   console.log("error in updating the product stock",error);
   res.redirect("/pageNotFound");
}
}





const placeOrder =  async (req,res) => {
    try {
        

    const { addressId } = req.body;
    const fullDetails = req.body;
    const userId = req.session.user;


    fullDetails.user_id = userId;

    const order_items = req.session.validatedCart;

    const isTypedAddress = req.body.isTypedAddress;

    const saveAddress = req.body.saveForFuture;

    const paymentMethod = req.body.paymentMethod;
    console.log("payment method ", paymentMethod)
    const total = parseFloat(  req.session.total  );
    const delivery = req.session.delivery;
    console.log("calculated total",total  )

    console.log("req . body ", req.body , "req.body endedd/////")

    console.log("products from session ", order_items)

    let order = {};
    let address = {}
    let orderAddress;

    if(!order_items){
      return  res.status(400).json({success:false , message: "Product not found"})
    }

   if(!isTypedAddress){ 

    if (!addressId) {
        return res.status(400).json({ success: false, message: 'Address not selected' });
    }

       address = await Address.findOne({ _id: addressId, user_id: req.session.user });
    if (!address) {
        return res.status(404).json({ success: false, message: 'Invalid address' });
    }
   
  } else if(saveAddress){
         
        orderAddress = new Address(fullDetails)

     await orderAddress.save()
     
     console.log(" in order addresss", orderAddress._id , "end of order address")


     address._id = orderAddress._id;

  } else {
        
         orderAddress = {
            _id: 'oredeID: qwerewr12345', // dummy ID for order reference
            name: fullDetails.name,
            phone_number: fullDetails.phone_number,
            address_name: fullDetails.address_name ,
            locality : fullDetails.locality,
            city : fullDetails.city,
            state: fullDetails.state,
            pin_code: fullDetails.pin_code ,
            address_type: fullDetails.address_type
        };

        order.temp_address = orderAddress;

  }


   
      let orderedProducts = []  
      const orderId = generateOrderId();
    
    for(let product of  order_items.items ){ 
       

            const productFound = await Product.find({_id:product.product_id._id})

            console.log("product found " , productFound)
           
            if(productFound){ 
              
                if(product.product_id.stock < product.quantity){
                      return res.status(400).json({success:false , message: `Not Enough stock available for the product: ${product.product_id.product_name}` });
                }else {

// update quantity    

                  await updateProductStock(product.product_id._id, product.quantity);


                    // const updatedQuantity =  product.product_id.stock - product.quantity
                    //   await Product.findByIdAndUpdate(product.product_id._id , {stock: updatedQuantity  })
                    
                }
               

                orderedProducts.push({product_id: product.product_id._id ,
                                      quantity: product.quantity ,
                                      product_price: product.product_id.final_price,
                                      delivery_charge:delivery
                                     });

                 await new OrderItem({ order_id : orderId,  
                                       order_item: product.product_id._id , 
                                       total_price: product.product_id.final_price ,  
                                       quantity: product.quantity 
                                     }).save();

                  
           
        }   else {
             return res.status(400).json({sucess:false , message: "Product not found , Please check the cart again"})
        }

     }  


     
   



         let payment_method = {};

           if(paymentMethod === 'cod'){
               payment_method.method = 'Cash on Delivery';
               payment_method.status = "pending"
           }
           

          
       
                 const newOrder = new Order({
                                               user_id: req.session.user,
                                               address_id: address?._id || null,                                         
                                                temp_address: order?.temp_address || '',
                                                order_status: 'pending',
                                                order_date: new Date(),
                                                total_price:total,
                                                order_items : orderedProducts,
                                                order_id:orderId,
                                                payment_method

                                             });

                  await newOrder.save();
 
  
                  req.session.orderId = orderId;

    res.json({ success: true});



    } catch (error) {
        console.log("eror in placing order",error)
        res.status(400).json({success:false, message:"Server error"})
    }
}


const orderPlaced = async (req,res)=>{
   
    try {
       
        const orderId = req.session.orderId

          const isoDate = new Date().toISOString().substring(0, 10);
               const [year, month, day] = isoDate.split('-');
               const date = `${day}/${month}/${year}`
      

        const order = await Order.findOne({order_id:orderId}).populate('order_items.product_id');
        
       

        res.render("orderPlaced",{orderId,date, order})
        
    } catch (error) {
        console.log("error in  order confirmation ",error);
        res.redrirect("/pageNotFound")
    }



}

const cancelProduct = async (req,res)=> {

  try {
         const userId = req.session.user;
        const productId = req.params.productId;
         const orderId =  decodeURIComponent(req.params.orderId)

          let order = await Order.findOne({order_id:orderId}).populate('order_items.product_id')

    
           
          const returnedItem = order.order_items.find(product=>product.product_id._id == productId )



          const {product_price , delivery_charge , quantity} = returnedItem;

          const refundAmount = parseFloat(product_price * quantity + delivery_charge);


          for(let product of order.order_items){

              if(product.product_id._id == productId){
                        
                  product.order_status = 'cancelled';
                  product.cancelled_date = new Date()
                  await order.save()

                }

          }
         
         
          const product = await Product.findByIdAndUpdate(productId, {$inc : {stock:quantity},stock_status:true},{new:true})

          // const wallet = await Wallet.findOneAndUpdate({user_id: userId} , { $inc :{balance:refundAmount}})
     
         res.status(200).json()


  } catch (error) {
    console.log("error in cancelling product ", error)
    res.status(400).json();
  }


}

const returnProduct = async (req,res)=>{  
      
     try {
            const orderId =  decodeURIComponent(req.params.orderId)
          const { productId }= req.params
          const reason = req.body.reason

          const order = await Order.findOne({order_id:orderId}).populate('order_items.product_id')

          console.log("product ids ",productId , order.order_items[0].product_id )
           
          const returnedItem = order.order_items.find(product=>product.product_id._id == productId )
          
          console.log("returned items " , returnedItem ,reason)

          for(let product of order.order_items){
               
               if(product.product_id._id == productId){
                   
                  // product.order_status = 'returned'
                  product.return_request.status = 'requested'
                  product.return_request.reason = reason
                   product.return_request.requestedAt = new Date()
                   await order.save()

                }

          }


          res.status(200).json()
      
     } catch (error) {
        console.log("error in returning product", error)
        res.status(400).json()
     }

}





const generateInvoice = async (req, res) => {
  try {
    const orderId = decodeURIComponent(req.params.orderId);
    const productId = req.params.productId;
    const userId = req.session.user;
   
 

    const order = await Order.findOne({ order_id: orderId})
      .populate({
        path: "order_items.product_id",
        select: "product_name product_image",
      })
      .populate("address_id");



    if (!order) {
      
      return res.send("/orders");
    }



      const user = await User.findById(userId);

    const userName = order?.address_id?.name || "Customer";
    const userEmail = user?.email || "";

    const doc = new PDFDocument({ margin: 50, bufferPages: true, size: "A4" });

    const fontPath = path.join(
      "public",
      "assets",
      "fonts",
      "NotoSans-Regular.ttf"
    );
    doc.registerFont("Unicode", fontPath);
    doc.font("Unicode");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${order.order_id || orderId}.pdf`
    );

    doc.pipe(res);

    // Company logo and info
    doc
      .fontSize(10)
      .text("Petal & Mist", 400, 50, { align: "right" })
      .text("123 Business Street", { align: "right" })
      .text("City, State, 874596", { align: "right" })
      .text("Email:", { align: "right" })
      .text("petal&mist@company.com", { align: "right" });

    // Invoice header
    doc.fillColor("#333333").fontSize(25).text("INVOICE", 50, 120);
    doc
      .fontSize(10)
      .fillColor("#555555")
      .text(`Invoice: ${order.order_id || orderId}`, 50, 150)
      .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 50, 165);

    // Customer info
    doc
      .fontSize(12)
      .fillColor("#000")
      .text("Bill To:", 50, 195, { underline: true });

    let currentY = 210;
    doc.fontSize(10).text(userName, 50, currentY);
    currentY += 15;
    doc.text(userEmail, 50, currentY);
    currentY += 15;

    if (order.address_id) {
      doc.text(
        `${order.address_id.address_name}${
          order.address_id.city ? ", " + order.address_id.city : ""
        }`,
        50,
        currentY
      );
      currentY += 15;
      doc.text(
        `${order.address_id.state}${
          order.address_id.pin_code ? " - " + order.address_id.pin_code : ""
        }`,
        50,
        currentY +=15
      );
      currentY += 15;
      doc.text(order.address_id.country, 50, currentY);
      currentY += 15;
    }

    // Table layout - ensure enough space after address
    const tableTop = currentY + 20;

    // Properly spaced columns - ensuring enough width for each
    const itemCodeX = 50;
    const descriptionX = 120;
    const quantityX = 300;
    const priceX = 350;
    const amountX = 430;

    // Table header background
    doc
      .rect(50, tableTop - 5, 500, 20)
      .fillColor("#f0f0f0")
      .fill()
      .strokeColor("#cccccc")
      .stroke();

    // Table headers
    doc
      .fillColor("#000000")
      .fontSize(10)
      .text("Item", itemCodeX, tableTop, { width: 60 })
      .text("Description", descriptionX, tableTop, { width: 170 })
      .text("Qty", quantityX, tableTop, { width: 40 })
      .text("Price", priceX, tableTop, { width: 70 })
      .text("Amount", amountX, tableTop, { width: 70 });

    // Row data
    let y = tableTop + 20;
    order.order_items.forEach((item, i) => {
      const productName = item.product_id?.product_name || "Product";
      const isEven = i % 2 === 0;

      if (isEven) {
        doc
          .rect(50, y - 2, 500, 18)
          .fillColor("#f9f9f9")
          .fill()
          .strokeColor("#cccccc")
          .stroke();
      }

      // Define clear column widths
      doc
        .fillColor("#000")
        .fontSize(10)
        .text(productName.substring(0, 10), itemCodeX, y, { width: 60 })
        .text(productName, descriptionX, y, { width: 170 })
        .text(item.quantity.toString(), quantityX, y, { width: 40 })
        .text(`₹${item.product_price.toFixed(2)}`, priceX, y, { width: 70 })
        .text(`₹${(item.product_price * item.quantity).toFixed(2)}`, amountX, y, {
          width: 70,
          align: "left",
        });

      y += 20;
    });

    // Add padding after the table
    y += 20;

    // Totals section - moved to the right side
    // Draw totals with fixed positioning to ensure they appear as expected
    doc
      .rect(350, y, 200, order.discount > 0 ? 80 : 60)
      .fillColor("#f9f9f9")
      .fill()
      .strokeColor("#dddddd")
      .stroke();

    // Make sure totals align properly
    doc
      .fillColor("#000000")
      .fontSize(10)
      .text("Subtotal:", 370, y + 15, { width: 75 })
      .text(`₹ ${order.total_price.toFixed()}`, 490, y + 15, {
        width: 50,
        align: "right",
      });

    y +=20;

    order.order_items.forEach((item, i) => {


      if(item.product_id._id == productId ){ 

     doc
      .fillColor("#000000")
      .fontSize(10)
      .text("delivery:", 370, y + 15, { width: 75 })
      .text(`₹ ${item.delivery_charge.toFixed()}`, 490, y + 15, {
        width: 50,
        align: "right",
      });

    }

    })  

    

    if (order?.discount > 0) {
      doc
        .text("Discount:", 370, y + 35, { width: 75 })
        .text(`-₹ ${order.discount.toFixed()}`, 490, y + 35, {
          width: 50,
          align: "right",
        });

      doc
        .fontSize(11)
        .font("Unicode")
        .text("Total:", 370, y + 60, { width: 75 })
        .text(`₹ ${order.finalAmount.toFixed()}`, 490, y + 60, {
          width: 50,
          align: "right",
        });
    } else {
      doc
        .fontSize(11)
        .font("Unicode")
        .text("Total:", 370, y + 35, { width: 75 })
        .text(`₹ ${order.total_price.toFixed()}`, 490, y + 35, {
          width: 50,
          align: "right",
        });
    }

    // Move down to ensure space for payment info
    y = y + (order.discount > 0 ? 100 : 80);

    // Payment info - formatted as a clean section
    doc
      .fontSize(10)
      .font("Unicode")
      .text("Payment Information", 50, y, { underline: true });

    y += 20;
    doc.text(`Payment Status: ${order.order_status}`, 50, y);
    y += 15;
    doc.text(`Payment Method: ${order.payment_method.method}`, 50, y);

    // Thank you note - centered properly
    y += 30;
    doc.fontSize(12).text("Thank you for your business!", 50, y, {
      align: "center",
      width: 500,
    });

    //Check if we need to add a page for footer
    if (y > doc.page.height - 100) {
      doc.addPage();
      y = 50;
    }

    // Footer with line
    const footerY = doc.page.height - 75;
    doc
      .moveTo(50, footerY)
      .lineTo(550, footerY)
      .strokeColor("#dddddd")
      .stroke();

    doc
      .fontSize(8)
      .fillColor("#888888")
      .text(
        "This is a computer generated invoice and does not require a signature.",
        50,
        footerY + 10,
        { align: "center", width: 500 }
      );

    doc.end();

    console.log("fully completed")
   
  } catch (error) {
    console.error("Error generating invoice:", error);
    if (!res.headersSent) {
  
      return res.redirect("/orders");
    }
  }
};

module.exports = {placeOrder , orderPlaced , getOrder , generateInvoice , returnProduct , cancelProduct}