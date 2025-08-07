
const Order = require("../../models/orderSchema")
const PDFDocument = require("pdfkit");
const path = require("path")
const ExcelJS = require("exceljs");
const { report } = require("process");
const { start } = require("repl");


// Load Sales Report Page
const getSalesReport = async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const day = req.query.day || ''
    const ITEMS_PER_PAGE = 10;
    const skip = (page - 1) * ITEMS_PER_PAGE;
    const status = req.query.status
    const selectedDate = req.query.date || '';
    let { start, end } = req.query || '';
    const date = req.query.date || '';

    let query = {}
    let singleDate = '';
    if (date) {
      const [yyyy, mm, dd] = date.split('-')

      singleDate = dd + '-' + mm + '-' + yyyy;
    }
    if (status && status !== 'all') {
      query = { order_items: { $elemMatch: { order_status: status } } }
    }

    if (selectedDate) {

      const startDate = new Date(selectedDate);
      const endDate = new Date(selectedDate);
      endDate.setHours(23, 59, 59, 999);
      query.order_date = { $gte: startDate, $lte: endDate }

    }

    // to format date
    function formatDate(dateStr) {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      const dd = String(date.getDate()).padStart(2, '0');
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const yyyy = date.getFullYear();
      return `${dd}-${mm}-${yyyy}`;
    }

    let dateRange = '';


    if (start && end) {
      const startDate = new Date(start)
      const endDate = new Date(end)
      endDate.setHours(23, 59, 59, 999)
      query.order_date = { $gte: startDate, $lte: endDate }
      const formattedStart = formatDate(start);
      const formattedEnd = formatDate(end);
      dateRange = `${formattedStart} to ${formattedEnd}`;
    }


    // Filter based on day
    const now = new Date();
    if (day === "salesToday") {
      const start = new Date(now.setHours(0, 0, 0, 0));
      const end = new Date(now.setHours(23, 59, 59, 999));
      query.createdAt = { $gte: start, $lte: end };
    } else if (day === "salesWeekly") {
      const start = new Date();
      start.setDate(now.getDate() - 7);
      query.createdAt = { $gte: start };
    } else if (day === "salesMonthly") {
      const start = new Date();
      start.setMonth(now.getMonth() - 1);
      query.createdAt = { $gte: start };
    } else if (day === "salesYearly") {
      const start = new Date();
      start.setFullYear(now.getFullYear() - 1);
      query.createdAt = { $gte: start };
    }


    const sortOrder = (start && end) ? { createdAt: 1 } : { createdAt: -1 };


    let orders = await Order.find(query)
      .populate("address_id")
      .populate("order_items.product_id")
      .sort(sortOrder)
      .skip(skip)
      .limit(ITEMS_PER_PAGE);



    let totalOrders = await Order.countDocuments(query)



    const totalPages = Math.ceil(totalOrders / ITEMS_PER_PAGE);


    res.render("dashboard", {
      data: orders,
      salesToday: day === "salesToday",
      salesWeekly: day === "salesWeekly",
      salesMonthly: day === "salesMonthly",
      salesYearly: day === "salesYearly",
      totalPages,
      selectedStatus: status,
      currentPage: Number(page),
      date: selectedDate,
      day,
      singleDate,
      start, end,
      dateRange
    });
  } catch (error) {
    console.error("Sales Report Load Error:", error);
    res.status(500).send("Internal Server Error");
  }
};

const getChartData = async (req, res) => {
  try {

    const query = req.query.query

    const now = new Date()
    let startDate, endDate = new Date()



    switch (query) {
      case 'daily':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);


        break;

      case 'weekly':
        const currentDay = now.getDay(); // 0 (Sun) to 6 (Sat)
        const diff = now.getDate() - 7;

        startDate = new Date(now);
        startDate.setDate(diff);
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(); // today
        endDate.setHours(23, 59, 59, 999);


        break;

      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1); // 1st of this month
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // last day of month
        endDate.setHours(23, 59, 59, 999);


        break;

      default:
        // fallback to all
        startDate = new Date(2000, 1, 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
    }



    const filter = { createdAt: { $gte: startDate, $lte: endDate } }


    const orders = await Order.aggregate([{ $match: filter }, { $unwind: '$order_items' }, { $group: { _id: '$order_items.order_status', count: { $sum: 1 } } }]);


    const response = {
      total: 0,
      delivered: 0,
      returned: 0,
      cancelled: 0,
      pending: 0,
      failed: 0,
      out_for_delivery: 0
    };



    orders.forEach(item => {

      response.total += item.count;
      if (item._id === "delivered") response.delivered = item.count;
      else if (item._id === "returned") response.returned = item.count;
      else if (item._id === "cancelled") response.cancelled = item.count;
      else if (item._id === "pending") response.pending = item.count;
      else if (item._id === "failed") response.failed = item.count;
      else if (item._id === 'out_for_delivery') response.out_for_delivery = item.count
    })


    res.json(response)


  } catch (error) {
    console.log("error in creating chart", error)
  }
}


const getTopItems = async (req, res) => {
  try {


    const filter = req.query.query;
    const now = new Date();
    let startDate, endDate;



    switch (filter) {
      case "daily":
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;

      case "weekly": {
        const day = now.getDay(); // 0 (Sun) to 6 (Sat)
        const diff = now.getDate() - 6;
        startDate = new Date(now);
        startDate.setDate(diff);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        break;
      }

      case "monthly":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;

      case "yearly":
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        endDate.setHours(23, 59, 59, 999);
        break;

      default:
        startDate = new Date(2000, 0, 1);
        endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
    }


    const topProducts = await Order.aggregate([

      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },

      { $unwind: '$order_items' },
      {
        $group: {
          _id: '$order_items.product_id',
          totalSold: { $sum: '$order_items.quantity' }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products', localField: '_id', foreignField: '_id', as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          _id: 1,
          totalSold: 1,
          product_name: '$product.product_name',
          price: '$product.final_price'



        }
      }

    ])


    const topCategories = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },

      { $unwind: "$order_items" },
      {
        $lookup: {
          from: "products",
          localField: "order_items.product_id",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: "$product.category_id",
          totalSold: { $sum: "$order_items.quantity" }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category"
        }
      },
      { $unwind: "$category" },
      {
        $project: {
          _id: 1,
          totalSold: 1,
          category_name: "$category.name"
        }
      }
    ]);

    const topBrands = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      { $unwind: "$order_items" },
      {
        $lookup: {
          from: "products",
          localField: "order_items.product_id",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: "$product.brand_id",
          totalSold: { $sum: "$order_items.quantity" }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "brands",
          localField: "_id",
          foreignField: "_id",
          as: "brand"
        }
      },
      { $unwind: "$brand" },
      {
        $project: {
          _id: 1,
          totalSold: 1,
          brand_name: "$brand.name"
        }
      }
    ]);


    // total sales part 

    const order = await Order.find({ createdAt: { $gte: startDate, $lte: endDate } })
    const totalSales = {};

    totalSales.totalOrders = order.length;
    totalSales.totalRevenue = order.reduce((sum, product) => {

      if (product.isPaid || product.order_status === 'delivered') {

        sum = sum + product.total_price

      }

      return sum

    }, 0).toFixed(2)


    totalSales.totalDiscount = order.reduce((sum, product) => sum + product.discount, 0).toFixed(2);
    if (order.length === 0) {
      totalSales.averageOrderValue = 0;
    } else {
      totalSales.averageOrderValue = (totalSales.totalRevenue / totalSales.totalOrders).toFixed(2)
    }

    res.status(200).json({ topProducts, topCategories, topBrands, totalSales })



  } catch (error) {
    console.log('error in getting top products', error)

  }
}



// Export sales report
const exportSalesReport = async (req, res) => {
  try {
    const {
      reportType,
      singleDate,
      startDate,
      endDate,
      paymentMethod,
      orderStatus,
      format,
    } = req.body;



    let query = {}
    // Get date range based on report type


    const { start, end } = getDateRange(
      reportType,
      singleDate,
      startDate,
      endDate
    );

 console.log('start' , startDate , endDate , singleDate , !singleDate ,  !startDate , !endDate)
    query = {
      createdAt: { $gte: start, $lte: end },
    };


    // Add payment method filter if specified
    if (paymentMethod !== "all") {
      query.paymentMethod = paymentMethod;
    }

    // Add order status filter if specified
    if (orderStatus !== "all") {
      query.order_status = orderStatus;
    }

    // Fetch orders based on filters
    const orders = await Order.find(query)
      .populate("user_id address_id")
      .sort({ createdAt: -1 });


    if (orders.length === 0) {
      return res.status(400).json({
        message: "NO order found",
      });
    }


    // Calculate totals
    const totalOrders = orders.length;
    let totalSubtotal = orders.reduce(
      (sum, order) => sum + order.total_price,
      0
    );
    const totalDiscounts = orders.reduce(
      (sum, order) => sum + order.discount,
      0
    );

    const totalRevenue = totalSubtotal - totalDiscounts

    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Format date range for filename
    let dateRangeStr;
    if (reportType === "all") {
      const [yyyy, mm, dd] = singleDate.split('-');
      dateRangeStr = dd + '-' + mm + '-' + yyyy
    } else {
      dateRangeStr = reportType;
    }
    if (startDate) {
      dateRangeStr = startDate + ' to ' + endDate;
    }

    if(!singleDate && !startDate && !endDate){
          dateRangeStr  = 'All'
    }

    // Generate the appropriate file format
    if (format === "excel") {
      await exportToExcel(res, orders, {
        reportType,
        dateRange: dateRangeStr,
        totalOrders,
        totalSubtotal,
        totalDiscounts,
        totalRevenue,
        averageOrderValue,
      });
    } else if (format === "pdf") {
      await exportToPdf(res, orders, {
        reportType,
        dateRange: dateRangeStr,
        totalOrders,
        totalSubtotal,
        totalDiscounts,
        totalRevenue,
        averageOrderValue,
      });
    } else {
      return res.status(400).json({
        message: "Invalid export format",
      });
    }
  } catch (error) {
    console.error("Error exporting sales report:", error);
    res.status(500).json({
      message: "server error in exporting data",
      error: error.message,
    });
  }
};


function getDateRange(reportType, singleDate, startDate, endDate) {
  const now = new Date()
  let start = new Date();
  let end = new Date();

  function parseDate(dateStr) {
    const [dd, mm, yyyy] = dateStr.split("-");
    return new Date(`${yyyy}-${mm}-${dd}`); // → YYYY-MM-DD
  }


  if (singleDate) {

    start = new Date(singleDate);
    start.setHours(0, 0, 0, 0);
    end = new Date(singleDate);
    end.setHours(23, 59, 59, 999);
    return { start, end }
  }


  if (startDate && endDate) {

    start = parseDate(startDate)
    start.setHours(0, 0, 0, 0)
    end = parseDate(endDate)
    end.setHours(23, 59, 59, 999)
    return { start, end }
  }

  if (reportType === "salesToday") {
    start = new Date(now);
    start.setHours(0, 0, 0, 0);
    end = new Date(now);
    end.setHours(23, 59, 59, 999);
  }

  else if (reportType === "salesWeekly") {
    // Start from 7 days ago
    start = new Date(now);
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);

    end = new Date(now);
    end.setHours(23, 59, 59, 999);
  }

  else if (reportType === "salesMonthly") {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    start.setHours(0, 0, 0, 0);

    end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
  }

  else if (reportType === "salesYearly") {
    start = new Date(now.getFullYear(), 0, 1);
    start.setHours(0, 0, 0, 0);

    end = new Date(now.getFullYear(), 11, 31);
    end.setHours(23, 59, 59, 999);
  }

  else if (reportType === 'all') {
    start = new Date('2000-01-01');
    end = new Date();
    end.setHours(23, 59, 59, 999);

  }

  return { start, end };
}



//Export to PDF
async function exportToPdf(res, orders, summary) {
  try {
    

    // Create a new PDF document (explicitly set to portrait)
    const doc = new PDFDocument({ margin: 50, layout: "portrait" });

    const fontPath = path.join(
      "public",
      "assets",
      "fonts",
      "NotoSans-Regular.ttf"
    );
    doc.registerFont("Unicode", fontPath);
    doc.font("Unicode");

    // Set response headers for file download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=sales_report_${summary.dateRange}.pdf`
    );

    // Pipe the PDF document to the response
    doc.pipe(res);

    // Add title
    doc
      .fontSize(18)
      .font("Unicode")
      .text(`Sales Report - ${summary.reportType.toUpperCase()}`, {
        align: "center",
      });
    doc.moveDown();

    // Add summary section
    doc.fontSize(14).font("Unicode").text("Summary", { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(12).font("Unicode");
    doc.text(`Date Range: ${summary.dateRange}`);
    doc.text(`Total Orders: ${summary.totalOrders}`);
    doc.text(`Total Subtotal: ₹${summary.totalSubtotal.toFixed(2)}`);
    doc.text(`Total Discounts: ₹${summary.totalDiscounts.toFixed(2)}`);
    doc.text(`Total Revenue: ₹${summary.totalRevenue.toFixed(2)}`);
    doc.text(`Average Order Value: ₹${summary.averageOrderValue.toFixed(2)}`);
    doc.moveDown(2);

    // Add orders table
    doc.fontSize(14).font("Unicode").text("Order Details", { underline: true });
    doc.moveDown();

    // Define table columns - UPDATED to include Payment Method and Discount
    const tableTop = doc.y;
    const tableColumns = [
      "Order ID",
      "Date",
      "Customer",
      "Payment Method",
      "Status",
      "Discount",
      "Total",
    ];
    // Adjusted column widths to fit payment method and discount while maintaining portrait layout
    const columnWidths = [70, 70, 65 , 90, 65, 65, 65];
    let currentLeft = 50; // starting from left margin

    // Draw table header
    doc.fontSize(9).font("Unicode");
    tableColumns.forEach((column, i) => {
      doc.text(column, currentLeft, tableTop, {
        width: columnWidths[i],
        align: "left",
      });
      currentLeft += columnWidths[i];
    });

    const headerHeight = 20;
    doc
      .moveTo(50, tableTop - 5)
      .lineTo(
        50 + columnWidths.reduce((sum, width) => sum + width, 0),
        tableTop - 5
      )
      .stroke();

    doc
      .moveTo(50, tableTop + headerHeight)
      .lineTo(
        50 + columnWidths.reduce((sum, width) => sum + width, 0),
        tableTop + headerHeight
      )
      .stroke();

    // Draw table rows
    let rowTop = tableTop + headerHeight + 5;
    doc.fontSize(8).font("Unicode");

    // Function to check if we need a new page
    const checkNewPage = (y, height = 20) => {
      if (y + height > doc.page.height - 50) {
        doc.addPage();

        // Add column headers to new page
        doc.fontSize(9).font("Unicode");
        let headerLeft = 50;
        tableColumns.forEach((column, i) => {
          doc.text(column, headerLeft, 50, {
            width: columnWidths[i],
            align: "left",
          });
          headerLeft += columnWidths[i];
        });

        // Add header line
        doc
          .moveTo(50, 45)
          .lineTo(50 + columnWidths.reduce((sum, width) => sum + width, 0), 45)
          .stroke();

        doc
          .moveTo(50, 70)
          .lineTo(50 + columnWidths.reduce((sum, width) => sum + width, 0), 70)
          .stroke();

        doc.fontSize(8).font("Unicode");
        return 75; // Start content after header
      }
      return y;
    };

    // Add order data
    orders.forEach((order, index) => {
      // Check if we need a new page
      rowTop = checkNewPage(rowTop);

      // Format date
      const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN');

      // Draw row - 
      currentLeft = 50;
      [
        order._id.toString().substring(0, 6) + "...",
        order.order_date.toLocaleDateString('en-IN'),
        order.address_id
          ? order.address_id.name.length > 10
            ? order.address_id.name.substring(0, 10) + "..."
            : order.address_id.name
          : order.temp_address.name
            ? order.temp_address.name.length > 10
              ? order.temp_address.name.substring(0, 10) + "..."
              : order.temp_address.name
            : 'Guest',
        order.payment_method.method,
        order.order_status,
        `₹${order?.discount?.toFixed(2)}`,
        `₹${order.total_price.toFixed(2)}`,
      ].forEach((text, i) => {
        doc.text(text, currentLeft, rowTop, {
          width: columnWidths[i],
          align: i >= 7 ? "right" : "left", // Right align monetary values
        });
        currentLeft += columnWidths[i];
      });

      // Add row separator
      rowTop += 20;
      doc
        .moveTo(50, rowTop)
        .lineTo(
          50 + columnWidths.reduce((sum, width) => sum + width, 0),
          rowTop
        )
        .stroke();

      // Move down for the next row
      rowTop += 5;
    });

    // Add footer with totals
    rowTop = checkNewPage(rowTop + 10);

    const totalsStartX =
      50 +
      columnWidths[0] +
      columnWidths[1] +
      columnWidths[2] +
      columnWidths[3] +
      columnWidths[4];

    doc.fontSize(9).font("Unicode");
    doc.text("Total Orders:", totalsStartX - 100, rowTop);
    doc.text(`${summary.totalOrders}`, totalsStartX, rowTop);

    rowTop += 15;
    doc.text("Total Subtotal:", totalsStartX - 100, rowTop);
    doc.text(`₹${summary.totalSubtotal.toFixed(2)}`, totalsStartX, rowTop);

    rowTop += 15;
    doc.text("Total Discounts:", totalsStartX - 100, rowTop);
    doc.text(`₹${summary.totalDiscounts.toFixed(2)}`, totalsStartX, rowTop);

    rowTop += 15;
    doc.fontSize(10).font("Unicode");
    doc.text("Total Revenue:", totalsStartX - 100, rowTop);
    doc.text(`₹${summary.totalRevenue.toFixed(2)}`, totalsStartX, rowTop);

    // Add generation timestamp

    if (doc.y + 30 > doc.page.height - 50) {
        doc.addPage();
    }

     // Set Y to bottom minus margin
       const footerY = doc.page.height - 30;

    doc
      .fontSize(8) 
      .font("Unicode")
      .text(
        `Generated on ${new Date().toLocaleString()}`,
        50,
        footerY,
        { align: "center" }
      );

    // Finalize the PDF and end the stream
    doc.end();
  } catch (error) {
    console.error("Error generating PDF export:", error);
    throw new Error("Failed to generate PDF export");
  }
}



async function exportToExcel(res, orders, summary) {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sales Report");

    // title
    worksheet.mergeCells("A1:I1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = `Sales Report - ${summary.reportType.toUpperCase()}`;
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: "center" };

    //summary section
    worksheet.mergeCells("A2:I2");
    worksheet.getCell("A2").value = "Summary";
    worksheet.getCell("A2").font = { size: 12, bold: true };

    worksheet.getCell("A3").value = "Date Range:";
    worksheet.getCell("B3").value = summary.dateRange;

    worksheet.getCell("A4").value = "Total Orders:";
    worksheet.getCell("B4").value = summary.totalOrders;

    worksheet.getCell("A5").value = "Total Subtotal:";
    worksheet.getCell("B5").value = summary.totalSubtotal;
    worksheet.getCell("B5").numFmt = "₹#,##0.00";

    worksheet.getCell("A6").value = "Total Discounts:";
    worksheet.getCell("B6").value = summary.totalDiscounts;
    worksheet.getCell("B6").numFmt = "₹#,##0.00";

    worksheet.getCell("A7").value = "Total Revenue:";
    worksheet.getCell("B7").value = summary.totalRevenue;
    worksheet.getCell("B7").numFmt = "₹#,##0.00";

    worksheet.getCell("A8").value = "Average Order Value:";
    worksheet.getCell("B8").value = summary.averageOrderValue;
    worksheet.getCell("B8").numFmt = "₹#,##0.00";

    //Style summary section
    for (let i = 3; i <= 8; i++) {
      worksheet.getCell(`A${i}`).font = { bold: true };
    }

    // Add a gap
    worksheet.addRow([]);

    // Add order details header
    const headerRow = worksheet.addRow([
      "Order ID",
      "Date",
      "Customer",
      "Payment Method",
      "Status",
      "Items",

      "Discount",
      "Total",
    ]);
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: "center" };

    // Add header styling
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFCCCCCC" },
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Add order data
    orders.forEach((order) => {
      const items = order.order_items ? order.order_items.length : 0;
      const row = worksheet.addRow([
        order.order_id.toString(),
        new Date(order.createdAt).toLocaleString(),
        order.user_id ? order.user_id.name : "Guest",
        order.payment_method.method,
        order.order_status,
        items,

        order.coupon_discount,
        order.total_price,
      ]);

      // Format currency cells
      row.getCell(7).numFmt = "₹#,##0.00"; // Subtotal
      row.getCell(8).numFmt = "₹#,##0.00"; // Discount
      row.getCell(9).numFmt = "₹#,##0.00"; // Total

      // Add alternating row colors
      if (worksheet.rowCount % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFEEEEEE" },
          };
        });
      }
    });

    // Adjust column widths
    worksheet.columns.forEach((column) => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = Math.min(maxLength + 2, 30);
    });

    // Set response headers for file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=sales_report_${summary.dateRange}.xlsx`
    );

    // Write to response
    await workbook.xlsx.write(res);
  } catch (error) {
    console.error("Error generating Excel export:", error);
    throw new Error("Failed to generate Excel export");
  }
}



module.exports = { getSalesReport, exportSalesReport, exportToPdf, getChartData, getTopItems }