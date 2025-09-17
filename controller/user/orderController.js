const User = require("../../models/userSchema")
const Order = require("../../models/orderSchema")
const Product = require("../../models/productSchema")
const Wallet = require("../../models/walletSchema")
const path = require("path")
const PDFDocument = require("pdfkit")
const Transaction = require("../../models/transactionSchema")
const Varient = require("../../models/varientsSchema")



const getOrder = async (req, res) => {

  try {
    const userId = req.session.user;

    const user = await User.findOne({ _id: userId });

    const fullname = user.name;

    const order = await Order.find({ user_id: userId }).populate('order_items.product_id address_id').sort({ createdAt: -1 });

    res.render("orders", { layout: "../layout/userAccount", active: "order", user, firstName: fullname, orders: order })

  } catch (error) {
    console.log("error in loading order list", error)
    res.redirect("/pageNotFound")
  }

}


const orderPlaced = async (req, res) => {

  try {

    const orderId = req.session.orderId

    const isoDate = new Date().toISOString().substring(0, 10);
    const [year, month, day] = isoDate.split('-');
    const date = `${day}/${month}/${year}`

    const order = await Order.findOne({ order_id: orderId }).populate('order_items.product_id');


    order.order_status = 'pending';

    order.estimated_delivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)


    for (let ord of order.order_items) {
      ord.order_status = 'pending';
    }

    if (order.payment_method.method === 'online') {
      order.isPaid = true;
      order.payment_method.status = 'paid';
    }

    await order.save();
    req.session.coupon = null



    res.render("orderPlaced", { orderId, date, order })

  } catch (error) {
    console.log("error in  order confirmation ", error);
    res.redirect("/pageNotFound")
  }

}


const orderFailed = async (req, res) => {

  try {

    const orderId = req.session.orderId

    const isoDate = new Date().toISOString().substring(0, 10);
    const [year, month, day] = isoDate.split('-');
    const date = `${day}/${month}/${year}`


    const order = await Order.findOne({ order_id: orderId }).populate('order_items.product_id');

    order.order_status = 'failed';
    order.payment_method.status = 'failed'
    order.isPaid = false;


    for (let ord of order.order_items) {
      ord.order_status = 'failed';
    }

    await order.save();

    res.render("razorpayFailed", { orderId, date, order })

  } catch (error) {
    console.log("error in  order confirmation ", error);
    res.redrirect("/pageError")
  }

}



const cancelProduct = async (req, res) => {

  try {
    const userId = req.session.user;
    const productId = req.params.productId;
    const orderId = decodeURIComponent(req.params.orderId)
    const productOrderId = req.params.productOrderId;
    const reason = req.body.reason;


    const order = await Order.findOne({ order_id: orderId })

    const returnedItem = order.order_items.find(product => product._id.toString() === productOrderId)

    const { product_price, quantity, volume } = returnedItem;

    const itemSubtotal = quantity * product_price;

    const totalProductPrice = order.order_items.reduce((sum, item) => sum + (item.product_price * item.quantity), 0)

    let refundAmount = itemSubtotal;

    if (order.discount > 0) {
      const discountShare = (itemSubtotal / totalProductPrice) * order.discount;
      refundAmount = itemSubtotal - discountShare;
    }

    if (order.order_items.filter(v => v.order_status !== 'cancelled').length === 1) {
      refundAmount += order.delivery;
      order.order_status = 'cancelled';
    }


    if (order.isPaid) {

      const wallet = await Wallet.findOneAndUpdate({ user_id: userId }, { $inc: { balance: refundAmount } })

      if (!wallet) {
        const wallet = await new Wallet({ user_id: userId, balance: refundAmount }).save()

        await User.findByIdAndUpdate(userId, { wallet_id: wallet._id })
      }



      const transaction = await new Transaction({
        amount: refundAmount,
        order_id: order._id,
        user_id: userId,
        status: 'credited',
        transaction_date: new Date()
      }).save()


      await Wallet.findOneAndUpdate({ user_id: userId }, { $push: { transaction_id: transaction._id } })

    }



    for (let product of order.order_items) {

      if (product.product_id.toString() === productId && product.volume === volume) {

        product.order_status = 'cancelled';
        product.cancelled_date = new Date();
        product.cancel_reason = reason || null;

        if (order.isPaid) {
          product.refund_amount = refundAmount;
        }

      }

    }

    await order.save();

    const varient = await Varient.findOne({ product_id: productId });

    for (let v of varient.inventory) {

      if (v.volume === volume) {
        v.stock += quantity;
      }

    }

    await varient.save();


    res.status(200).json()


  } catch (error) {
    console.log("error in cancelling product ", error)
    res.status(400).json();
  }


}


const cancelFullOrder = async (req, res) => {

  try {

    const userId = req.session.user;
    const orderId = decodeURIComponent(req.params.orderId)
    const reason = req.body.reason;

    const order = await Order.findOne({ order_id: orderId })

    const activeItems = order.order_items.filter(item => item.order_status !== 'cancelled');
    const totalActivePrice = activeItems.reduce((sum, i) => sum + i.product_price * i.quantity, 0);


    let totalRefundAmount = 0;

    order.order_items.forEach(item => {
      if (item.order_status !== 'cancelled') {
        const itemSubtotal = Number(item.quantity * item.product_price);


        let refundAmount = itemSubtotal;

        if (order.discount > 0 && totalActivePrice > 0) {
          const discountShare = (itemSubtotal / totalActivePrice) * order.discount;
          refundAmount = itemSubtotal - discountShare;
        }

     
        totalRefundAmount += refundAmount;


        item.order_status = 'cancelled';
        item.cancelled_date = new Date();
        item.cancel_reason = reason || null;

      }
    });



    totalRefundAmount += Number(order.delivery_charge);
    order.order_status = 'cancelled';


    if (order.isPaid) {

      const wallet = await Wallet.findOneAndUpdate({ user_id: userId }, { $inc: { balance: totalRefundAmount.toFixed(2) } })

      if (!wallet) {
        const wallet = await new Wallet({ user_id: userId, balance: totalRefundAmount }).save()

        await User.findByIdAndUpdate(userId, { wallet_id: wallet._id })
      }



      const transaction = await new Transaction({
        amount: totalRefundAmount,
        order_id: order._id,
        user_id: userId,
        status: 'credited',
        transaction_date: new Date()
      }).save()


      await Wallet.findOneAndUpdate({ user_id: userId }, { $push: { transaction_id: transaction } })

    }


    await order.save();

    let varient = await Varient.find();

    varient = varient.filter(p => {
      return order.order_items.some(i => i.product_id.toString() === p.product_id.toString())
    })

    for (let vari of varient) {

      for (let v of vari.inventory)

        order.order_items.forEach(i => {

          if (i.volume === v.volume && i.order_status !== 'cancelled' && i.product_id.toString() === vari.product_id.toString()) {
            v.stock += i.quantity;
          }

        })

      await vari.save()
    }


    res.status(200).json()


  } catch (error) {
    console.log("error in cancelling product ", error)
    res.status(400).json();
  }


}




const returnProduct = async (req, res) => {

  try {
    const orderId = decodeURIComponent(req.params.orderId)
    const { productId } = req.params
    const reason = req.body.reason

    const order = await Order.findOne({ order_id: orderId }).populate('order_items.product_id')



    for (let product of order.order_items) {

      if (product.product_id._id == productId) {

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
    res.status(500).json()
  }

}


const generateInvoice = async (req, res) => {
  try {
    const orderId = decodeURIComponent(req.params.orderId);
    const productId = req.params.productId;
    const userId = req.session.user;



    const order = await Order.findOne({ order_id: orderId })
      .populate({
        path: "order_items.product_id",
        select: "product_name delivery_charge",
      })
      .populate("address_id");



    if (!order) {

      return res.redirect("/orders");
    }

    let delivery = order.delivery_charge || 0;
    order.order_items.forEach(item => {
      delivery = item.delivery_charge ? item.delivery_charge : 0

    })

    const user = await User.findById(userId);

    const userName = order?.address_id?.name || "Customer";
    const userEmail = user?.email || "";

    const deliveredItems = order.order_items.filter(item => item.order_status === 'delivered');

    const totalProductPrice = order.order_items.reduce(
      (sum, item) => sum + item.quantity * item.product_price
      , 0);

    const deliveredSubtotal = deliveredItems.reduce(
      (sum, item) => sum + item.quantity * item.product_price
      , 0);

    deliveredItems.forEach(item => {
      const itemSubtotal = item.quantity * item.product_price;
      item.discountShare = (itemSubtotal / totalProductPrice) * order.discount;
    });

    const deliveredTotal = deliveredSubtotal - deliveredItems.reduce((sum, item) => sum + item.discountShare, 0) + order.delivery_charge;

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
      .text(`Ordered Date: ${new Date(order.createdAt).toLocaleDateString()}`, 50, 165)
      .text(`Deliverd Date: ${new Date(order?.delivered_date).toLocaleDateString()}`, 50, 180);

    // Customer info
    doc
      .fontSize(12)
      .fillColor("#000")
      .text("Bill To:", 50, 200, { underline: true });

    let currentY = 220;
    doc.fontSize(10).text(userName, 50, currentY);
    currentY += 15;
    doc.text(userEmail, 50, currentY);
    currentY += 15;

    if (order.address_id) {
      doc.text(
        `${order.address_id.address_name}${order.address_id.city ? ", " + order.address_id.city : ""
        }`,
        50,
        currentY
      );
      currentY += 15;
      doc.text(
        `${order.address_id.state}${order.address_id.pin_code ? " - " + order.address_id.pin_code : ""
        }`,
        50,

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
      .text("Sl.no", itemCodeX, tableTop, { width: 20 })
      .text("Item", descriptionX, tableTop, { width: 184 })
      .text("Qty", quantityX, tableTop, { width: 40 })
      .text("Price", priceX, tableTop, { width: 70 })
      .text("Amount", amountX, tableTop, { width: 70 });

    // Row data
    let y = tableTop + 20;
    deliveredItems.forEach((item, i) => {

      const productName = item.product_id?.product_name.length > 27 ?
        item.product_id.product_name.substring(0, 25) + '...' + ' (' + item.volume + ' ML)' || 'Product' :
        item.product_id.product_name + ' (' + item.volume + ' ML)' || "Product";

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
        .text(i + 1, itemCodeX, y, { width: 20 })
        .text(productName, descriptionX, y, { width: 190 })
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
      .rect(350, y, 200, 80)
      .fillColor("#f9f9f9")
      .fill()
      .strokeColor("#dddddd")
      .stroke();

    // Make sure totals align properly
    doc
      .fillColor("#000000")
      .fontSize(10)
      .text("Subtotal:", 370, y + 15, { width: 75 })
      .text(`₹ ${deliveredSubtotal.toFixed(2)}`, 490, y + 15, {
        width: 50,
        align: "right",
      });

    y += 20;

    deliveredItems.forEach((item, i) => {


      if (item.product_id._id.toString() === productId.toString()) {

        doc
          .fillColor("#000000")
          .fontSize(10)
          .text("delivery:", 370, y + 15, { width: 75 })
          .text(`₹ ${order.delivery_charge.toFixed(2)} `, 490, y + 15, {
            width: 50,
            align: "right",
          });

      }

    })


    y += 20;


    doc
      .text("Discount:", 370, y + 15, { width: 75 })
      .text(`-₹ ${deliveredItems.reduce((sum, item) => sum + item.discountShare, 0).toFixed(2)}`, 490, y + 15, {
        width: 50,
        align: "right",
      });

    doc
      .fontSize(11)
      .font("Unicode")
      .text("Total:", 370, y + 60, { width: 75 })
      .text(`₹ ${deliveredTotal.toFixed(2)}`, 490, y + 60, {
        width: 50,
        align: "right",
      });


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


  } catch (error) {
    console.error("Error generating invoice:", error);
    if (!res.headersSent) {

      return res.redirect("/orders");
    }
  }
};

module.exports = { orderPlaced, getOrder, generateInvoice, returnProduct, cancelProduct, orderFailed, cancelFullOrder }